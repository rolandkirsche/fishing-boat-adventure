# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Lokale Entwicklung

```bash
python3 -m http.server 8080
# oder: npx serve .
```

Dann: http://localhost:8080 — ES Modules erfordern einen HTTP-Server, kein direktes Öffnen der Datei möglich.

## Deployment

```bash
git add index.html
git commit -m "..."
git push
```

GitHub Pages (Branch `main`) deployt automatisch unter https://rolandkirsche.github.io/fishing-boat-adventure/

## Architektur

Das Spiel ist ein **Single-File-HTML-Spiel**. Die gesamte Spiellogik steckt als `<script type="module">` in `index.html` — das ist der maßgebliche Quellcode. Die Dateien unter `js/` sind ein veralteter Refactoring-Versuch und werden von der Live-Version **nicht** verwendet.

`index.html` gliedert sich von oben nach unten in:

1. **CSS** – HUD, Overlay, Joystick, Animationen
2. **HTML** – HUD-Boxen, Overlay (Start/Ende), Joystick-Zone, Preview-Canvas
3. **Import-Map** – Three.js r165 via CDN
4. **Inline JS-Modul** (alles weitere):
   - Scene, Renderer, Kamera, Licht, Wasser-Shader, Sterne
   - `buildFish / buildMine / buildBuoy` – procedurale 3D-Meshes ohne externe Assets (außer dem Boot)
   - `BOAT_GLB_B64` – das GLB-Modell als Base64-String eingebettet (sehr langer String, nicht anfassen)
   - Spawn-Funktionen: `spawnBuoy / spawnBuoys`, `spawnOneFish / spawnFishes`, `spawnOneMine / spawnMines`
   - Wake-Partikel-Pool (`_wakePool`, `_bowPool`) – Meshes werden recycelt, nie neu erzeugt
   - Preview-Renderer – separater WebGL-Kontext für die rotierende Boot-Animation im Start-Overlay
   - `animate()` – Haupt-Loop: Physik, Kollision, Wake-Update, Kamera-Follow, Render

## Wichtige Konstanten & Werte

```
GAME_TIME  = 120   // Spielzeit in Sekunden
BUOY_COUNT = 18    // Bojen gleichzeitig
FISH_COUNT = 12    // Fische gleichzeitig
MINE_COUNT = 6     // Minen gleichzeitig
SPEED_MAX  = 14    // Max-Schiff-Geschwindigkeit
```

`BUOY_POINTS`: Orange=10, Pink=25, Grün=15, Gelb=20, Blau=30

## Steuerung (Hinweis zur Tastenbelegung)

W/Pfeil-oben = **Rückwärts**, S/Pfeil-unten = **Vorwärts** — das ist korrekt und durch die Schiffsmodell-Rotation (`model.rotation.y = Math.PI`) bedingt, nicht ein Bug. Touch-Geräte verwenden den virtuellen Joystick (`#joystick-zone`), der per CSS-Media-Query `(pointer: coarse)` eingeblendet wird.

## Wasser-Shader

Der Wasser-Shader in `waterMat` (ShaderMaterial) verwendet 8 überlagerte Sinus-Wellen im Vertex-Shader für die Wellenform sowie finite Differenzen zur Normalenberechnung. Das Uniform `uTime` wird jeden Frame in `animate()` aktualisiert. Segmentanzahl: 80×80 — Änderungen wirken sich direkt auf GPU-Last aus.

## Bekannte Besonderheiten

- **Zwei WebGL-Kontexte**: `renderer` (Spiel) und `previewRenderer` (Overlay-Vorschau) laufen parallel; `previewAnimRunning` schaltet die Vorschau-Loop beim Spielstart ab.
- **Spielfeld-Grenze**: Soft-Boundary bei Radius 80 — Schiff wird zurückgedrängt, kein hartes Limit.
- **Mine-Respawn**: 10 Sekunden nach Kollision erscheint eine neue Mine (`spawnOneMine`).
- **`disposeMesh()`**: Muss bei allen entfernten Szenen-Objekten aufgerufen werden, um GPU-Speicher freizugeben.
