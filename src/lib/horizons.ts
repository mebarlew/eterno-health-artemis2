import type { StateVector, TrajectoryPoint } from "@/types/mission";

const HORIZONS_API = "https://ssd.jpl.nasa.gov/api/horizons.api";
const ORION_ID = "-1024";
const MOON_ID = "301";
const EARTH_CENTER = "500@399";

function buildUrl(command: string, startTime: string, stopTime: string, stepSize: string): string {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${command}'`,
    OBJ_DATA: "NO",
    MAKE_EPHEM: "YES",
    EPHEM_TYPE: "VECTORS",
    CENTER: EARTH_CENTER,
    START_TIME: `'${startTime}'`,
    STOP_TIME: `'${stopTime}'`,
    STEP_SIZE: `'${stepSize}'`,
    OUT_UNITS: "KM-S",
    REF_PLANE: "ECLIPTIC",
    REF_SYSTEM: "J2000",
    VEC_TABLE: "2",
    CSV_FORMAT: "YES",
  });
  return `${HORIZONS_API}?${params.toString()}`;
}

interface ParsedVector {
  timestamp: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

function parseHorizonsResponse(jsonText: string): ParsedVector[] {
  const data = JSON.parse(jsonText);
  const result: string = data.result;

  const soeIndex = result.indexOf("$$SOE");
  const eoeIndex = result.indexOf("$$EOE");
  if (soeIndex === -1 || eoeIndex === -1) return [];

  const block = result.slice(soeIndex + 5, eoeIndex).trim();
  const lines = block.split("\n").filter((l) => l.trim().length > 0);

  const vectors: ParsedVector[] = [];

  for (const line of lines) {
    const parts = line.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length < 7) continue;

    const jd = parseFloat(parts[0]);
    const x = parseFloat(parts[2]);
    const y = parseFloat(parts[3]);
    const z = parseFloat(parts[4]);
    const vx = parseFloat(parts[5]);
    const vy = parseFloat(parts[6]);
    const vz = parseFloat(parts[7]);

    if (isNaN(jd) || isNaN(x)) continue;

    const unixMs = (jd - 2440587.5) * 86400000;
    const timestamp = new Date(unixMs).toISOString();

    vectors.push({ timestamp, x, y, z, vx, vy, vz });
  }

  return vectors;
}

function findClosest(vectors: ParsedVector[], targetTime: Date): ParsedVector | null {
  if (vectors.length === 0) return null;
  let closest = vectors[0];
  let minDiff = Math.abs(new Date(closest.timestamp).getTime() - targetTime.getTime());

  for (const v of vectors) {
    const diff = Math.abs(new Date(v.timestamp).getTime() - targetTime.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = v;
    }
  }
  return closest;
}

export async function fetchMissionData() {
  const now = new Date();
  const orionStart = "2026-04-02 02:00";
  const orionEnd = "2026-04-10 23:00";
  const moonStart = "2026-04-01";
  const moonEnd = "2026-04-12";

  const [orionRes, moonRes] = await Promise.all([
    fetch(buildUrl(ORION_ID, orionStart, orionEnd, "3h")),
    fetch(buildUrl(MOON_ID, moonStart, moonEnd, "3h")),
  ]);

  if (!orionRes.ok || !moonRes.ok) {
    throw new Error("Failed to fetch from JPL Horizons");
  }

  const orionVectors = parseHorizonsResponse(await orionRes.text());
  const moonVectors = parseHorizonsResponse(await moonRes.text());

  if (orionVectors.length === 0 || moonVectors.length === 0) {
    throw new Error("No ephemeris data returned from Horizons");
  }

  const currentOrion = findClosest(orionVectors, now)!;
  const currentMoon = findClosest(moonVectors, now)!;

  const distanceFromEarth = Math.sqrt(
    currentOrion.x ** 2 + currentOrion.y ** 2 + currentOrion.z ** 2
  );
  const distanceFromMoon = Math.sqrt(
    (currentOrion.x - currentMoon.x) ** 2 +
    (currentOrion.y - currentMoon.y) ** 2 +
    (currentOrion.z - currentMoon.z) ** 2
  );
  const velocity = Math.sqrt(
    currentOrion.vx ** 2 + currentOrion.vy ** 2 + currentOrion.vz ** 2
  );

  const launchTime = new Date("2026-04-01T22:35:12Z");
  const elapsedMs = now.getTime() - launchTime.getTime();
  const totalMinutes = Math.floor(elapsedMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const trajectory: TrajectoryPoint[] = orionVectors.map((v) => ({
    x: v.x,
    y: v.y,
    z: v.z,
    timestamp: v.timestamp,
  }));

  const moonOrbit: TrajectoryPoint[] = moonVectors.map((v) => ({
    x: v.x,
    y: v.y,
    z: v.z,
    timestamp: v.timestamp,
  }));

  const orionState: StateVector = {
    x: currentOrion.x,
    y: currentOrion.y,
    z: currentOrion.z,
    vx: currentOrion.vx,
    vy: currentOrion.vy,
    vz: currentOrion.vz,
  };

  return {
    current: {
      orion: orionState,
      moon: { x: currentMoon.x, y: currentMoon.y, z: currentMoon.z },
      timestamp: currentOrion.timestamp,
      distanceFromEarth: Math.round(distanceFromEarth),
      distanceFromMoon: Math.round(distanceFromMoon),
      velocity: Math.round(velocity * 1000) / 1000,
      missionElapsed: { days, hours, minutes },
    },
    trajectory,
    moonOrbit,
  };
}
