import { useEditorState } from '@tiptap/react';
import { EditorFocusScope } from '@react-email/editor/ui';
import { useRef, useState, type ReactNode } from 'react';
import { useEmailEditor } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { DesktopIcon, LayersIcon, MobileIcon, RedoIcon, UndoIcon } from './icons';
import { download, PreviewDialog, type PreviewView } from './PreviewDialog';

/*
 * The top bar and each of its controls. Use `<TopBar />` as is, or compose
 * your own bar from the buttons below (they all need to live inside the editor).
 */

export function LayersToggle({ className, style }: StyleProps) {
  const { layersOpen, setLayersOpen, t } = useEmailEditor();
  return (
    <button
      type="button"
      className={cx('bree-btn bree-ghost bree-layers-toggle', layersOpen && 'bree-active', className)}
      style={style}
      aria-pressed={layersOpen}
      onClick={() => setLayersOpen(!layersOpen)}
      title={t.topBar.toggleLayers}
    >
      <LayersIcon /> {t.topBar.layers}
    </button>
  );
}

export function UndoRedo({ className, style }: StyleProps) {
  const { editor, t } = useEmailEditor();
  const history = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({ undo: !!ed?.can().undo(), redo: !!ed?.can().redo() }),
  });
  return (
    <div className={cx('bree-btn-group', className)} style={style}>
      <button type="button" className="bree-icon-button" title={t.topBar.undo} disabled={!history?.undo} onClick={() => editor.chain().focus().undo().run()}>
        <UndoIcon />
      </button>
      <button type="button" className="bree-icon-button" title={t.topBar.redo} disabled={!history?.redo} onClick={() => editor.chain().focus().redo().run()}>
        <RedoIcon />
      </button>
    </div>
  );
}

export function DeviceToggle({ className, style }: StyleProps) {
  const { device, setDevice, t } = useEmailEditor();
  const options = [
    { id: 'desktop', label: t.topBar.desktop, Icon: DesktopIcon },
    { id: 'mobile', label: t.topBar.mobile, Icon: MobileIcon },
  ] as const;
  return (
    <div className={cx('bree-segmented bree-device-toggle', className)} style={style} role="radiogroup" aria-label={t.topBar.canvasWidth}>
      {options.map(({ id, label, Icon }) => (
        <button key={id} type="button" role="radio" aria-checked={device === id} className={cx(device === id && 'bree-active')} onClick={() => setDevice(id)} title={label}>
          <Icon />
        </button>
      ))}
    </div>
  );
}

/** Replaces the content with the starter document (after confirmation). */
export function TemplateButton({ className, style }: StyleProps) {
  const { editor, starterDocument, locale, t } = useEmailEditor();
  return (
    <button
      type="button"
      className={cx('bree-btn bree-ghost', className)}
      style={style}
      onClick={() => {
        if (confirm(t.topBar.confirmTemplate)) editor.commands.setContent(starterDocument({ locale, t }));
      }}
    >
      {t.topBar.template}
    </button>
  );
}

/** Loads a JSON file saved by `ExportJsonButton` (or a bare Tiptap document). */
export function ImportButton({ className, style }: StyleProps) {
  const { handle, t } = useEmailEditor();
  const input = useRef<HTMLInputElement>(null);
  const importJson = async (file: File) => {
    try {
      handle.setValue(JSON.parse(await file.text()));
    } catch (error) {
      alert(t.topBar.invalidFile(error instanceof Error ? error.message : String(error)));
    }
  };
  return (
    <>
      <button type="button" className={cx('bree-btn bree-ghost', className)} style={style} onClick={() => input.current?.click()}>
        {t.topBar.import}
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importJson(file);
          e.target.value = '';
        }}
      />
    </>
  );
}

/** Downloads `{ doc, settings }` as email.json. */
export function ExportJsonButton({ className, style, filename = 'email.json' }: StyleProps & { filename?: string }) {
  const { handle, t } = useEmailEditor();
  return (
    <button
      type="button"
      className={cx('bree-btn bree-ghost', className)}
      style={style}
      onClick={() => download(filename, JSON.stringify(handle.getValue(), null, 2), 'application/json')}
    >
      {t.topBar.exportJson}
    </button>
  );
}

export interface PreviewButtonProps extends StyleProps {
  /** Tab opened in the preview dialog. Default: "desktop". */
  view?: PreviewView;
  variant?: 'default' | 'primary' | 'ghost';
  children?: ReactNode;
}

/** Opens the preview / export dialog. */
export function PreviewButton({ view = 'desktop', variant = 'default', children, className, style }: PreviewButtonProps) {
  const { t } = useEmailEditor();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={cx('bree-btn', variant !== 'default' && `bree-${variant}`, className)}
        style={style}
        onClick={() => setOpen(true)}
      >
        {children ?? t.topBar.preview}
      </button>
      {open && <PreviewDialog defaultView={view} onClose={() => setOpen(false)} />}
    </>
  );
}

export function ExportHtmlButton(props: StyleProps) {
  const { t } = useEmailEditor();
  return (
    <PreviewButton view="html" variant="primary" {...props}>
      {t.topBar.exportHtml}
    </PreviewButton>
  );
}

export interface TopBarProps extends StyleProps {
  /** Left side, e.g. your logo. Empty by default. */
  brand?: ReactNode;
  /** Extra controls placed before the export button. */
  actions?: ReactNode;
  /** Replaces the default controls (device toggle + export) with your own. */
  children?: ReactNode;
}

/**
 * Top bar: device toggle (desktop / mobile) and the export button. Add more
 * controls with `actions`, or compose your own bar from `LayersToggle`,
 * `UndoRedo`, `TemplateButton`, `ImportButton`, `ExportJsonButton`, `PreviewButton`…
 */
export function TopBar({ brand, actions, children, className, style }: TopBarProps) {
  return (
    <EditorFocusScope>
      <header className={cx('bree-topbar', className)} style={style}>
        <div className="bree-topbar-start">{brand}</div>
        {children ?? (
          <>
            <div className="bree-topbar-center">
              <DeviceToggle />
            </div>
            <div className="bree-topbar-actions">
              {actions}
              <ExportHtmlButton />
            </div>
          </>
        )}
      </header>
    </EditorFocusScope>
  );
}
