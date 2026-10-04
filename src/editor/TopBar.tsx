import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { EditorFocusScope } from '@react-email/editor/ui';
import { useRef, useState } from 'react';
import { starterTemplate } from './blocks';
import { download, PreviewModal } from './PreviewModal';
import { useEmailSettings } from './settings';

export type Device = 'desktop' | 'mobile';

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);
const RedoIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </svg>
);
const DesktopIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);
const MobileIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </svg>
);

const LayersIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);

export function TopBar({
  device,
  onDeviceChange,
  layersOpen,
  onToggleLayers,
}: {
  device: Device;
  onDeviceChange: (d: Device) => void;
  layersOpen: boolean;
  onToggleLayers: () => void;
}) {
  const { editor } = useCurrentEditor();
  const { settings, update } = useEmailSettings();
  const [modal, setModal] = useState<null | 'desktop' | 'html'>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const history = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({ undo: !!ed?.can().undo(), redo: !!ed?.can().redo() }),
  });

  const exportJson = () => {
    if (!editor) return;
    download('email.json', JSON.stringify({ settings, doc: editor.getJSON() }, null, 2), 'application/json');
  };

  const importJson = async (file: File) => {
    if (!editor) return;
    try {
      const data = JSON.parse(await file.text());
      editor.commands.setContent(data.doc ?? data);
      if (data.settings) update(data.settings);
    } catch (error) {
      alert(`Fichier invalide : ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <EditorFocusScope>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ✉
          </span>
          <span>Better Email Editor</span>
        </div>

        <div className="topbar-center">
          <button
            type="button"
            className={`btn ghost layers-toggle ${layersOpen ? 'active' : ''}`}
            aria-pressed={layersOpen}
            onClick={onToggleLayers}
            title="Afficher / masquer les calques"
          >
            <LayersIcon /> Calques
          </button>
          <div className="btn-group">
            <button type="button" className="icon-button" title="Annuler (Ctrl+Z)" disabled={!history?.undo} onClick={() => editor?.chain().focus().undo().run()}>
              <UndoIcon />
            </button>
            <button type="button" className="icon-button" title="Rétablir (Ctrl+Y)" disabled={!history?.redo} onClick={() => editor?.chain().focus().redo().run()}>
              <RedoIcon />
            </button>
          </div>
          <div className="segmented device-toggle" role="radiogroup" aria-label="Largeur du canvas">
            <button type="button" role="radio" aria-checked={device === 'desktop'} className={device === 'desktop' ? 'active' : ''} onClick={() => onDeviceChange('desktop')} title="Bureau">
              <DesktopIcon />
            </button>
            <button type="button" role="radio" aria-checked={device === 'mobile'} className={device === 'mobile' ? 'active' : ''} onClick={() => onDeviceChange('mobile')} title="Mobile">
              <MobileIcon />
            </button>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (editor && confirm('Remplacer le contenu par le modèle de départ ?')) editor.commands.setContent(starterTemplate());
            }}
          >
            Modèle
          </button>
          <button type="button" className="btn ghost" onClick={() => fileInput.current?.click()}>
            Importer
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importJson(file);
              e.target.value = '';
            }}
          />
          <button type="button" className="btn ghost" onClick={exportJson}>
            Enregistrer JSON
          </button>
          <button type="button" className="btn" onClick={() => setModal('desktop')}>
            Aperçu
          </button>
          <button type="button" className="btn primary" onClick={() => setModal('html')}>
            Exporter HTML
          </button>
        </div>
        {modal && editor && (
          <PreviewModal editor={editor} previewText={settings.previewText} initialView={modal} onClose={() => setModal(null)} />
        )}
      </header>
    </EditorFocusScope>
  );
}
