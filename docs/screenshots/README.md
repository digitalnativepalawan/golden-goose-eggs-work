# Screenshots

UI captures for the main `README.md`. **None of the four below has been captured
yet** (checked 2026-11-09); the README lists them as pending rather than pointing
at files that do not exist.

| File          | View                                                  | Status  |
| ------------- | ----------------------------------------------------- | ------- |
| `tribes.png`  | Tribes / Pulse — live groups and happenings           | pending |
| `hunt.png`    | The Hunt — daily hunt and nearby discoveries          | pending |
| `place.png`   | Place detail — media, editorial, booking links        | pending |
| `today.png`   | Today — Tala, the San Vicente concierge               | pending |

Suggested: 1600px wide, PNG, under ~400 KB each. The README hero
(`docs/images/explore-map.png`) is already in place.

To capture, run the app and walk each surface:

```bash
npm run dev          # Vite prints the port; 8080 unless taken
```

Open `http://localhost:8080/site/index.html` (the static client directly — that
is what ships), not the React shell redirect. `public/site/assets/` holds the
photography used in the app if a hero image is needed for a capture.
