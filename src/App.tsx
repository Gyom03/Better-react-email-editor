import type { JSONContent } from '@tiptap/core';
import { Placeholder } from '@tiptap/extension-placeholder';
import { EmailEditor, type EmailEditorRef } from '@react-email/editor';
import { StarterKit } from '@react-email/editor/extensions';
import { EmailTheming, extendTheme } from '@react-email/editor/plugins';
import { useRef, useState } from 'react';
import { starterTemplate } from './editor/blocks';
import { CanvasOverlay } from './editor/CanvasOverlay';
import { customNodes } from './editor/custom-nodes';
import { EmailSettingsProvider, type EmailSettings } from './editor/settings';
import { LayersPanel } from './editor/LayersPanel';
import { EmailButton } from './editor/paste';
import { Sidebar } from './editor/Sidebar';
import { type Device, TopBar } from './editor/TopBar';

const STORAGE_KEY = 'better-email-editor:v1';

// Module-level so EmailEditor never re-creates the editor.
const extensions = [
  // Button is swapped for a copy/paste-safe version (see editor/paste.ts).
  StarterKit.configure({ TiptapStarterKit: { dropcursor: false }, Button: false }),
  EmailButton,
  Placeholder.configure({
    placeholder: ({ node }) => (node.type.name === 'heading' ? 'Titre' : 'Écrivez, ou tapez « / » pour les commandes'),
    includeChildren: true,
  }),
  EmailTheming.configure({
    theme: extendTheme('basic', {
      body: { backgroundColor: '#eef1f5', padding: '32px 16px' },
      container: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px' },
    }),
  }),
  ...customNodes,
];

// Demo upload: inline the file. Swap for your own storage (S3, Cloudinary…).
const uploadImage = (file: File) =>
  new Promise<{ url: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: String(reader.result) });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

interface Saved {
  doc: JSONContent;
  settings: EmailSettings;
}

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [saved] = useState(loadSaved);
  const [initialContent] = useState(() => saved?.doc ?? starterTemplate());
  const [initialSettings] = useState<EmailSettings>(() => saved?.settings ?? { previewText: '' });
  const [device, setDevice] = useState<Device>('desktop');
  const [layersOpen, setLayersOpen] = useState(true);
  const settingsRef = useRef<EmailSettings>(initialSettings);
  const saveTimer = useRef<number>(0);

  const editorRef = useRef<EmailEditorRef>(null);

  const persist = () => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const doc = editorRef.current?.getJSON();
      if (!doc) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ doc, settings: settingsRef.current }));
      } catch {
        // Storage full or unavailable: autosave is best-effort.
      }
    }, 400);
  };

  const onSettingsChange = (settings: EmailSettings) => {
    settingsRef.current = settings;
    persist();
  };

  return (
    <EmailSettingsProvider initial={initialSettings} onChange={onSettingsChange}>
      <div className={`app device-${device} ${layersOpen ? 'with-layers' : ''}`}>
        <EmailEditor
          ref={editorRef}
          className="canvas"
          content={initialContent}
          extensions={extensions}
          onUploadImage={uploadImage}
          onUpdate={persist}
        >
          <TopBar
            device={device}
            onDeviceChange={setDevice}
            layersOpen={layersOpen}
            onToggleLayers={() => setLayersOpen((open) => !open)}
          />
          {layersOpen && <LayersPanel onClose={() => setLayersOpen(false)} />}
          <Sidebar />
          <CanvasOverlay />
        </EmailEditor>
      </div>
    </EmailSettingsProvider>
  );
}
