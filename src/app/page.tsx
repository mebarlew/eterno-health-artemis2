"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { I18nProvider, useI18n } from "@/lib/i18n";
import type { MissionData } from "@/types/mission";
import type { Scene3DHandle } from "@/components/Scene3D";
import Header from "@/components/Header";
import MissionStats from "@/components/MissionStats";
import MissionTimeline from "@/components/MissionTimeline";

const Scene3D = dynamic(() => import("@/components/Scene3D"), { ssr: false });

const REFRESH_INTERVAL = 5 * 60 * 1000;

function LegendItem({
  color,
  label,
  shape = "circle",
  onClick,
}: {
  color: string;
  label: string;
  shape?: "circle" | "line";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors w-full text-left group"
    >
      {shape === "circle" ? (
        <span className="w-3 h-3 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: color }} />
      ) : (
        <span className="w-5 h-0.5 rounded shrink-0 group-hover:scale-x-125 transition-transform" style={{ backgroundColor: color }} />
      )}
      <span className="text-xs text-[#F4F4F9]/80 group-hover:text-[#F4F4F9] transition-colors">{label}</span>
    </button>
  );
}

function TrackerApp() {
  const { t } = useI18n();
  const [data, setData] = useState<MissionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const sceneRef = useRef<Scene3DHandle>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/position");
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const focusOn = (target: "earth" | "moon" | "orion") => {
    sceneRef.current?.focusOn(target);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080f0d]">
      <Header />

      {/* Mobile title */}
      <div className="sm:hidden px-4 pt-4">
        <h1 className="text-lg font-semibold text-[#F4F4F9]">{t("title")}</h1>
        <p className="text-[10px] text-[#88E59C]/50">{t("subtitle")}</p>
      </div>

      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
        {/* 3D Scene + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
          <div className="relative bg-[#0a1612] border border-[#1a3a30] rounded-xl overflow-hidden">
            <div className="h-[400px] md:h-[520px] lg:h-[580px]">
              <Scene3D ref={sceneRef} data={data} />
            </div>

            {/* Clickable legend */}
            <div className="absolute bottom-4 left-4 bg-[#0a1612]/90 backdrop-blur-sm border border-[#1a3a30] rounded-lg p-2 min-w-[140px]">
              <p className="text-[10px] text-[#88E59C]/50 uppercase tracking-wider px-2 mb-1">{t("legend")}</p>
              <LegendItem color="#3498db" label={t("earth")} onClick={() => focusOn("earth")} />
              <LegendItem color="#d5d8dc" label={t("moon")} onClick={() => focusOn("moon")} />
              <LegendItem color="#88E59C" label={t("orion")} onClick={() => focusOn("orion")} />
              <LegendItem color="#88E59C" label={t("trajectoryLine")} shape="line" />
            </div>

            {loading && (
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
