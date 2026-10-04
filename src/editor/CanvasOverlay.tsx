import { useCurrentEditor, useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { EditorFocusScope, PlusIcon } from '@react-email/editor/ui';
import { useCallback, useEffect, useState, useSyncExternalStore, type DragEvent as ReactDragEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  applyDrop,
  BLOCK_CONTAINERS,
  COLUMN_PARENTS,
  type BlockUnit,
  deleteUnit,
  DND_MIME,
  dragSession,
  type DropTarget,
  duplicateUnit,
  findDropTarget,
  hoverStore,
  isFixedUnit,
  parentUnit,
  payloadFragment,
  selectedUnit,
  selectUnit,
  unitAt,
} from './dnd';
import { nodeLabel } from './node-labels';
import { handleCanvasPaste } from './paste';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

function toLocal(host: HTMLElement, rect: { top: number; left: number; width: number; height?: number }): Box {
  const hostRect = host.getBoundingClientRect();
  return {
    top: rect.top - hostRect.top + host.scrollTop,
    left: rect.left - hostRect.left + host.scrollLeft,
    width: rect.width,
    height: rect.height ?? 0,
  };
}

function unitBox(editor: Editor, host: HTMLElement, unit: BlockUnit | null): Box | null {
  if (!unit) return null;
  const dom = editor.view.nodeDOM(unit.pos);
  if (!(dom instanceof HTMLElement)) return null;
  return toLocal(host, dom.getBoundingClientRect());
}

/** The block under the pointer: what the hover frame shows and what a click selects. */
function unitAtPoint(editor: Editor, x: number, y: number): BlockUnit | null {
  const coords = editor.view.posAtCoords({ left: x, top: y });
  return coords && coords.inside >= 0 ? unitAt(editor.state.doc, coords.inside) : null;
}

/** Layout blocks: clicking their padding/gaps selects them rather than placing a caret. */
function isStructuralUnit(unit: BlockUnit) {
  const type = unit.node.type.name;
  return BLOCK_CONTAINERS.has(type) || COLUMN_PARENTS.has(type);
}

const GripIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
    {[6, 12, 18].map((y) => (
      <g key={y}>
        <circle cx="9" cy={y} r="1.6" />
        <circle cx="15" cy={y} r="1.6" />
      </g>
    ))}
  </svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);
const ParentIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

/**
 * Everything drawn on top of the canvas: hover outline, selection frame with
 * its toolbar, and the drop indicator. Also owns the drag & drop listeners for
 * the canvas so ProseMirror never sees our custom drags.
 */
export function CanvasOverlay() {
  const { editor } = useCurrentEditor();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!editor) return;
    const find = () => setHost(editor.view.dom.closest<HTMLElement>('.canvas'));
    find();
    // The editor DOM is mounted into the canvas right after creation.
    const id = requestAnimationFrame(find);
    return () => cancelAnimationFrame(id);
  }, [editor]);

  if (!editor || !host) return null;
  return createPortal(<OverlayLayer editor={editor} host={host} />, host);
}

function OverlayLayer({ editor, host }: { editor: Editor; host: HTMLElement }) {
  // Hover lives in a shared store so the layers panel can drive it too.
  const hoverPos = useSyncExternalStore(hoverStore.subscribe, hoverStore.get);
  const hoverNode = hoverPos !== null ? editor.state.doc.nodeAt(hoverPos) : null;
  const hover: BlockUnit | null = hoverPos !== null && hoverNode ? { pos: hoverPos, node: hoverNode } : null;
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [, setLayoutTick] = useState(0);
  const relayout = useCallback(() => setLayoutTick((t) => t + 1), []);

  // Selection (re-rendered on every selection / focus change).
  const selection = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed?.isFocused) return null;
      const unit = selectedUnit(ed);
      return unit ? `${unit.pos}:${unit.node.type.name}:${ed.state.doc.content.size}` : null;
    },
  });
  const selected = selection ? selectedUnit(editor) : null;

  // Keep frames glued to content when layout changes (typing, images loading, resizing).
  useEffect(() => {
    const onUpdate = () => relayout();
    // Positions shift on edits: drop a possibly stale hover.
    const onDocChange = () => {
      hoverStore.set(null);
      relayout();
    };
    editor.on('update', onDocChange);
    const observer = new ResizeObserver(onUpdate);
    observer.observe(editor.view.dom);
    host.addEventListener('load', onUpdate, true);
    window.addEventListener('resize', onUpdate);
    return () => {
      editor.off('update', onDocChange);
      observer.disconnect();
      host.removeEventListener('load', onUpdate, true);
      window.removeEventListener('resize', onUpdate);
    };
  }, [editor, host, relayout]);

  // Hover tracking.
  useEffect(() => {
    let frame = 0;
    const onMove = (event: MouseEvent) => {
      if (dragSession.get()) return;
      if ((event.target as HTMLElement).closest('.ov-toolbar, .ov-handle, .ov-tag')) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        hoverStore.set(unitAtPoint(editor, event.clientX, event.clientY)?.pos ?? null);
      });
    };
    const onLeave = () => hoverStore.set(null);
    host.addEventListener('mousemove', onMove);
    host.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener('mousemove', onMove);
      host.removeEventListener('mouseleave', onLeave);
    };
  }, [editor, host]);

  // Clicks follow what the hover frame shows:
  // - empty canvas around the email -> deselect (back to the palette);
  // - a structural area (column gap, section/column padding) -> select that
  //   row/section/column instead of letting ProseMirror drop the caret into
  //   the nearest text.
  // Capture phase, so it runs before ProseMirror's own mousedown handler.
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (event.button !== 0 || event.shiftKey || event.metaKey || event.ctrlKey) return;
      if ((event.target as HTMLElement).closest('.ov-layer')) return;
      if (event.target === host || event.target === editor.view.dom) {
        event.preventDefault();
        const active = document.activeElement;
        if (active instanceof HTMLElement) active.blur();
        editor.commands.blur();
        return;
      }
      const unit = unitAtPoint(editor, event.clientX, event.clientY);
      if (unit && isStructuralUnit(unit)) {
        event.preventDefault();
        selectUnit(editor, unit);
      }
    };
    const onPaste = (event: ClipboardEvent) => {
      if (editor.view.dom.contains(event.target as Node)) handleCanvasPaste(editor, event);
    };
    host.addEventListener('mousedown', onDown, true);
    host.addEventListener('paste', onPaste, true);
    return () => {
      host.removeEventListener('mousedown', onDown, true);
      host.removeEventListener('paste', onPaste, true);
    };
  }, [editor, host]);

  // Drag & drop: capture-phase listeners so ProseMirror's own handlers stay out of it.
  useEffect(() => {
    let frame = 0;
    let lastFragmentKey: unknown = null;
    let fragment: ReturnType<typeof payloadFragment> = null;

    const compute = (event: DragEvent) => {
      const payload = dragSession.get();
      if (!payload) return null;
      if (lastFragmentKey !== payload) {
        lastFragmentKey = payload;
        fragment = payloadFragment(editor.view, payload);
      }
      if (!fragment) return null;
      const exclude =
        payload.kind === 'move'
          ? { from: payload.pos, to: payload.pos + (editor.state.doc.nodeAt(payload.pos)?.nodeSize ?? 0) }
          : undefined;
      return findDropTarget(editor.view, event.clientX, event.clientY, fragment, exclude);
    };

    const onDragOver = (event: DragEvent) => {
      const payload = dragSession.get();
      if (!payload) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = payload.kind === 'move' ? 'move' : 'copy';
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setDrop(compute(event)));
    };
    const onDrop = (event: DragEvent) => {
      const payload = dragSession.get();
      if (!payload) return;
      event.preventDefault();
      event.stopPropagation();
      cancelAnimationFrame(frame);
      const target = compute(event);
      if (target) applyDrop(editor, payload, target);
      // ProseMirror may have started a native node drag (images); its dragend
      // never fires once the source node moved, so clear it here.
      editor.view.dragging = null;
      dragSession.end();
      setDrop(null);
      setDragging(null);
      hoverStore.set(null);
    };
    const onDragLeave = (event: DragEvent) => {
      if (!dragSession.get()) return;
      if (!host.contains(event.relatedTarget as Node | null)) {
        cancelAnimationFrame(frame);
        setDrop(null);
      }
    };
    const onDragEnd = () => {
      cancelAnimationFrame(frame);
      dragSession.end();
      setDrop(null);
      setDragging(null);
      hoverStore.set(null);
    };
    // Images are draggable ProseMirror nodes: route their native drag through
    // our session so they get the same drop indicator as the handle.
    const onDragStart = (event: DragEvent) => {
      const target = event.target as HTMLElement;
      if (dragSession.get() || target.tagName !== 'IMG' || !editor.view.dom.contains(target)) return;
      const pos = editor.view.posAtDOM(target, 0);
      const unit = unitAt(editor.state.doc, pos);
      if (!unit || isFixedUnit(unit)) return;
      dragSession.start({ kind: 'move', pos: unit.pos, label: nodeLabel(unit.node.type.name) });
      requestAnimationFrame(() => setDragging(unit.pos));
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !editor.isFocused) return;
      const current = selectedUnit(editor);
      const parent = current ? parentUnit(editor.state.doc, current) : null;
      event.preventDefault();
      if (parent) {
        selectUnit(editor, parent);
      } else {
        const active = document.activeElement;
        if (active instanceof HTMLElement) active.blur();
        editor.commands.blur();
      }
    };
    // Text drags stay native: only payloads registered in dragSession are handled here.
    host.addEventListener('dragstart', onDragStart, true);
    host.addEventListener('keydown', onKeyDown, true);
    host.addEventListener('dragover', onDragOver, true);
    host.addEventListener('drop', onDrop, true);
    host.addEventListener('dragleave', onDragLeave, true);
    document.addEventListener('dragend', onDragEnd);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener('dragstart', onDragStart, true);
      host.removeEventListener('keydown', onKeyDown, true);
      host.removeEventListener('dragover', onDragOver, true);
      host.removeEventListener('drop', onDrop, true);
      host.removeEventListener('dragleave', onDragLeave, true);
      document.removeEventListener('dragend', onDragEnd);
    };
  }, [editor, host]);

  const startMove = (event: ReactDragEvent, unit: BlockUnit) => {
    const dom = editor.view.nodeDOM(unit.pos);
    dragSession.start({ kind: 'move', pos: unit.pos, label: nodeLabel(unit.node.type.name) });
    event.dataTransfer.setData(DND_MIME, 'move');
    event.dataTransfer.effectAllowed = 'move';
    if (dom instanceof HTMLElement) {
      const rect = dom.getBoundingClientRect();
      event.dataTransfer.setDragImage(dom, Math.min(24, rect.width / 2), Math.min(24, rect.height / 2));
    }
    // Never unmount the drag source during dragstart (Chromium cancels the
    // drag); restyle it on the next frame instead.
    requestAnimationFrame(() => setDragging(unit.pos));
  };

  const isDragging = dragging !== null;
  const hoverBox = hover && hover.pos !== selected?.pos ? unitBox(editor, host, hover) : null;
  const selectedBox = unitBox(editor, host, selected);
  const sourceBox = isDragging ? unitBox(editor, host, unitAt(editor.state.doc, dragging)) : null;
  const parent = selected ? parentUnit(editor.state.doc, selected) : null;

  return (
    <div className="ov-layer" aria-hidden={false}>
      {hoverBox && hover && (
        <div className={`ov-frame ov-hover ${isDragging ? 'ov-ghost' : ''}`} style={hoverBox}>
          <button
            type="button"
            className="ov-tag"
            onMouseDown={(e) => {
              e.preventDefault();
              selectUnit(editor, hover);
            }}
          >
            {nodeLabel(hover.node.type.name)}
          </button>
        </div>
      )}

      {selectedBox && selected && (
        <div className={`ov-frame ov-selected ${isDragging ? 'ov-ghost' : ''}`} style={selectedBox}>
          <span className="ov-tag ov-tag-selected">{nodeLabel(selected.node.type.name)}</span>
          {!isFixedUnit(selected) && (
            // Focusable and registered as a focus scope: pressing it keeps the
            // editor "focused" (so the selection, and this handle, survive), and
            // no preventDefault on mousedown, which would cancel the native drag.
            <EditorFocusScope>
              <span
                className="ov-handle"
                role="button"
                tabIndex={-1}
                draggable
                title="Glisser pour déplacer"
                aria-label={`Déplacer : ${nodeLabel(selected.node.type.name)}`}
                onDragStart={(e) => startMove(e, selected)}
              >
                <GripIcon />
              </span>
            </EditorFocusScope>
          )}
          <EditorFocusScope>
            <div className="ov-toolbar" onMouseDown={(e) => e.preventDefault()}>
              {parent && (
                <button type="button" className="ov-tool" title={`Sélectionner : ${nodeLabel(parent.node.type.name)}`} onClick={() => selectUnit(editor, parent)}>
                  <ParentIcon />
                </button>
              )}
              {!isFixedUnit(selected) && (
                <>
                  <button type="button" className="ov-tool" title="Dupliquer" onClick={() => duplicateUnit(editor, selected)}>
                    <CopyIcon />
                  </button>
                  <button type="button" className="ov-tool ov-danger" title="Supprimer" onClick={() => deleteUnit(editor, selected)}>
                    <TrashIcon />
                  </button>
                </>
              )}
            </div>
          </EditorFocusScope>
        </div>
      )}

      {sourceBox && <div className="ov-frame ov-source" style={sourceBox} />}

      {drop && <DropIndicator host={host} target={drop} label={dragSession.get()?.label ?? ''} />}
    </div>
  );
}

function DropIndicator({ host, target, label }: { host: HTMLElement; target: DropTarget; label: string }) {
  if (target.emptyZone) {
    const zone = toLocal(host, target.emptyZone);
    return (
      <div className="ov-dropzone" style={zone}>
        <span>
          <PlusIcon size={14} /> Déposer {label ? `« ${label} »` : ''} ici
        </span>
      </div>
    );
  }
  if (!target.line) return null;
  const line = toLocal(host, { ...target.line, height: 0 });
  return (
    <div className="ov-dropline" style={{ top: line.top, left: line.left, width: line.width }}>
      <span className="ov-dropline-label">Déposer ici</span>
    </div>
  );
}
