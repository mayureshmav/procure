'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sun, Moon, Monitor, ChevronDown, LogOut, UserCircle2,
  Globe, Calendar, Clock, Hash, Languages, Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  usePrefs, Theme, DateFormatKey, TimeFormat, NumberFormat,
  LANGUAGES, DATE_FORMATS, TIMEZONES, NUMBER_FORMATS,
} from '@/context/UserPreferencesContext';

// ── Theme button ───────────────────────────────────────────────────────────────

const THEMES: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: 'light',  icon: Sun,     label: 'Light'  },
  { value: 'dark',   icon: Moon,    label: 'Dark'   },
  { value: 'system', icon: Monitor, label: 'System' },
];

// ── Dropdown row ───────────────────────────────────────────────────────────────

function PrefRow({ icon: Icon, label, children }: {
  icon: React.ElementType; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Main TopBar ────────────────────────────────────────────────────────────────

interface TopBarProps { collapsed: boolean; }

export default function TopBar({ collapsed }: TopBarProps) {
  const router              = useRouter();
  const { user, logout }    = useAuth();
  const { prefs, setPrefs, resolvedTheme } = usePrefs();
  const [open, setOpen]     = useState(false);
  const panelRef            = useRef<HTMLDivElement>(null);
  const triggerRef          = useRef<HTMLButtonElement>(null);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'U';
  const displayName = user?.username ?? 'User';
  const displayRole = user?.positionName ?? user?.role?.replace(/_/g, ' ') ?? '';
  const company     = user?.companyName ?? user?.customerName ?? '';

  return (
    <>
      {/* ── Fixed top bar ── */}
      <div
        className={`fixed top-0 right-0 z-20 h-14 bg-white border-b border-neutral-200 flex items-center px-5 justify-between transition-all duration-300 ${collapsed ? 'left-16' : 'left-64'}`}
      >
        {/* Left — could hold breadcrumb/search in future */}
        <div />

        {/* Right — user trigger */}
        <button
          ref={triggerRef}
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
        >
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none">
            {initials}
          </div>
          {/* Name + role */}
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-neutral-800 leading-none">{displayName}</p>
            {displayRole && (
              <p className="text-xs text-neutral-400 mt-0.5 leading-none truncate max-w-[160px]">{displayRole}</p>
            )}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          ref={panelRef}
          className="fixed right-4 top-16 z-30 w-80 bg-white rounded-xl border border-neutral-200 shadow-xl animate-slide-up overflow-hidden"
        >
          {/* ── User info header ── */}
          <div className="px-4 py-4 bg-gradient-to-br from-primary-600 to-primary-700">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                {displayRole && (
                  <p className="text-xs text-primary-200 truncate mt-0.5">{displayRole}</p>
                )}
                {company && (
                  <p className="text-xs text-primary-200/80 truncate mt-0.5">{company}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Profile & Settings link ── */}
          <button
            onClick={() => { setOpen(false); router.push('/profile'); }}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 group transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-neutral-100 group-hover:bg-primary-100 rounded-lg flex items-center justify-center transition-colors">
                <UserCircle2 className="w-4 h-4 text-neutral-500 group-hover:text-primary-600 transition-colors" />
              </div>
              <span className="text-sm font-medium text-neutral-700">Profile &amp; Settings</span>
            </div>
            <Settings className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500" />
          </button>

          <div className="overflow-y-auto max-h-[calc(100vh-220px)]">

            {/* ── Appearance ── */}
            <div className="px-4 py-3 border-b border-neutral-100">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2.5">Appearance</p>
              <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
                {THEMES.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setPrefs({ theme: value })}
                    title={label}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      prefs.theme === value
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Regional Settings ── */}
            <div className="px-4 py-3 border-b border-neutral-100 space-y-3">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Regional &amp; Locale</p>

              {/* Language */}
              <PrefRow icon={Languages} label="Language">
                <select
                  className="w-full text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:border-primary-400"
                  value={prefs.language}
                  onChange={e => setPrefs({ language: e.target.value })}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </PrefRow>

              {/* Date Format */}
              <PrefRow icon={Calendar} label="Date Format">
                <select
                  className="w-full text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:border-primary-400"
                  value={prefs.dateFormat}
                  onChange={e => setPrefs({ dateFormat: e.target.value as DateFormatKey })}
                >
                  {DATE_FORMATS.map(d => (
                    <option key={d.value} value={d.value}>{d.value} · {d.example}</option>
                  ))}
                </select>
              </PrefRow>

              {/* Time Format */}
              <PrefRow icon={Clock} label="Time">
                <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg">
                  {(['24h', '12h'] as TimeFormat[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setPrefs({ timeFormat: v })}
                      className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${
                        prefs.timeFormat === v
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      {v === '24h' ? '24-hour' : '12-hour'}
                    </button>
                  ))}
                </div>
              </PrefRow>

              {/* Timezone */}
              <PrefRow icon={Globe} label="Timezone">
                <select
                  className="w-full text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:border-primary-400"
                  value={prefs.timezone}
                  onChange={e => setPrefs({ timezone: e.target.value })}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </PrefRow>

              {/* Number Format */}
              <PrefRow icon={Hash} label="Numbers">
                <select
                  className="w-full text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:border-primary-400"
                  value={prefs.numberFormat}
                  onChange={e => setPrefs({ numberFormat: e.target.value as NumberFormat })}
                >
                  {NUMBER_FORMATS.map(n => (
                    <option key={n.value} value={n.value}>{n.example}</option>
                  ))}
                </select>
              </PrefRow>

              {/* First Day of Week */}
              <PrefRow icon={Calendar} label="Week Starts">
                <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg">
                  {(['monday', 'sunday'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setPrefs({ firstDayOfWeek: v })}
                      className={`flex-1 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                        prefs.firstDayOfWeek === v
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </PrefRow>
            </div>

            {/* ── Current theme indicator ── */}
            <div className="px-4 py-2 border-b border-neutral-100">
              <p className="text-[10px] text-neutral-400">
                Active theme: <span className="font-semibold text-neutral-600 capitalize">{resolvedTheme}</span>
                {prefs.theme === 'system' && (
                  <span className="text-neutral-400"> (system preference)</span>
                )}
              </p>
            </div>
          </div>

          {/* ── Sign out ── */}
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors group"
          >
            <div className="w-7 h-7 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </>
  );
}
