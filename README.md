# Glitch Run

Een speelbare Three.js endless runner met Casper, Bas, Tamara, Lisette en Laurens.

## Live spelen

Na het activeren van GitHub Pages is de game beschikbaar op:

<https://b0x41s.github.io/glitch-run/>

## Gameplay

- Automatisch vooruit rennen door een procedureel opgebouwde cyberwereld
- Hoge firewalls ontwijken en lage barrières overspringen
- Data Shards verzamelen voor score, combo, energie en lagere glitchdruk
- Overclock gebruiken voor extra snelheid
- Drie integriteitspunten en een glitchmuur die steeds dichterbij komt
- Toenemende snelheid en obstakeldichtheid per zone
- Lokale topscore in de browser
- Characterselectie met buiganimatie, pauzescherm, game-over en opnieuw spelen
- Wisselbare volgcamera en frontale Crash-camera
- Procedurele muziek en geluidseffecten via de Web Audio API
- Desktop en mobiele besturing

## Lokaal starten

```bash
npm install
npm run dev
```

Open de URL die Vite toont, normaal `http://localhost:5173`.

## Productiebuild maken

```bash
npm run build
npm run preview
```

## GitHub Pages

De workflow in `.github/workflows/deploy-pages.yml` bouwt en publiceert de game automatisch na iedere push naar `main`.

Activeer dit eenmalig via:

```text
Repository → Settings → Pages → Build and deployment → Source → GitHub Actions
```

## Besturing

- `A` en `D`, of de pijltjestoetsen, sturen naar links en rechts
- `Spatie`, springen
- `Shift`, overclock gebruiken zolang energie beschikbaar is
- `W`, lichte versnelling
- `S`, afremmen
- `C`, wisselen tussen de volgcamera en de frontale Crash-camera
- `M`, geluid aan of uit
- `Esc`, pauzeren
- `R`, opnieuw starten na game-over

## Techniek

- Three.js
- Vite
- glTF/GLB characters met skelet en animaties
- Web Audio API
- GitHub Actions en GitHub Pages
