import type { Node as PMNode } from '@tiptap/pm/model';
import { useCurrentEditor, useEditorState } from '@tiptap/react';
import {
  CodeIcon,
  Columns2Icon,
  Columns3Icon,
  Columns4Icon,
  EditorFocusScope,
  Heading1Icon,
  ImageIcon,
  LayoutIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  MousePointerClickIcon,
  PanelLeftIcon,
  SquareCodeIcon,
  TableIcon,
  TextQuoteIcon,
  TypeIcon,
  XIcon,
} from '@react-email/editor/ui';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType, type DragEvent } from 'react';
import { applyDrop, DND_MIME, dragSession, hoverStore, payloadFragment, selectedUnit, selectUnit } from './dnd';
import { buildLayers, type LayerItem, layerDropTarget, type LayerZone, zoneFor } from './layers';
import { nodeLabel } from './node-labels';

type Icon = ComponentType<{ size?: number }>;

const SpacerIcon: Icon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M4 4h16M4 20h16M12 8v8" />
  </svg>
);

const ICONS: Record<string, Icon> = {
  paragraph: TypeIcon,
  heading: Heading1Icon,
  image: ImageIcon,
  button: MousePointerClickIcon,
  horizontalRule: MinusIcon,
  spacer: SpacerIcon,
  socialLinks: LinkIcon,
  htmlBlock: SquareCodeIcon,
  section: LayoutIcon,
  twoColumns: Columns2Icon,
  threeColumns: Columns3Icon,
  fourColumns: Columns4Icon,
  columnsColumn: PanelLeftIcon,
  bulletList: ListIcon,
  orderedList: ListOrderedIcon,
  blockquote: TextQuoteIcon,
  codeBlock: CodeIcon,
  table: TableIcon,
};

function itemLabel(item: LayerItem) {
  return item.node.type.name === 'columnsColumn' ? `Colonne ${item.index}` : nodeLabel(item.node.type.name);
}

function truncate(text: string, max = 36) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** A short hint of the block's content, like layer names in Photoshop. */
function itemPreview(node: PMNode): string {
  const { attrs } = node;
  switch (node.type.name) {
    case 'image': {
      if (attrs.alt) return truncate(attrs.alt);
      const src = String(attrs.src ?? '');
      if (src.startsWith('data:')) return 'image importée';
      try {
        const url = new URL(src);
        // Placeholder services carry the label in ?text=
        return truncate(url.searchParams.get('text') ?? decodeURIComponent(url.pathname.split('/').pop() ?? ''));
      } catch {
        return '';
      }
    }
    case 'spacer':
      return `${attrs.height}px`;
    case 'socialLinks':
      return Array.isArray(attrs.links) ? attrs.links.map((l: { network: string }) => l.network).join(', ') : '';
    case 'htmlBlock':
      return truncate(String(attrs.html ?? '').replace(/<[^>]+>/g, ' '));
    case 'horizontalRule':
    case 'section':
    case 'columnsColumn':
    case 'twoColumns':
    case 'threeColumns':
    case 'fourColumns':
      return '';
    default:
      return truncate(node.textContent) || 'vide';
  }
}

interface DropState {
  key: string;
  zone: LayerZone;
}

export function LayersPanel({ onClose }: { onClose: () => void }) {
  const { editor } = useCurrentEditor();
  const doc = useEditorState({
    editor,
    selector: ({ editor: ed }) => ed?.state.doc ?? null,
    // ProseMirror docs are immutable: identity is enough (and they're circular).
    equalityFn: (a, b) => a === b,
  });
  const selectedPos = useEditorState({
    editor,
    selector: ({ editor: ed }) => (ed?.isFocused ? (selectedUnit(ed)?.pos ?? null) : null),
  });
  const hoverPos = useSyncExternalStore(hoverStore.subscribe, hoverStore.get);
  const layers = useMemo(() => (doc ? buildLayers(doc) : []), [doc]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [drop, setDrop] = useState<DropState | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the selected layer visible.
  useEffect(() => {
    if (selectedPos === null) return;
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedPos]);

  if (!editor) return null;

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const select = (item: LayerItem) => {
    selectUnit(editor, { pos: item.pos, node: item.node });
    const dom = editor.view.nodeDOM(item.pos);
    if (dom instanceof HTMLElement) dom.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const resolveDrop = (event: DragEvent, item: LayerItem) => {
    const payload = dragSession.get();
    if (!payload) return null;
    const fragment = payloadFragment(editor.view, payload);
    if (!fragment) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    const zone = zoneFor(item, (event.clientY - rect.top) / rect.height);
    const moving = payload.kind === 'move' ? editor.state.doc.nodeAt(payload.pos) : null;
    const exclude = payload.kind === 'move' && moving ? { from: payload.pos, to: payload.pos + moving.nodeSize } : undefined;
    const target = layerDropTarget(editor.state.doc, item, zone, fragment, exclude);
    return target ? { zone, target, payload } : null;
  };

  const finishDrag = () => {
    dragSession.end();
    setDrop(null);
  };

  const renderItems = (items: LayerItem[]) =>
    items.map((item) => {
      const Icon = ICONS[item.node.type.name] ?? LayoutIcon;
      const hasChildren = item.children.length > 0;
      const isCollapsed = collapsed.has(item.key);
      const preview = itemPreview(item.node);
      const dropZone = drop?.key === item.key ? drop.zone : null;
      return (
        <div key={item.key} role="none">
          <div
            role="treeitem"
            tabIndex={selectedPos === item.pos || (selectedPos === null && item.key === '0') ? 0 : -1}
            aria-level={item.depth + 1}
            aria-selected={selectedPos === item.pos}
            aria-expanded={hasChildren ? !isCollapsed : undefined}
            className={[
              'layer',
              selectedPos === item.pos && 'selected',
              hoverPos === item.pos && 'hovered',
              dropZone && `drop-${dropZone}`,
              item.fixed && 'fixed',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ paddingLeft: 6 + item.depth * 16 }}
            draggable={!item.fixed}
            title={item.fixed ? 'Les colonnes restent dans leur ligne' : 'Cliquer pour sélectionner, glisser pour déplacer'}
            onClick={() => select(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                select(item);
              } else if ((e.key === 'ArrowLeft' && hasChildren && !isCollapsed) || (e.key === 'ArrowRight' && isCollapsed)) {
                toggle(item.key);
              } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const rows = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? [])];
                const next = rows[rows.indexOf(e.currentTarget) + (e.key === 'ArrowDown' ? 1 : -1)];
                next?.focus();
              }
            }}
            onMouseEnter={() => hoverStore.set(item.pos)}
            onMouseLeave={() => hoverStore.set(null)}
            onDragStart={(e) => {
              e.stopPropagation();
              dragSession.start({ kind: 'move', pos: item.pos, label: itemLabel(item) });
              e.dataTransfer.setData(DND_MIME, 'move');
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={finishDrag}
            onDragOver={(e) => {
              const result = resolveDrop(e, item);
              if (!result) {
                if (drop?.key === item.key) setDrop(null);
                return;
              }
              e.preventDefault();
              e.dataTransfer.dropEffect = result.payload.kind === 'move' ? 'move' : 'copy';
              if (drop?.key !== item.key || drop.zone !== result.zone) setDrop({ key: item.key, zone: result.zone });
            }}
            onDrop={(e) => {
              const result = resolveDrop(e, item);
              e.preventDefault();
              if (result) applyDrop(editor, result.payload, result.target);
              finishDrag();
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                className={`layer-caret ${isCollapsed ? '' : 'open'}`}
                aria-label={isCollapsed ? 'Déplier' : 'Replier'}
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(item.key);
                }}
              >
                ›
              </button>
            ) : (
              <span className="layer-caret-spacer" />
            )}
            <span className="layer-icon">
              <Icon size={14} />
            </span>
            <span className="layer-label">{itemLabel(item)}</span>
            {preview && <span className="layer-preview">{preview}</span>}
          </div>
          {item.empty && (
            <div className="layer-empty" style={{ paddingLeft: 6 + (item.depth + 1) * 16 + 18 }}>
              Vide — déposez du contenu ici
            </div>
          )}
          {hasChildren && !isCollapsed && <div role="group">{renderItems(item.children)}</div>}
        </div>
      );
    });

  return (
    <EditorFocusScope>
      <aside className="layers" aria-label="Calques" tabIndex={-1} onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDrop(null)}>
        <header className="layers-header">
          <h2>Calques</h2>
          <div className="layers-actions">
            <button type="button" className="icon-button small" title="Tout déplier" onClick={() => setCollapsed(new Set())}>
              ⊞
            </button>
            <button
              type="button"
              className="icon-button small"
              title="Tout replier"
              onClick={() => {
                const keys = new Set<string>();
                const walk = (items: LayerItem[]) =>
                  items.forEach((i) => {
                    if (i.children.length) keys.add(i.key);
                    walk(i.children);
                  });
                walk(layers);
                setCollapsed(keys);
              }}
            >
              ⊟
            </button>
            <button type="button" className="icon-button small" title="Fermer les calques" onClick={onClose}>
              <XIcon size={14} />
            </button>
          </div>
        </header>
        <div className="layers-list" role="tree" aria-label="Structure de l’email" ref={listRef}>
          {layers.length ? renderItems(layers) : <p className="hint">L’email est vide.</p>}
        </div>
      </aside>
    </EditorFocusScope>
  );
}
