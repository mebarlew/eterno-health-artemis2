"use client";

import { useEffect, useState, useCallback, useRef, type ComponentType } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n";
import type { MissionData } from "@/types/mission";
import type { FocusFn, FocusTarget } from "@/components/Scene3D";
import Header from "@/components/Header";
import MissionStats from "@/components/MissionStats";
import MissionTimeline from "@/components/MissionTimeline";

const REFRESH_INTERVAL = 5 * 60 * 1000;

function NavButton({
  color,
  label,
  active,
  onClick,
}: {
  color: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-[#88E59C]/15 text-[#88E59C] border border-[#88E59C]/40"
          : "bg-[#0f2420] text-[#F4F4F9]/70 border border-[#1a3a30] hover:bg-[#1a3a30] hover:text-[#F4F4F9]"
      }`}
    >
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </button>
  );
}

function TrackerApp() {
  const { t } = useI18n();
  const [data, setData] = useState<MissionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const focusRef = useRef<FocusFn | null>(null);
  const [activeNav, setActiveNav] = useState<FocusTarget>("overview");
  const abortRef = useRef<AbortController | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Scene3D, setScene3D] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    import("@/components/Scene3D").then((mod) => setScene3D(() => mod.default));
  }, []);

  const handleSceneReady = useCallback((fn: FocusFn) => {
    focusRef.current = fn;
  }, []);

  const fetchData = useCallback(async () => {
    // FIX #13: cancel previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // FIX #14: show loading on retry
    setLoading(true);
    try {
      const res = await fetch("/api/position", { signal: controller.signal });
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchData]);

  const focusOn = useCallback((target: FocusTarget) => {
    setActiveNav(target);
    focusRef.current?.(target);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080f0d]">
      <Header />

      {/* Mobile title */}
      <div className="sm:hidden px-4 pt-4">
        <h1 className="text-lg font-semibold text-[#F4F4F9]">{t("title")}</h1>
        <p className="text-[10px] text-[#88E59C]/50">{t("subtitle")}</p>
      </div>

      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
        {/* Navigation bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[#88E59C]/50 uppercase tracking-wider mr-1">{t("nav")}</span>
          <NavButton color="#607d8b" label={t("overview")} active={activeNav === "overview"} onClick={() => focusOn("overview")} />
          <NavButton color="#3498db" label={t("earth")} active={activeNav === "earth"} onClick={() => focusOn("earth")} />
          <NavButton color="#d5d8dc" label={t("moon")} active={activeNav === "moon"} onClick={() => focusOn("moon")} />
          <NavButton color="#88E59C" label={t("orion")} active={activeNav === "orion"} onClick={() => focusOn("orion")} />
        </div>

        {/* 3D Scene + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
          <div className="relative bg-[#0a1612] border border-[#1a3a30] rounded-xl overflow-hidden">
            <div className="h-[400px] md:h-[520px] lg:h-[580px]">
              {Scene3D && <Scene3D data={data} onReady={handleSceneReady} />}
            </div>

            {loading && !data && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#080f0d]/80">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#88E59C]/30 border-t-[#88E59C] rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-[#88E59C]/60">{t("loading")}</p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#080f0d]/80">
                <div className="text-center">
                  <p className="text-sm text-red-400 mb-3">{t("error")}</p>
                  <button
                    onClick={fetchData}
                    className="px-4 py-2 text-xs bg-[#1a3a30] text-[#88E59C] rounded-lg hover:bg-[#243d35] transition-colors"
                  >
                    {t("retry")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <MissionStats data={data} />
          </div>
        </div>

        {/* Timeline */}
        <MissionTimeline />

        {/* Footer */}
        <footer className="border-t border-[#1a3a30] pt-4 pb-6 flex items-center justify-between text-[10px] text-[#385759]">
          <span>Eterno Health GmbH</span>
          <span>
            Data: NASA/JPL Horizons &middot;{" "}
            <a
              href="https://www.eterno.health"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#88E59C]/40 hover:text-[#88E59C]/60 transition-colors"
            >
              eterno.health
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <I18nProvider>
      <TrackerApp />
    </I18nProvider>
  );
}
