// Build-time cache-busting token. Vite inlines import.meta.env at build,
// and the module-load Date.now() fallback gives a fresh token per build.
export const BUILD_VERSION: string =
  (import.meta.env.VITE_BUILD_ID as string | undefined) ?? String(Date.now());
