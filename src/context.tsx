import type { Editor, Extensions, JSONContent } from '@tiptap/core';
import { Placeholder } from '@tiptap/extension-placeholder';
import { EditorContext, useEditor } from '@tiptap/react';
import { composeReactEmail } from '@react-email/editor/core';
import { StarterKit } from '@react-email/editor/extensions';
import { EmailTheming, extendTheme, useEditorImage, type EditorThemeInput } from '@react-email/editor/plugins';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cx, type StyleProps } from './core/cx';
import { appendBlocks } from './core/dnd';
import { EmailButton } from './core/paste';
import { createPasteHandler } from './core/paste-handler';
import { createDragSession, createHoverStore, type DragSession, type HoverStore } from './core/stores';
import { en, resolveLabel, resolveMessages, type I18n, type Messages, type PartialMessages } from './i18n';
import { defaultNodes } from './registry/default-nodes';
import { defaultPalette, defaultPaletteGroups } from './registry/default-palette';
import { createStarterDocument, defaultTemplates } from './registry/default-templates';
import type { NodeDefinition, PaletteGroup, PaletteItem, TemplateItem } from './registry/types';

export interface EmailSettings {
  /** Inbox preview line (shown after the subject). */
  previewText: string;
}

/** What the editor saves and loads: the document plus email-level settings. */
export interface EmailValue {
  doc: JSONContent;
  settings: EmailSettings;
}

export type Device = 'desktop' | 'mobile';

export interface EmailExport {
  html: string;
  text: string;
  unformattedHtml: string;
}

/** Imperative API exposed through `ref` (and given to `onReady`). */
export interface EmailEditorHandle {
  /** The underlying Tiptap editor. */
  editor: Editor | null;
  getValue: () => EmailValue;
  setValue: (value: EmailValue | JSONContent) => void;
  getJSON: () => JSONContent;
  /** Renders the email (HTML, plain text and unformatted HTML). */
  exportEmail: () => Promise<EmailExport>;
  getHtml: () => Promise<string>;
  getText: () => Promise<string>;
  /** Appends blocks at the end of the email. */
  insertBlocks: (content: JSONContent[]) => void;
}

export interface EmailEditorContextValue extends I18n {
  editor: Editor;
  handle: EmailEditorHandle;
  /** Node definitions, by type. */
  nodes: ReadonlyMap<string, NodeDefinition>;
  nodeLabel: (type: string) => string;
  palette: PaletteItem[];
  paletteGroups: PaletteGroup[];
  templates: TemplateItem[];
  starterDocument: (i18n: I18n) => JSONContent;
  uploadImage: (file: File) => Promise<{ url: string }>;
  dragSession: DragSession;
  hoverStore: HoverStore;
  device: Device;
  setDevice: (device: Device) => void;
  layersOpen: boolean;
  setLayersOpen: (open: boolean) => void;
  settings: EmailSettings;
  updateSettings: (patch: Partial<EmailSettings>) => void;
}

const EmailEditorContext = createContext<EmailEditorContextValue | null>(null);

/** Everything the editor components share: editor, i18n, registries, UI state. */
export function useEmailEditor(): EmailEditorContextValue {
  const value = useContext(EmailEditorContext);
  if (!value) throw new Error('useEmailEditor must be used inside <EditorRoot> or <BetterEmailEditor>.');
  return value;
}

/** Like `useEmailEditor`, but returns null outside an editor. */
export function useOptionalEmailEditor(): EmailEditorContextValue | null {
  return useContext(EmailEditorContext);
}

/** UI strings, falling back to English outside an editor (lets form fields work standalone). */
export function useMessages(): Messages {
  return useContext(EmailEditorContext)?.t ?? en;
}

/** Current locale and messages. */
export function useI18n(): I18n {
  const { locale, t } = useEmailEditor();
  return useMemo(() => ({ locale, t }), [locale, t]);
}

export interface EditorRootProps extends StyleProps {
  /** Initial content, read on mount. Use the ref's `setValue` to replace it later. */
  defaultValue?: EmailValue | JSONContent;
  /** Called on every document or settings change. */
  onChange?: (value: EmailValue) => void;
  /** Called once the editor is created. */
  onReady?: (handle: EmailEditorHandle) => void;
  /** "en" (default) or "fr". Any other value falls back to English unless `messages` covers it. */
  locale?: string;
  /** Overrides some or all UI strings. */
  messages?: PartialMessages;
  /** Node definitions (labels, icons, properties panels, custom extensions). Read on mount for extensions. */
  nodes?: NodeDefinition[];
  /** Tiles of the "Content" tab. */
  palette?: PaletteItem[];
  paletteGroups?: PaletteGroup[];
  /** Prebuilt rows of the "Blocks" tab. */
  templates?: TemplateItem[];
  /** Content loaded by the top bar's "Template" button. */
  starterDocument?: (i18n: I18n) => JSONContent;
  /** Extra Tiptap extensions, read on mount. */
  extensions?: Extensions;
  /** Email theme used for new documents, read on mount. */
  theme?: EditorThemeInput;
  /** Stores an uploaded or pasted image and returns its public URL. Defaults to an inline data URL. */
  uploadImage?: (file: File) => Promise<{ url: string }>;
  editable?: boolean;
  /** Canvas width, controlled. */
  device?: Device;
  defaultDevice?: Device;
  onDeviceChange?: (device: Device) => void;
  /** Layers panel visibility, controlled. */
  layersOpen?: boolean;
  defaultLayersOpen?: boolean;
  onLayersOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export const defaultTheme: EditorThemeInput = extendTheme('basic', {
  body: { backgroundColor: '#eef1f5', padding: '32px 16px' },
  container: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px' },
});

/** Inlines the file as a data URL. Replace with your own storage (S3, Cloudinary…). */
export const readFileAsDataUrl = (file: File) =>
  new Promise<{ url: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: String(reader.result) });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

function isEmailValue(value: unknown): value is EmailValue {
  return typeof value === 'object' && value !== null && 'doc' in value;
}

function normalize(value: EmailValue | JSONContent | undefined): EmailValue {
  if (!value) return { doc: EMPTY_DOC, settings: { previewText: '' } };
  if (isEmailValue(value)) return { doc: value.doc, settings: { ...value.settings, previewText: value.settings?.previewText ?? '' } };
  return { doc: value, settings: { previewText: '' } };
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const current = value !== undefined ? value : inner;
  const set = useCallback(
    (next: T) => {
      if (value === undefined) setInner(next);
      onChange?.(next);
    },
    [value, onChange],
  );
  return [current, set] as const;
}

/**
 * Creates the editor and provides it to every component inside: `Canvas`,
 * `TopBar`, `LayersPanel`, `Sidebar`… Lay them out however you like.
 */
export const EditorRoot = forwardRef<EmailEditorHandle, EditorRootProps>(function EditorRoot(
  {
    defaultValue,
    onChange,
    onReady,
    locale = 'en',
    messages,
    nodes = defaultNodes,
    palette = defaultPalette,
    paletteGroups = defaultPaletteGroups,
    templates = defaultTemplates,
    starterDocument = createStarterDocument,
    extensions: extraExtensions,
    theme = defaultTheme,
    uploadImage = readFileAsDataUrl,
    editable = true,
    device: deviceProp,
    defaultDevice = 'desktop',
    onDeviceChange,
    layersOpen: layersOpenProp,
    defaultLayersOpen = true,
    onLayersOpenChange,
    className,
    style,
    children,
  },
  ref,
) {
  const t = useMemo<Messages>(() => resolveMessages(locale, messages), [locale, messages]);

  const [initial] = useState(() => normalize(defaultValue));
  const [settings, setSettings] = useState<EmailSettings>(initial.settings);
  // Settings only change through updateSettings / setValue, which keep this ref in sync.
  const settingsRef = useRef(settings);

  // Latest props, read by long-lived callbacks (editor events, placeholder, uploads).
  const tRef = useRef(t);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const uploadRef = useRef(uploadImage);
  useLayoutEffect(() => {
    tRef.current = t;
    onChangeRef.current = onChange;
    onReadyRef.current = onReady;
    uploadRef.current = uploadImage;
  });

  const [device, setDevice] = useControllable(deviceProp, defaultDevice, onDeviceChange);
  const [layersOpen, setLayersOpen] = useControllable(layersOpenProp, defaultLayersOpen, onLayersOpenChange);
  const [stores] = useState(() => ({ dragSession: createDragSession(), hoverStore: createHoverStore() }));

  const upload = useCallback((file: File) => uploadRef.current(file), []);
  const imageExtension = useEditorImage({ uploadImage: upload });

  // Built once: Tiptap re-creates the editor (and loses history) when extensions change.
  const [extensions] = useState<Extensions>(() => [
    // Button is swapped for a copy/paste-safe version (see core/paste.ts).
    StarterKit.configure({ TiptapStarterKit: { dropcursor: false }, Button: false }),
    EmailButton,
    Placeholder.configure({
      placeholder: ({ node }) => (node.type.name === 'heading' ? tRef.current.placeholder.heading : tRef.current.placeholder.paragraph),
      includeChildren: true,
    }),
    EmailTheming.configure({ theme }),
    ...nodes.flatMap((node) => node.extensions ?? []),
    ...(extraExtensions ?? []),
    imageExtension,
  ]);

  const editor = useEditor(
    {
      extensions,
      content: initial.doc,
      editable,
      immediatelyRender: false,
      editorProps: { handlePaste: createPasteHandler(extensions) },
    },
    [],
  );

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  const getValue = useCallback(
    (): EmailValue => ({ doc: editor?.getJSON() ?? EMPTY_DOC, settings: settingsRef.current }),
    [editor],
  );

  const updateSettings = useCallback(
    (patch: Partial<EmailSettings>) => {
      const next = { ...settingsRef.current, ...patch };
      settingsRef.current = next;
      setSettings(next);
      if (editor) onChangeRef.current?.({ doc: editor.getJSON(), settings: next });
    },
    [editor],
  );

  const handle = useMemo<EmailEditorHandle>(() => {
    const exportEmail = async (): Promise<EmailExport> => {
      if (!editor) return { html: '', text: '', unformattedHtml: '' };
      return composeReactEmail({ editor, preview: settingsRef.current.previewText || undefined });
    };
    return {
      editor,
      getValue,
      getJSON: () => editor?.getJSON() ?? EMPTY_DOC,
      setValue: (value) => {
        const next = normalize(value);
        settingsRef.current = next.settings;
        setSettings(next.settings);
        editor?.commands.setContent(next.doc, { emitUpdate: true });
      },
      exportEmail,
      getHtml: async () => (await exportEmail()).html,
      getText: async () => (await exportEmail()).text,
      insertBlocks: (content) => {
        if (editor) appendBlocks(editor, content);
      },
    };
  }, [editor, getValue]);

  useImperativeHandle(ref, () => handle, [handle]);

  useEffect(() => {
    if (!editor) return;
    onReadyRef.current?.(handle);
    const onUpdate = () => onChangeRef.current?.(getValue());
    editor.on('update', onUpdate);
    return () => {
      editor.off('update', onUpdate);
    };
  }, [editor, handle, getValue]);

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.type, node])), [nodes]);

  const value = useMemo<EmailEditorContextValue | null>(() => {
    if (!editor) return null;
    const i18n = { locale, t };
    return {
      ...i18n,
      editor,
      handle,
      nodes: nodeMap,
      nodeLabel: (type) => {
        const label = nodeMap.get(type)?.label;
        return label ? resolveLabel(label, i18n) : (t.nodes[type] ?? type);
      },
      palette,
      paletteGroups,
      templates,
      starterDocument,
      uploadImage: upload,
      ...stores,
      device,
      setDevice,
      layersOpen,
      setLayersOpen,
      settings,
      updateSettings,
    };
  }, [editor, locale, t, handle, nodeMap, palette, paletteGroups, templates, starterDocument, upload, stores, device, setDevice, layersOpen, setLayersOpen, settings, updateSettings]);

  const tiptapContext = useMemo(() => ({ editor }), [editor]);

  // The empty-zone hint is drawn by CSS (::after), so its text travels as a custom property.
  const rootStyle = { '--bree-empty-zone-label': JSON.stringify(t.canvas.emptyZone), ...style } as CSSProperties;

  return (
    <div className={cx('bree bree-root', className)} style={rootStyle} lang={locale}>
      {value && (
        <EditorContext.Provider value={tiptapContext}>
          <EmailEditorContext.Provider value={value}>{children}</EmailEditorContext.Provider>
        </EditorContext.Provider>
      )}
    </div>
  );
});
