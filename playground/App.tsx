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

/** Demo app: the library with autosave in localStorage and a language switch. */
export default function App() {
  const [locale, setLocale] = useState(initialLocale);
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

  const changeLocale = (next: string) => {
    setLocale(next);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url);
  };

  // ?example=custom shows the same editor composed by hand.
  if (new URLSearchParams(window.location.search).get('example') === 'custom') return <CustomLayout locale={locale} />;

  return (
    <BetterEmailEditor
      locale={locale}
      defaultValue={defaultValue}
      onChange={persist}
      slotProps={{
        topBar: {
          actions: (
            <select className="locale-select" value={locale} onChange={(e) => changeLocale(e.target.value)} aria-label="Language">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          ),
        },
      }}
    />
  );
}
