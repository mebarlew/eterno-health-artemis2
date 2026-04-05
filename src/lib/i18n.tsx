"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Lang } from "@/types/mission";

const translations = {
  en: {
    title: "Artemis II Moon Mission",
    subtitle: "Real-Time Tracking powered by NASA JPL Horizons",
    loading: "Connecting to NASA JPL Horizons...",
    error: "Unable to fetch mission data",
    retry: "Retry",
    distanceEarth: "Distance from Earth",
    distanceMoon: "Distance from Moon",
    velocity: "Velocity",
    missionElapsed: "Mission Elapsed",
    crew: "Crew",
    commander: "Commander",
    pilot: "Pilot",
    missionSpecialist: "Mission Specialist",
    timeline: "Mission Timeline",
    launch: "Launch",
    tli: "Trans-Lunar Injection",
    outbound: "Outbound Coast",
    lunarFlyby: "Lunar Flyby",
    returnCoast: "Return Coast",
    reentry: "Re-entry & Splashdown",
    about: "About",
    aboutText: "Eterno Health operates modern, multi-specialty medical centers across Germany. We believe primary care must become more human — for doctors and patients alike.",
    locations: "Locations",
    berlin: "Berlin",
    frankfurt: "Frankfurt",
    hamburgK: "Hamburg Kaufmannshaus",
    hamburgS: "Hamburg Schauenburger Hof",
    services: "Healthcare Innovation",
    servicesText: "From preventive medicine to regenerative treatments — we combine cutting-edge technology with holistic care to strengthen your health.",
    days: "d",
    hours: "h",
    minutes: "m",
    km: "km",
    kms: "km/s",
    earth: "Earth",
    moon: "Moon",
    orion: "Orion",
    legend: "Legend",
    trajectoryLine: "Trajectory",
    autoRefresh: "Auto-refresh every 5 min",
    missionDay: "Mission Day",
    spacecraft: "Spacecraft: Orion \"Integrity\"",
    vehicle: "Vehicle: SLS Block 1",
    launchSite: "Launch: KSC LC-39B",
    missionType: "Free-Return Lunar Flyby",
  },
  de: {
    title: "Artemis II Mondmission",
    subtitle: "Echtzeit-Tracking mit NASA JPL Horizons",
    loading: "Verbindung zu NASA JPL Horizons...",
    error: "Missionsdaten konnten nicht abgerufen werden",
    retry: "Erneut versuchen",
    distanceEarth: "Entfernung zur Erde",
    distanceMoon: "Entfernung zum Mond",
    velocity: "Geschwindigkeit",
    missionElapsed: "Missionsdauer",
    crew: "Besatzung",
    commander: "Kommandant",
    pilot: "Pilot",
    missionSpecialist: "Missionsspezialist",
    timeline: "Missions-Zeitplan",
    launch: "Start",
    tli: "Translunar-Einschuss",
    outbound: "Hinflug",
    lunarFlyby: "Mond-Vorbeiflug",
    returnCoast: "Rückflug",
    reentry: "Wiedereintritt & Wasserung",
    about: "Über uns",
    aboutText: "Eterno Health betreibt moderne, multidisziplinäre Gesundheitszentren in ganz Deutschland. Wir glauben, dass die Primärversorgung menschlicher werden muss — für Ärzte und Patienten gleichermaßen.",
    locations: "Standorte",
    berlin: "Berlin",
    frankfurt: "Frankfurt",
    hamburgK: "Hamburg Kaufmannshaus",
    hamburgS: "Hamburg Schauenburger Hof",
    services: "Gesundheits-Innovation",
    servicesText: "Von Präventivmedizin bis zu regenerativen Behandlungen — wir verbinden modernste Technologie mit ganzheitlicher Versorgung, um Ihre Gesundheit zu stärken.",
    days: "T",
    hours: "Std",
    minutes: "Min",
    km: "km",
    kms: "km/s",
    earth: "Erde",
    moon: "Mond",
    orion: "Orion",
    legend: "Legende",
    trajectoryLine: "Flugbahn",
    autoRefresh: "Auto-Aktualisierung alle 5 Min",
    missionDay: "Missionstag",
    spacecraft: 'Raumschiff: Orion \u201EIntegrity\u201C',
    vehicle: "Trägerrakete: SLS Block 1",
    launchSite: "Start: KSC LC-39B",
    missionType: "Freie Rückkehr-Mondumfliegung",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface I18nContextValue {
  lang: Lang;
  t: (key: TranslationKey) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "de" : "en"));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key],
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
