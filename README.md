# Fishing Boat Adventure 🚢

3D-Arcade-Browserspiel mit einem Fischkutter auf dem offenen Meer.

**Spielbar unter:** https://rolandkirsche.github.io/fishing-boat-adventure/

## Spielprinzip
- **2 Minuten** Zeit
- **Bojen** einsammeln = 10–30 Punkte je nach Farbe
- **Fische** fangen = 20 Punkte
- **Minen** ausweichen — kosten ein Leben (3 Leben total)

## Steuerung
| Taste | Aktion |
|-------|--------|
| W / Pfeil-runter | Vorwärts |
| S / Pfeil-hoch | Rückwärts |
| A / Pfeil-links | Links lenken |
| D / Pfeil-rechts | Rechts lenken |

## Projektstruktur
```
fishing-boat-adventure/
├── index.html          # Haupt-HTML, CSS, UI
├── js/
│   ├── game.js         # Haupt-Game-Loop, Renderer, Kamera
│   ├── water.js        # Wasser-Shader (Multi-Sinus-Wellen)
│   ├── entities.js     # Fische, Bojen, Minen — Builder & Spawner
│   ├── hud.js          # HUD-Updates, Flash-Nachrichten
│   └── state.js        # Globaler Spielzustand & Konstanten
└── assets/
    └── Fischerboot.glb # 3D-Modell (Blender-Export)
```

## Technik
- **Three.js** r165 (via CDN)
- **GLTFLoader** für das Schiffsmodell
- Kein Build-Tool nötig — läuft direkt im Browser
- Für lokale Entwicklung: lokaler HTTP-Server nötig (wegen ES Modules)

## Lokale Entwicklung
```bash
# Mit Python:
python3 -m http.server 8080

# Mit Node.js:
npx serve .

# Dann im Browser:
# http://localhost:8080
```

## Deployment
```bash
git add .
git commit -m "Deine Änderung"
git push
```
GitHub Pages veröffentlicht automatisch.
