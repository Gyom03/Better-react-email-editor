import { XIcon } from '@react-email/editor/ui';
import { useEffect, useState } from 'react';
import { useEmailEditor, type EmailExport } from '../context';
import { cx, type StyleProps } from '../core/cx';

export type PreviewView = 'desktop' | 'mobile' | 'html' | 'text';

/** Triggers a browser download of `content`. */
export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface PreviewDialogProps extends StyleProps {
  onClose: () => void;
  /** Tab shown first. Default: "desktop". */
  defaultView?: PreviewView;
  /** Tabs to show. Default: all four. */
  views?: PreviewView[];
  /** Name of the downloaded file. Default: "email.html". */
  filename?: string;
}

/** Modal with the rendered email: desktop / mobile preview, HTML and plain text, copy and download. Render it to open it. */
export function PreviewDialog({
  onClose,
  defaultView = 'desktop',
  views = ['desktop', 'mobile', 'html', 'text'],
  filename = 'email.html',
  className,
  style,
}: PreviewDialogProps) {
  const { handle, settings, t } = useEmailEditor();
  const [view, setView] = useState<PreviewView>(defaultView);
  const [result, setResult] = useState<EmailExport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    handle
      .exportEmail()
      .then((r) => !cancelled && setResult(r))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [handle, settings.previewText]);

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

  const p = t.preview;
  return (
    <div className="bree-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('bree-modal', className)} style={style} role="dialog" aria-modal="true" aria-label={p.dialogLabel}>
        <header className="bree-modal-header">
          <nav className="bree-tabs bree-compact" role="tablist">
            {views.map((id) => (
              <button key={id} type="button" role="tab" aria-selected={view === id} className={cx(view === id && 'bree-active')} onClick={() => setView(id)}>
                {p[id]}
              </button>
            ))}
          </nav>
          <div className="bree-modal-actions">
            {result && (view === 'html' || view === 'text') && (
              <button type="button" className="bree-btn" onClick={copy}>
                {copied ? p.copied : p.copy}
              </button>
            )}
            {result && (
              <button type="button" className="bree-btn bree-primary" onClick={() => download(filename, result.unformattedHtml, 'text/html')}>
                {p.download}
              </button>
            )}
            <button type="button" className="bree-icon-button" onClick={onClose} title={p.close}>
              <XIcon size={18} />
            </button>
          </div>
        </header>
        <div className="bree-modal-body">
          {error && <p className="bree-error">{p.renderError(error)}</p>}
          {!result && !error && <p className="bree-loading">{p.rendering}</p>}
          {result && (view === 'desktop' || view === 'mobile') && (
            <div className={cx('bree-preview-frame', `bree-preview-${view}`)}>
              <iframe title={p.iframeTitle} srcDoc={result.html} sandbox="allow-same-origin allow-popups" />
            </div>
          )}
          {result && view === 'html' && <pre className="bree-code">{result.html}</pre>}
          {result && view === 'text' && <pre className="bree-code">{result.text}</pre>}
        </div>
      </div>
    </div>
  );
}
