"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { LAUNCH_TIME } from "@/types/mission";

interface Milestone {
  key: "launch" | "tli" | "outbound" | "lunarFlyby" | "returnCoast" | "reentry";
  dayOffset: number;
}

const MILESTONES: Milestone[] = [
  { key: "launch", dayOffset: 0 },
  { key: "tli", dayOffset: 0.2 },
  { key: "outbound", dayOffset: 2 },
  { key: "lunarFlyby", dayOffset: 5.5 },
  { key: "returnCoast", dayOffset: 7 },
  { key: "reentry", dayOffset: 10 },
];

const TOTAL_DAYS = 10;

export default function MissionTimeline() {
  const { t } = useI18n();
  const [elapsedDays, setElapsedDays] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setElapsedDays((now.getTime() - LAUNCH_TIME.getTime()) / 86400000);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.min(Math.max(elapsedDays / TOTAL_DAYS, 0), 1);

  return (
    <div className="bg-[#0f2420] border border-[#1a3a30] rounded-xl p-6">
      <h3 className="text-xs uppercase tracking-wider text-[#88E59C]/60 mb-6">{t("timeline")}</h3>

      <div className="relative">
        <div className="h-1 bg-[#1a3a30] rounded-full w-full" />
        <div
          className="absolute top-0 left-0 h-1 bg-[#88E59C] rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className="absolute -top-1 w-3 h-3 bg-[#88E59C] rounded-full shadow-[0_0_8px_#88E59C] transition-all duration-1000"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />

        {/* Milestone dots positioned by dayOffset */}
        {MILESTONES.map((m) => {
          const pos = (m.dayOffset / TOTAL_DAYS) * 100;
          const isPast = elapsedDays >= m.dayOffset;
          return (
            <div
              key={m.key}
              className={`absolute -top-0.5 w-2 h-2 rounded-full ${isPast ? "bg-[#88E59C]" : "bg-[#385759]"}`}
              style={{ left: `calc(${pos}% - 4px)` }}
            />
          );
        })}

        {/* Milestone labels below, also positioned by dayOffset */}
        <div className="relative mt-4 h-8">
          {MILESTONES.map((m, i) => {
            const pos = (m.dayOffset / TOTAL_DAYS) * 100;
            const isPast = elapsedDays >= m.dayOffset;
            // Alternate label heights so they don't overlap
            const topOffset = i % 2 === 0 ? 0 : 16;
            // Keep first label left-aligned, last right-aligned, others centered
            const transform = i === 0 ? "translateX(0)" : i === MILESTONES.length - 1 ? "translateX(-100%)" : "translateX(-50%)";
            return (
              <span
                key={m.key}
                className={`absolute text-[10px] leading-tight whitespace-nowrap ${
                  isPast ? "text-[#88E59C]" : "text-[#385759]"
                }`}
                style={{ left: `${pos}%`, top: `${topOffset}px`, transform }}
              >
                {t(m.key)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
