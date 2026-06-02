'use client';

import { Sun, Moon, Monitor, Globe, Calendar, Hash, Languages, CheckCircle2, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  usePrefs, Theme, DateFormatKey, TimeFormat, NumberFormat,
  LANGUAGES, DATE_FORMATS, TIMEZONES, NUMBER_FORMATS,
  DEFAULT_PREFERENCES,
} from '@/context/UserPreferencesContext';

// ── Helpers ────────────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-3 bg-neutral-25">
        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-600" />
        </div>
        <h2 className="text-sm font-semibold text-neutral-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-6">
      <div className="w-40 flex-shrink-0 pt-2">
        <p className="text-sm font-medium text-neutral-700">{label}</p>
        {hint && <p className="text-xs text-neutral-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ── Theme segment ──────────────────────────────────────────────────────────────

const THEMES: { value: Theme; icon: React.ElementType; label: string; desc: string }[] = [
  { value: 'light',  icon: Sun,     label: 'Light',  desc: 'Always use light theme'        },
  { value: 'dark',   icon: Moon,    label: 'Dark',   desc: 'Always use dark theme'         },
  { value: 'system', icon: Monitor, label: 'System', desc: 'Follow OS / browser preference' },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const { prefs, setPrefs, resolvedTheme } = usePrefs();

  const initials    = user?.username?.slice(0, 2).toUpperCase() ?? 'U';
  const displayRole = user?.positionName ?? user?.role?.replace(/_/g, ' ') ?? '—';
  const company     = user?.companyName ?? user?.customerName ?? '—';

  const resetAll = () => setPrefs(DEFAULT_PREFERENCES);

  return (
    <div className="p-8 max-w-3xl space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile &amp; Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your appearance, language and regional preferences.</p>
      </div>

      {/* ── Account card ── */}
      <SectionCard title="Account" icon={UserCircle2}>
        <div className="flex items-center gap-5 mb-5 pb-5 border-b border-neutral-100">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-neutral-900">{user?.username ?? '—'}</p>
            <p className="text-sm text-neutral-500">{displayRole}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{company}</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Username',    value: user?.username    ?? '—' },
            { label: 'Role',        value: user?.role?.replace(/_/g, ' ') ?? '—' },
            { label: 'Position',    value: user?.positionName ?? '—' },
            { label: 'Company',     value: user?.companyName  ?? '—' },
            { label: 'Customer',    value: user?.customerName ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-6">
              <p className="w-28 text-xs font-medium text-neutral-500 flex-shrink-0">{label}</p>
              <p className="text-sm text-neutral-800">{value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Appearance ── */}
      <SectionCard title="Appearance" icon={Sun}>
        <Field label="Theme" hint={`Currently: ${resolvedTheme}`}>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(({ value, icon: Icon, label, desc }) => (
              <button
                key={value}
                onClick={() => setPrefs({ theme: value })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  prefs.theme === value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  prefs.theme === value ? 'bg-primary-100' : 'bg-neutral-100'
                }`}>
                  <Icon className={`w-5 h-5 ${prefs.theme === value ? 'text-primary-600' : 'text-neutral-500'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${prefs.theme === value ? 'text-primary-700' : 'text-neutral-700'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
                </div>
                {prefs.theme === value && (
                  <CheckCircle2 className="w-4 h-4 text-primary-600" />
                )}
              </button>
            ))}
          </div>
        </Field>
      </SectionCard>

      {/* ── Regional & Locale ── */}
      <SectionCard title="Regional &amp; Locale" icon={Globe}>
        <div className="space-y-5">

          <Field label="Language" hint="Display language for the interface">
            <select
              className="input-field"
              value={prefs.language}
              onChange={e => setPrefs({ language: e.target.value })}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </Field>

          <div className="border-t border-neutral-100" />

          <Field label="Date Format" hint="How dates are displayed throughout the app">
            <div className="space-y-2">
              {DATE_FORMATS.map(d => (
                <label key={d.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="dateFormat"
                    value={d.value}
                    checked={prefs.dateFormat === d.value}
                    onChange={() => setPrefs({ dateFormat: d.value as DateFormatKey })}
                    className="accent-primary-600"
                  />
                  <span className="font-mono text-sm text-neutral-700 group-hover:text-neutral-900">{d.value}</span>
                  <span className="text-xs text-neutral-400">e.g. {d.example}</span>
                </label>
              ))}
            </div>
          </Field>

          <div className="border-t border-neutral-100" />

          <Field label="Time Format">
            <div className="flex items-center gap-3">
              {(['24h', '12h'] as TimeFormat[]).map(v => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value={v}
                    checked={prefs.timeFormat === v}
                    onChange={() => setPrefs({ timeFormat: v })}
                    className="accent-primary-600"
                  />
                  <span className="text-sm text-neutral-700">
                    {v === '24h' ? '24-hour (14:30)' : '12-hour (2:30 PM)'}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          <div className="border-t border-neutral-100" />

          <Field label="Timezone">
            <select
              className="input-field"
              value={prefs.timezone}
              onChange={e => setPrefs({ timezone: e.target.value })}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </Field>

          <div className="border-t border-neutral-100" />

          <Field label="First Day of Week">
            <div className="flex items-center gap-3">
              {(['monday', 'sunday'] as const).map(v => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="firstDay"
                    value={v}
                    checked={prefs.firstDayOfWeek === v}
                    onChange={() => setPrefs({ firstDayOfWeek: v })}
                    className="accent-primary-600"
                  />
                  <span className="text-sm text-neutral-700 capitalize">{v}</span>
                </label>
              ))}
            </div>
          </Field>

          <div className="border-t border-neutral-100" />

          <Field label="Number Format" hint="How numbers and amounts are formatted">
            <div className="space-y-2">
              {NUMBER_FORMATS.map(n => (
                <label key={n.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="numberFormat"
                    value={n.value}
                    checked={prefs.numberFormat === n.value}
                    onChange={() => setPrefs({ numberFormat: n.value as NumberFormat })}
                    className="accent-primary-600"
                  />
                  <span className="font-mono text-sm text-neutral-700 group-hover:text-neutral-900">{n.example}</span>
                  <span className="text-xs text-neutral-400">{n.label}</span>
                </label>
              ))}
            </div>
          </Field>

        </div>
      </SectionCard>

      {/* ── Live preview ── */}
      <div className="card p-5 bg-neutral-25">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Live Preview — Current Settings</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Language',   value: LANGUAGES.find(l => l.code === prefs.language)?.label ?? prefs.language },
            { label: 'Date',       value: DATE_FORMATS.find(d => d.value === prefs.dateFormat)?.example ?? '' },
            { label: 'Time',       value: prefs.timeFormat === '24h' ? '14:30:00' : '2:30:00 PM' },
            { label: 'Number',     value: NUMBER_FORMATS.find(n => n.value === prefs.numberFormat)?.example ?? '' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-neutral-400">{label}</p>
              <p className="font-mono text-sm font-medium text-neutral-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reset ── */}
      <div className="flex justify-end">
        <button onClick={resetAll}
          className="btn-secondary text-sm">
          Reset to Defaults
        </button>
      </div>

    </div>
  );
}
