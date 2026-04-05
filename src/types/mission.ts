export interface StateVector {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  timestamp: string;
}

export interface MissionData {
  current: {
    orion: StateVector;
    moon: { x: number; y: number; z: number };
    timestamp: string;
    distanceFromEarth: number;
    distanceFromMoon: number;
    velocity: number;
    missionElapsed: { days: number; hours: number; minutes: number };
  };
  trajectory: TrajectoryPoint[];
  moonOrbit: TrajectoryPoint[];
}

export type Lang = "en" | "de";

export interface CrewMember {
  name: string;
  role: { en: string; de: string };
  agency: string;
}

export const CREW: CrewMember[] = [
  { name: "Reid Wiseman", role: { en: "Commander", de: "Kommandant" }, agency: "NASA" },
  { name: "Victor Glover", role: { en: "Pilot", de: "Pilot" }, agency: "NASA" },
  { name: "Christina Koch", role: { en: "Mission Specialist", de: "Missionsspezialistin" }, agency: "NASA" },
  { name: "Jeremy Hansen", role: { en: "Mission Specialist", de: "Missionsspezialist" }, agency: "CSA" },
];

export const LAUNCH_TIME = new Date("2026-04-01T22:35:12Z");
