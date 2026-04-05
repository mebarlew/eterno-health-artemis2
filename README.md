# ETERNO HEALTH — Artemis II Moon Mission Tracker

Real-time 3D tracking of NASA's Artemis II mission to the Moon, powered by JPL Horizons ephemeris data. Built by [Eterno Health](https://www.eterno.health).

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Three.js](https://img.shields.io/badge/Three.js-0.183-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **3D Cartoon Visualization** — Interactive Three.js scene with toon-shaded Earth (with face), Moon (with craters), and a cartoon rocket representing the Orion spacecraft
- **Live Position Data** — Fetches real state vectors from NASA JPL Horizons API (spacecraft ID `-1024`) with auto-refresh every 5 minutes
- **Clickable Legend** — Click Earth, Moon, or Orion to fly the camera to that object with smart positioning
- **Mission Stats** — Distance from Earth/Moon, velocity, elapsed time, current phase, crew roster
- **Mission Timeline** — Visual progress bar with milestone markers (Launch, TLI, Lunar Flyby, Splashdown)
- **Bilingual** — Full English/German language toggle
- **Responsive** — Works on mobile through desktop

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **3D:** Three.js with MeshToonMaterial, OrbitControls
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **API:** NASA JPL Horizons (no API key required)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

### `GET /api/position`

Returns current Orion + Moon positions and full mission trajectory.

```json
{
  "current": {
    "orion": { "x": -112813, "y": -277787, "z": -25856, "vx": -0.136, "vy": -0.946, "vz": -0.083 },
    "moon": { "x": -268976, "y": -297026, "z": -33974 },
    "distanceFromEarth": 300934,
    "distanceFromMoon": 157553,
    "velocity": 0.96,
    "missionElapsed": { "days": 3, "hours": 14, "minutes": 22 }
  },
  "trajectory": [{ "x": "...", "y": "...", "z": "...", "timestamp": "..." }],
  "moonOrbit": []
}
```

Coordinates are Earth-centered J2000 ecliptic in km. Velocity in km/s.

**Data source:** [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) — ephemeris available from 2026-04-02 02:00 to 2026-04-10 23:00 TDB.

## Artemis II Mission

- **Launch:** April 1, 2026, 22:35 UTC from KSC LC-39B
- **Vehicle:** SLS Block 1 + Orion "Integrity"
- **Type:** Free-return lunar flyby (~10 days)
- **Crew:** Reid Wiseman (CDR), Victor Glover (PLT), Christina Koch (MS), Jeremy Hansen (MS, CSA)

## Deploy

```bash
npm run build
```

Optimized for [Vercel](https://vercel.com) deployment.

## License

MIT
