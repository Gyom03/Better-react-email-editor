import { useEditorState } from '@tiptap/react';
import { EditorFocusScope, LayoutIcon, XIcon } from '@react-email/editor/ui';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type DragEvent } from 'react';
import { useEmailEditor } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { applyDrop, DND_MIME, payloadFragment, selectedUnit, selectUnit } from '../core/dnd';
import { buildLayers, type LayerItem, layerDropTarget, type LayerZone, zoneFor } from '../core/layers';
import { textPreview } from '../registry/default-nodes';

interface DropState {
  key: string;
  zone: LayerZone;
}

export interface LayersPanelProps extends StyleProps {
  /** Shows a close button that calls it, e.g. `() => setLayersOpen(false)` when you also render a `LayersToggle`. */
  onClose?: () => void;
  /** Panel title. Defaults to the localized "Layers". */
  title?: string;
}

/** Tree of the email (Photoshop-like layers): select, hover, reorder and nest blocks by drag & drop. */
export function LayersPanel({ onClose, title, className, style }: LayersPanelProps) {
  const { editor, t, locale, nodes, nodeLabel, dragSession, hoverStore } = useEmailEditor();
  const itemLabel = (item: LayerItem) =>
    item.node.type.name === 'columnsColumn' ? t.layers.column(item.index) : nodeLabel(item.node.type.name);
  const itemPreview = (item: LayerItem) => (nodes.get(item.node.type.name)?.preview ?? textPreview)(item.node, { locale, t });
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
      const Icon = nodes.get(item.node.type.name)?.icon ?? LayoutIcon;
      const hasChildren = item.children.length > 0;
      const isCollapsed = collapsed.has(item.key);
      const preview = itemPreview(item);
      const dropZone = drop?.key === item.key ? drop.zone : null;
      return (
        <div key={item.key} role="none">
          <div
            role="treeitem"
            tabIndex={selectedPos === item.pos || (selectedPos === null && item.key === '0') ? 0 : -1}
            aria-level={item.depth + 1}
            aria-selected={selectedPos === item.pos}
            aria-expanded={hasChildren ? !isCollapsed : undefined}
            className={cx(
              'bree-layer',
              selectedPos === item.pos && 'bree-selected',
              hoverPos === item.pos && 'bree-hovered',
              dropZone && `bree-drop-${dropZone}`,
              item.fixed && 'bree-fixed',
            )}
            style={{ paddingLeft: 6 + item.depth * 16 }}
            draggable={!item.fixed}
            title={item.fixed ? t.layers.fixedHint : t.layers.itemHint}
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
                className={cx('bree-layer-caret', !isCollapsed && 'bree-open')}
                aria-label={isCollapsed ? t.layers.expand : t.layers.collapse}
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(item.key);
                }}
              >
                ›
              </button>
            ) : (
              <span className="bree-layer-caret-spacer" />
            )}
            <span className="bree-layer-icon">
              <Icon size={14} />
            </span>
            <span className="bree-layer-label">{itemLabel(item)}</span>
            {preview && <span className="bree-layer-preview">{preview}</span>}
          </div>
          {item.empty && (
            <div className="bree-layer-empty" style={{ paddingLeft: 6 + (item.depth + 1) * 16 + 18 }}>
              {t.layers.emptyZone}
            </div>
          )}
          {hasChildren && !isCollapsed && <div role="group">{renderItems(item.children)}</div>}
        </div>
      );
    });

  return (
    <EditorFocusScope>
      <aside
        className={cx('bree-layers', className)}
        style={style}
        aria-label={title ?? t.layers.title}
        tabIndex={-1}
        onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDrop(null)}
      >
        <header className="bree-layers-header">
          <h2>{title ?? t.layers.title}</h2>
          <div className="bree-layers-actions">
            <button type="button" className="bree-icon-button bree-small" title={t.layers.expandAll} onClick={() => setCollapsed(new Set())}>
              ⊞
            </button>
            <button
              type="button"
              className="bree-icon-button bree-small"
              title={t.layers.collapseAll}
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
            {onClose && (
              <button type="button" className="bree-icon-button bree-small" title={t.layers.close} onClick={onClose}>
                <XIcon size={14} />
              </button>
            )}
          </div>
        </header>
        <div className="bree-layers-list" role="tree" aria-label={t.layers.tree} ref={listRef}>
          {layers.length ? renderItems(layers) : <p className="bree-hint">{t.layers.emptyEmail}</p>}
        </div>
      </aside>
    </EditorFocusScope>
  );
}
