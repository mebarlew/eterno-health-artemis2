"use client";

import { useI18n } from "@/lib/i18n";

export default function Header() {
  const { lang, t, toggleLang } = useI18n();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#1a3a30] bg-[#0a1612]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="text-[#88E59C]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eterno-logo.svg" alt="Eterno Health" width={120} height={20} className="brightness-0 invert opacity-90" />
        </div>
        <div className="hidden sm:block h-6 w-px bg-[#1a3a30]" />
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-[#F4F4F9]">{t("title")}</h1>
          <p className="text-[10px] text-[#88E59C]/50">{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden md:flex items-center gap-1.5 text-[10px] text-[#88E59C]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#88E59C] animate-pulse" />
          {t("autoRefresh")}
        </span>
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#1a3a30] text-[#88E59C] hover:bg-[#243d35] transition-colors"
        >
          <span className={lang === "en" ? "font-bold" : "opacity-50"}>EN</span>
          <span className="text-[#385759]">/</span>
          <span className={lang === "de" ? "font-bold" : "opacity-50"}>DE</span>
        </button>
      </div>
    </header>
  );
}
