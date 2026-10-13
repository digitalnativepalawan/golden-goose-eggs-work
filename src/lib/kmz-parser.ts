import { unzipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";

type XmlNode = Record<string, unknown>;

export type KmzLocation = {
  name: string;
  type: string;
  barangay: string;
  latitude: number;
  longitude: number;
  description: string;
  sourceRecordId: string;
  sourceFolder: string;
  warnings: string[];
};

export type KmzParseResult = {
  documentName: string;
  totalPlacemarks: number;
  ignoredCount: number;
  locations: KmzLocation[];
};

const asArray = <T,>(value: T | T[] | undefined): T[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];

function valueText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (value && typeof value === "object") {
    const node = value as XmlNode;
    return valueText(node["#text"] ?? node["#cdata"] ?? "");
  }
  return "";
}

function cleanDescription(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/^description:\s*/i, "")
    .slice(0, 5000);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const communityCenters = [
  { name: "Binga", latitude: 10.769, longitude: 119.312 },
  { name: "New Canipo", latitude: 10.698, longitude: 119.325 },
  { name: "Sto. Nino", latitude: 10.649, longitude: 119.331 },
  { name: "Alimanguan", latitude: 10.606, longitude: 119.325 },
  { name: "San Isidro", latitude: 10.5658, longitude: 119.3037 },
  { name: "New Agutaya", latitude: 10.543, longitude: 119.284 },
  { name: "Poblacion", latitude: 10.524, longitude: 119.272 },
  { name: "Kemdeng", latitude: 10.486, longitude: 119.264 },
  { name: "Port Barton", latitude: 10.411, longitude: 119.179 },
  { name: "Caruray", latitude: 10.32, longitude: 119.033 },
] as const;

function distanceMeters(a: number, b: number, c: number, d: number) {
  const radians = (deg: number) => (deg * Math.PI) / 180;
  const radius = 6_371_000;
  const dLat = radians(c - a);
  const dLon = radians(d - b);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a)) * Math.cos(radians(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function barangayFromCoordinates(latitude: number, longitude: number): string {
  const nearest = communityCenters
    .map((c) => ({ ...c, distance: distanceMeters(latitude, longitude, c.latitude, c.longitude) }))
    .sort((l, r) => l.distance - r.distance)[0];
  return nearest && nearest.distance <= 40_000 ? nearest.name : "Unassigned";
}

function barangayFromFolder(folder: string): string {
  const key = normalize(folder);
  if (key.includes("port barton")) return "Port Barton";
  if (key.includes("new agutaya")) return "New Agutaya";
  if (key.includes("alimanguan")) return "Alimanguan";
  if (key.includes("san isidro")) return "San Isidro";
  if (key.includes("sto nino") || key.includes("santo nino")) return "Sto. Nino";
  if (key.includes("poblacion")) return "Poblacion";
  if (key.includes("kemdeng")) return "Kemdeng";
  if (key.includes("caruray")) return "Caruray";
  if (key.includes("new canipo")) return "New Canipo";
  if (key.includes("binga")) return "Binga";
  return "Unassigned";
}

function inferType(name: string, description: string): string {
  const text = normalize(`${name} ${description}`);
  if (/\b(resort|hotel|inn|lodge|guesthouse|guest house|homestay|hostel|cottages?|villa|rooms?|pension|huts?|camp)\b/.test(text)) return "stays";
  if (/\b(cafe|coffee|bakery)\b/.test(text)) return "food";
  if (/\b(restaurant|resto|grill|bistro|kitchen|pizza|eatery)\b/.test(text)) return "food";
  if (/\b(tour|tours|travel|excursion)\b/.test(text)) return "adventure";
  if (/\b(transport|transfer|van hire|car hire)\b/.test(text)) return "adventure";
  if (/\bbeach\b/.test(text) && !/\b(resort|hotel|inn|lodge|guest|homestay|hostel|cottages?|villa|rooms?)\b/.test(text)) return "beaches";
  return "adventure";
}

function dataFields(placemark: XmlNode): Record<string, string> {
  const extended = placemark.ExtendedData as XmlNode | undefined;
  const entries = asArray<XmlNode>(extended?.Data as XmlNode | XmlNode[] | undefined);
  return Object.fromEntries(
    entries
      .map((entry) => [valueText(entry["@_name"]), valueText(entry.value)] as const)
      .filter(([key]) => key),
  );
}

function pointCoordinates(placemark: XmlNode): string {
  const direct = placemark.Point as XmlNode | undefined;
  if (direct) return valueText(direct.coordinates);
  const multi = placemark.MultiGeometry as XmlNode | undefined;
  const point = asArray<XmlNode>(multi?.Point as XmlNode | XmlNode[] | undefined)[0];
  return point ? valueText(point.coordinates) : "";
}

export function parseKmz(bytes: Uint8Array): KmzParseResult {
  const files = unzipSync(bytes, { filter: (file) => file.name.toLowerCase().endsWith(".kml") });
  const kmlName = Object.keys(files).find((name) => name.toLowerCase().endsWith(".kml"));
  if (!kmlName) throw new Error("This KMZ does not contain a KML document.");
  if (files[kmlName].byteLength > 12 * 1024 * 1024) throw new Error("The expanded KML is too large to import safely.");

  const xml = new TextDecoder().decode(files[kmlName]);
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: false,
    parseTagValue: false,
    cdataPropName: "#cdata",
  });
  const parsed = parser.parse(xml) as XmlNode;
  const document = ((parsed.kml as XmlNode | undefined)?.Document ?? parsed.Document) as XmlNode | undefined;
  if (!document) throw new Error("The KML document could not be read.");

  const documentName = valueText(document.name) || kmlName;
  const documentKey = normalize(documentName);
  const isSightseeingBatch = documentKey.includes("tourist destination") || documentKey.includes("sightseeing");
  const locations: KmzLocation[] = [];
  let totalPlacemarks = 0;

  const visit = (container: XmlNode, folders: string[]) => {
    for (const placemark of asArray<XmlNode>(container.Placemark as XmlNode | XmlNode[] | undefined)) {
      totalPlacemarks += 1;
      const coordinates = pointCoordinates(placemark).split(/\s+/).find(Boolean) || "";
      if (!coordinates) continue;
      const [longitude, latitude] = coordinates.split(",").map(Number);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      if (latitude < 8 || latitude > 13 || longitude < 116 || longitude > 122) continue;

      const fields = dataFields(placemark);
      const name = valueText(placemark.name).slice(0, 180);
      if (!name) continue;
      if (isSightseeingBatch && /\b(choke\s*point|chokepoint|waypoint|start\s*point|end\s*point)\b/i.test(name)) continue;

      const sourceFolder = folders.at(-1) || "";
      const folderBarangay = barangayFromFolder(sourceFolder);
      const barangay = folderBarangay === "Unassigned" ? barangayFromCoordinates(latitude, longitude) : folderBarangay;
      const rawDescription = valueText(placemark.description) || fields.description || "";
      const description = cleanDescription(rawDescription);
      const warnings: string[] = [];
      if (barangay === "Unassigned") warnings.push("Barangay could not be identified.");
      else if (folderBarangay === "Unassigned") warnings.push("Barangay inferred from coordinates — please review.");
      if (!description) warnings.push("No usable description.");
      if (!isSightseeingBatch) warnings.push("Category was inferred — please review.");

      locations.push({
        name,
        type: isSightseeingBatch ? "adventure" : inferType(name, description),
        barangay,
        latitude,
        longitude,
        description,
        sourceRecordId: fields.id || fields.ID || valueText(placemark["@_id"]),
        sourceFolder,
        warnings,
      });
    }
    for (const folder of asArray<XmlNode>(container.Folder as XmlNode | XmlNode[] | undefined)) {
      visit(folder, [...folders, valueText(folder.name)]);
    }
  };

  visit(document, []);
  return { documentName, totalPlacemarks, ignoredCount: totalPlacemarks - locations.length, locations };
}