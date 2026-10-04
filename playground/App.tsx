import { useRef, useState } from 'react';
import { BetterEmailEditor, createStarterDocument, resolveMessages, type EmailValue } from 'better-react-email-editor';
import CustomLayout from './CustomLayout';

const STORAGE_KEY = 'better-email-editor:v1';

function loadSaved(): EmailValue | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EmailValue) : null;
  } catch {
    return null;
  }
}

function initialLocale() {
  const lang = new URLSearchParams(window.location.search).get('lang');
  return lang === 'fr' || lang === 'en' ? lang : 'en';
}

/** Demo app: the library with autosave in localStorage. `?lang=fr` switches the UI to French. */
export default function App() {
  const [locale] = useState(initialLocale);
  const [defaultValue] = useState<EmailValue>(
    () => loadSaved() ?? { doc: createStarterDocument({ locale, t: resolveMessages(locale) }), settings: { previewText: '' } },
  );
  const saveTimer = useRef(0);

  const persist = (value: EmailValue) => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // Storage full or unavailable: autosave is best-effort.
      }
    }, 400);
  };

  // ?example=custom shows the same editor composed by hand.
  if (new URLSearchParams(window.location.search).get('example') === 'custom') return <CustomLayout locale={locale} />;

  return (
    <BetterEmailEditor locale={locale} defaultValue={defaultValue} onChange={persist} />
  );
}
