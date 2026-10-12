import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BUILD_VERSION } from "@/lib/buildVersion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Palawan — SANVIC" },
      { name: "description", content: "Interactive Palawan tourist map by SANVIC." },
      { property: "og:title", content: "Palawan — SANVIC" },
      { property: "og:description", content: "Interactive Palawan tourist map by SANVIC." },
    ],
  }),
  component: Index,
});

function Index() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const url = `/site/index.html?v=${encodeURIComponent(BUILD_VERSION)}`;

  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#060a10" }}>
      <iframe
        key={BUILD_VERSION}
        ref={iframeRef}
        src={url}
        title="Palawan SANVIC"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
