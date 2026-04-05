"use client";

import { useI18n } from "@/lib/i18n";
import type { MissionData } from "@/types/mission";
import { CREW } from "@/types/mission";

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-[#0f2420] border border-[#1a3a30] rounded-lg p-4">
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

  if (!data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t("missionElapsed")} value={elapsed} />
        <StatCard label={t("missionDay")} value={String(missionElapsed.days + 1)} />
        <StatCard label={t("distanceEarth")} value={formatNumber(distanceFromEarth)} unit={t("km")} />
        <StatCard label={t("distanceMoon")} value={formatNumber(distanceFromMoon)} unit={t("km")} />
        <div className="col-span-2">
          <StatCard label={t("velocity")} value={velocity.toFixed(3)} unit={t("kms")} />
        </div>
      </div>

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
