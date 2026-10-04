import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface EmailSettings {
  previewText: string;
}

interface SettingsContextValue {
  settings: EmailSettings;
  update: (patch: Partial<EmailSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function EmailSettingsProvider({
  initial,
  onChange,
  children,
}: {
  initial: EmailSettings;
  onChange?: (settings: EmailSettings) => void;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState(initial);
  const value = useMemo(
    () => ({
      settings,
      update: (patch: Partial<EmailSettings>) => {
        const next = { ...settings, ...patch };
        setSettings(next);
        onChange?.(next);
      },
    }),
    [settings, onChange],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useEmailSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useEmailSettings must be used inside EmailSettingsProvider');
  return value;
}
