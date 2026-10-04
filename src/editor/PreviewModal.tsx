import type { Editor } from '@tiptap/core';
import { composeReactEmail } from '@react-email/editor/core';
import { XIcon } from '@react-email/editor/ui';
import { useEffect, useState } from 'react';

type View = 'desktop' | 'mobile' | 'html' | 'text';

interface Result {
  html: string;
  text: string;
  unformattedHtml: string;
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PreviewModal({
  editor,
  previewText,
  initialView,
  onClose,
}: {
  editor: Editor;
  previewText: string;
  initialView: View;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>(initialView);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    composeReactEmail({ editor, preview: previewText || undefined })
      .then((r) => !cancelled && setResult(r))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [editor, previewText]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(view === 'text' ? result.text : result.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Aperçu et export">
        <header className="modal-header">
          <nav className="tabs compact" role="tablist">
            {(
              [
                ['desktop', 'Bureau'],
                ['mobile', 'Mobile'],
                ['html', 'HTML'],
                ['text', 'Texte brut'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={view === id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </nav>
          <div className="modal-actions">
            {result && (view === 'html' || view === 'text') && (
              <button type="button" className="btn" onClick={copy}>
                {copied ? 'Copié ✓' : 'Copier'}
              </button>
            )}
            {result && (
              <button type="button" className="btn primary" onClick={() => download('email.html', result.unformattedHtml, 'text/html')}>
                Télécharger .html
              </button>
            )}
            <button type="button" className="icon-button" onClick={onClose} title="Fermer">
              <XIcon size={18} />
            </button>
          </div>
        </header>
        <div className="modal-body">
          {error && <p className="error">Erreur de rendu : {error}</p>}
          {!result && !error && <p className="loading">Rendu de l’email…</p>}
          {result && (view === 'desktop' || view === 'mobile') && (
            <div className={`preview-frame preview-${view}`}>
              <iframe title="Aperçu de l’email" srcDoc={result.html} sandbox="allow-same-origin allow-popups" />
            </div>
          )}
          {result && view === 'html' && <pre className="code">{result.html}</pre>}
          {result && view === 'text' && <pre className="code">{result.text}</pre>}
        </div>
      </div>
    </div>
  );
}
