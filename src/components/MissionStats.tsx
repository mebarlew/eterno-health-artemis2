"use client";

import { useState, useEffect } from "react";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import type { MissionData } from "@/types/mission";
import { CREW, LAUNCH_TIME } from "@/types/mission";

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function getCurrentPhase(elapsedDays: number): { current: TranslationKey; next: TranslationKey | null } {
  if (elapsedDays < 0.2) return { current: "launch", next: "tli" };
  if (elapsedDays < 2) return { current: "tli", next: "outbound" };
  if (elapsedDays < 5.5) return { current: "outbound", next: "lunarFlyby" };
  if (elapsedDays < 7) return { current: "lunarFlyby", next: "returnCoast" };
  if (elapsedDays < 10) return { current: "returnCoast", next: "reentry" };
  return { current: "reentry", next: null };
}

function StatCard({ label, value, unit, highlight }: { label: string; value: string; unit?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? "bg-[#88E59C]/10 border border-[#88E59C]/30" : "bg-[#0f2420] border border-[#1a3a30]"}`}>
      <p className="text-xs uppercase tracking-wider text-[#88E59C]/60 mb-1">{label}</p>
      <p className="text-xl font-mono font-bold text-[#F4F4F9]">
        {value}
        {unit && <span className="text-sm text-[#88E59C]/80 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function MissionStats({ data }: { data: MissionData | null }) {
  const { t, lang } = useI18n();
  const [elapsedDays, setElapsedDays] = useState(0);

  useEffect(() => {
    const update = () => setElapsedDays((Date.now() - LAUNCH_TIME.getTime()) / 86400000);
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-[#0f2420] border border-[#1a3a30] rounded-lg p-4 animate-pulse">
            <div className="h-3 w-20 bg-[#1a3a30] rounded mb-2" />
            <div className="h-6 w-32 bg-[#1a3a30] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { missionElapsed, distanceFromEarth, distanceFromMoon, velocity } = data.current;
  const elapsed = `${missionElapsed.days}${t("days")} ${missionElapsed.hours}${t("hours")} ${missionElapsed.minutes}${t("minutes")}`;
  const phase = getCurrentPhase(elapsedDays);

  return (
    <div className="space-y-3">
      {/* Current phase - highlighted */}
      <div className="bg-[#88E59C]/10 border border-[#88E59C]/30 rounded-lg p-4">
        <p className="text-xs uppercase tracking-wider text-[#88E59C]/60 mb-1">{t("currentPhase")}</p>
        <p className="text-lg font-bold text-[#88E59C]">{t(phase.current)}</p>
        {phase.next && (
          <p className="text-xs text-[#F4F4F9]/40 mt-1">{t("nextPhase")}: {t(phase.next)}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t("missionElapsed")} value={elapsed} />
        <StatCard label={t("missionDay")} value={String(missionElapsed.days + 1)} />
        <StatCard label={t("distanceEarth")} value={formatNumber(distanceFromEarth)} unit={t("km")} />
        <StatCard label={t("distanceMoon")} value={formatNumber(distanceFromMoon)} unit={t("km")} />
      </div>

      <StatCard label={t("velocity")} value={velocity.toFixed(3)} unit={t("kms")} />

      <div className="bg-[#0f2420] border border-[#1a3a30] rounded-lg p-4">
        <p className="text-xs uppercase tracking-wider text-[#88E59C]/60 mb-3">{t("crew")}</p>
        <div className="space-y-2">
          {CREW.map((member) => (
            <div key={member.name} className="flex items-center justify-between text-sm">
              <span className="text-[#F4F4F9]">{member.name}</span>
              <span className="text-[#88E59C]/60 text-xs">
                {member.role[lang]} · {member.agency}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0f2420] border border-[#1a3a30] rounded-lg p-4 space-y-1.5">
        <p className="text-xs text-[#88E59C]/60">{t("spacecraft")}</p>
        <p className="text-xs text-[#88E59C]/60">{t("vehicle")}</p>
        <p className="text-xs text-[#88E59C]/60">{t("launchSite")}</p>
        <p className="text-xs text-[#88E59C]/60">{t("missionType")}</p>
      </div>
    </div>
  );
}
