-- Optional structured fields for the map's Pulse Now layer.
-- Existing free-text where/when columns remain untouched for compatibility.
ALTER TABLE public.tribes
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz;

CREATE INDEX IF NOT EXISTS tribes_starts_at_idx
  ON public.tribes (starts_at)
  WHERE starts_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS events_starts_at_idx
  ON public.events (starts_at)
  WHERE starts_at IS NOT NULL;
