'use client';

import React, {
  createContext, useContext, useEffect, useState, useMemo, ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type Theme         = 'light' | 'dark' | 'system';
export type TimeFormat    = '12h' | '24h';
export type DateFormatKey = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'DD.MM.YYYY';
export type NumberFormat  = 'comma-period' | 'period-comma' | 'space-comma';
export type FirstDayOfWeek = 'monday' | 'sunday';

export interface UserPreferences {
  theme:           Theme;
  language:        string;
  dateFormat:      DateFormatKey;
  timeFormat:      TimeFormat;
  timezone:        string;
  firstDayOfWeek:  FirstDayOfWeek;
  numberFormat:    NumberFormat;
  defaultCurrency: string;
}

// ── Reference data ─────────────────────────────────────────────────────────────

export const LANGUAGES = [
  { code: 'en-AU', label: 'English (Australia)'    },
  { code: 'en-US', label: 'English (United States)'},
  { code: 'en-GB', label: 'English (United Kingdom)'},
  { code: 'en-NZ', label: 'English (New Zealand)'  },
  { code: 'en-SG', label: 'English (Singapore)'    },
  { code: 'fr-FR', label: 'Français (France)'      },
  { code: 'de-DE', label: 'Deutsch (Deutschland)'  },
  { code: 'nl-NL', label: 'Nederlands'              },
  { code: 'es-ES', label: 'Español'                 },
  { code: 'ja-JP', label: '日本語'                  },
  { code: 'zh-CN', label: '中文 (简体)'             },
];

export const DATE_FORMATS: { value: DateFormatKey; label: string; example: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY',  example: '31/12/2024'  },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY',  example: '12/31/2024'  },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD',  example: '2024-12-31'  },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY',  example: '31-12-2024'  },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY',  example: '31.12.2024'  },
];

export const TIMEZONES = [
  { value: 'UTC',                 label: 'UTC'                           },
  { value: 'Australia/Sydney',    label: 'Sydney / Canberra (AEST)'      },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)'              },
  { value: 'Australia/Brisbane',  label: 'Brisbane (AEST no DST)'        },
  { value: 'Australia/Perth',     label: 'Perth (AWST)'                  },
  { value: 'Pacific/Auckland',    label: 'Auckland / Wellington (NZST)'  },
  { value: 'Asia/Singapore',      label: 'Singapore (SGT)'               },
  { value: 'Asia/Dubai',          label: 'Dubai / UAE (GST)'             },
  { value: 'Asia/Kolkata',        label: 'India (IST)'                   },
  { value: 'Asia/Tokyo',          label: 'Tokyo / Japan (JST)'           },
  { value: 'Asia/Shanghai',       label: 'Shanghai / Beijing (CST)'      },
  { value: 'Europe/London',       label: 'London (GMT / BST)'            },
  { value: 'Europe/Paris',        label: 'Paris / CET (CET / CEST)'      },
  { value: 'Europe/Berlin',       label: 'Berlin (CET / CEST)'           },
  { value: 'America/New_York',    label: 'New York (EST / EDT)'          },
  { value: 'America/Chicago',     label: 'Chicago (CST / CDT)'           },
  { value: 'America/Denver',      label: 'Denver (MST / MDT)'            },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST / PDT)'       },
  { value: 'America/Sao_Paulo',   label: 'São Paulo (BRT)'               },
];

export const NUMBER_FORMATS: { value: NumberFormat; label: string; example: string }[] = [
  { value: 'comma-period', label: 'Comma thousands, period decimal', example: '1,234,567.89' },
  { value: 'period-comma', label: 'Period thousands, comma decimal',  example: '1.234.567,89' },
  { value: 'space-comma',  label: 'Space thousands, comma decimal',   example: '1 234 567,89' },
];

// ── Defaults ───────────────────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme:           'system',
  language:        'en-AU',
  dateFormat:      'DD/MM/YYYY',
  timeFormat:      '24h',
  timezone:        'Australia/Sydney',
  firstDayOfWeek:  'monday',
  numberFormat:    'comma-period',
  defaultCurrency: 'AUD',
};

const STORAGE_KEY = 'procurex-user-prefs';

// ── Context ────────────────────────────────────────────────────────────────────

interface PrefsContextType {
  prefs:         UserPreferences;
  setPrefs:      (patch: Partial<UserPreferences>) => void;
  resolvedTheme: 'light' | 'dark';
}

const PrefsContext = createContext<PrefsContextType>({
  prefs:         DEFAULT_PREFERENCES,
  setPrefs:      () => {},
  resolvedTheme: 'light',
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState]     = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [systemDark, setSystemDark] = useState(false);

  // Load stored preferences + subscribe to system dark-mode
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefsState({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
    } catch {}

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (prefs.theme === 'dark')  return 'dark';
    if (prefs.theme === 'light') return 'light';
    return systemDark ? 'dark' : 'light';
  }, [prefs.theme, systemDark]);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [resolvedTheme]);

  const setPrefs = (patch: Partial<UserPreferences>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <PrefsContext.Provider value={{ prefs, setPrefs, resolvedTheme }}>
      {children}
    </PrefsContext.Provider>
  );
}

export const usePrefs = () => useContext(PrefsContext);
