import type { Editor, JSONContent } from '@tiptap/core';
import { Fragment, type Node as PMNode } from '@tiptap/pm/model';
import { NodeSelection, Selection, TextSelection, type Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

/** Nodes whose children are free-flowing blocks (the "drop zones"). */
export const BLOCK_CONTAINERS = new Set(['container', 'section', 'columnsColumn']);
/** Row-like nodes whose children are columns laid out horizontally. */
export const COLUMN_PARENTS = new Set(['twoColumns', 'threeColumns', 'fourColumns']);

export const DND_MIME = 'application/x-email-block';

export type DragPayload =
  | { kind: 'new'; label: string; content: () => JSONContent[] }
  | { kind: 'move'; pos: number; label: string };

// Only one drag can happen at a time; `dragover` can't read dataTransfer
// payloads, so the active payload lives here.
let activeDrag: DragPayload | null = null;
export const dragSession = {
  get: () => activeDrag,
  start: (payload: DragPayload) => {
    activeDrag = payload;
  },
  end: () => {
    activeDrag = null;
  },
};

export interface DropTarget {
  /** Document position where the content will be inserted. */
  pos: number;
  /** When set, the range [pos, replaceTo) is replaced (empty placeholder paragraph). */
  replaceTo?: number;
  /** Indicator geometry in client coordinates (canvas drops only). */
  line?: { top: number; left: number; width: number };
  /** Whether the target is an empty drop zone (shows a filled zone instead of a line). */
  emptyZone?: { top: number; left: number; width: number; height: number };
}

interface Child {
  node: PMNode;
  pos: number;
  rect: DOMRect;
}

function domRect(view: EditorView, pos: number): DOMRect | null {
  const dom = view.nodeDOM(pos);
  return dom instanceof HTMLElement ? dom.getBoundingClientRect() : null;
}

function childrenOf(view: EditorView, node: PMNode, pos: number): Child[] {
  const result: Child[] = [];
  node.forEach((child, offset) => {
    const childPos = pos + 1 + offset;
    const rect = domRect(view, childPos);
    if (rect) result.push({ node: child, pos: childPos, rect });
  });
  return result;
}

export function isEmptyParagraph(node: PMNode) {
  return node.type.name === 'paragraph' && node.childCount === 0;
}

export function findRootContainer(doc: PMNode): { node: PMNode; pos: number } | null {
  let found: { node: PMNode; pos: number } | null = null;
  doc.forEach((child, offset) => {
    if (!found && child.type.name === 'container') found = { node: child, pos: offset };
  });
  return found;
}

/**
 * Finds where content dragged at (x, y) should land. Walks down from the email
 * container into sections and columns, then picks the gap between children
 * closest to the pointer — the same mental model as Unlayer's rows/contents.
 */
export function findDropTarget(
  view: EditorView,
  x: number,
  y: number,
  fragment: Fragment,
  exclude?: { from: number; to: number },
): DropTarget | null {
  const root = findRootContainer(view.state.doc);
  if (!root) return null;

  const isExcluded = (pos: number) => !!exclude && pos >= exclude.from && pos < exclude.to;

  const resolveIn = (node: PMNode, pos: number): DropTarget | null => {
    const children = childrenOf(view, node, pos);
    const containerRect = domRect(view, pos);
    if (!containerRect) return null;

    // 1. Descend into nested drop zones when the pointer is well inside them.
    for (const child of children) {
      const { rect } = child;
      const edge = Math.min(12, rect.height / 4);
      const insideY = y > rect.top + edge && y < rect.bottom - edge;
      const insideX = x >= rect.left && x <= rect.right;
      if (!insideY || !insideX || isExcluded(child.pos)) continue;

      const type = child.node.type.name;
      if (BLOCK_CONTAINERS.has(type)) {
        const nested = resolveIn(child.node, child.pos);
        if (nested) return nested;
      } else if (COLUMN_PARENTS.has(type)) {
        const columns = childrenOf(view, child.node, child.pos);
        const column =
          columns.find((c) => x >= c.rect.left && x <= c.rect.right) ??
          (x < columns[0]?.rect.left ? columns[0] : columns[columns.length - 1]);
        if (column && !isExcluded(column.pos)) {
          const nested = resolveIn(column.node, column.pos);
          if (nested) return nested;
        }
      }
    }

    // 2. Empty zone (a column/section holding a single empty paragraph): replace it.
    if (children.length === 1 && isEmptyParagraph(children[0].node) && !isExcluded(children[0].pos)) {
      const only = children[0];
      if (!node.type.validContent(fragment)) return null;
      return {
        pos: only.pos,
        replaceTo: only.pos + only.node.nodeSize,
        line: { top: only.rect.top, left: containerRect.left, width: containerRect.width },
        emptyZone: {
          top: containerRect.top,
          left: containerRect.left,
          width: containerRect.width,
          height: Math.max(containerRect.height, 40),
        },
      };
    }

    // 3. Pick the gap between children.
    let index = children.length;
    for (let i = 0; i < children.length; i++) {
      const { rect } = children[i];
      if (y < rect.top + rect.height / 2) {
        index = i;
        break;
      }
    }

    // Use ProseMirror's content expression to validate the drop.
    const insertIndex = index;
    const childIndex = (p: number) => {
      let i = 0;
      let found = -1;
      node.forEach((_c, offset) => {
        if (pos + 1 + offset === p) found = i;
        i++;
      });
      return found;
    };
    const pmIndex = index < children.length ? childIndex(children[index].pos) : node.childCount;
    if (!node.canReplace(pmIndex, pmIndex, fragment)) return null;

    const insertPos =
      insertIndex < children.length ? children[insertIndex].pos : pos + node.nodeSize - 1;

    let top: number;
    if (children.length === 0) top = containerRect.top + 4;
    else if (insertIndex === 0) top = children[0].rect.top;
    else if (insertIndex === children.length) top = children[children.length - 1].rect.bottom;
    else top = (children[insertIndex - 1].rect.bottom + children[insertIndex].rect.top) / 2;

    return {
      pos: insertPos,
      line: { top, left: containerRect.left, width: containerRect.width },
    };
  };

  return resolveIn(root.node, root.pos);
}

/** Builds the PM fragment for a drag payload. */
export function payloadFragment(view: EditorView, payload: DragPayload): Fragment | null {
  const { schema, doc } = view.state;
  if (payload.kind === 'new') {
    try {
      return Fragment.fromArray(payload.content().map((json) => schema.nodeFromJSON(json)));
    } catch (error) {
      console.error('Invalid block content', error);
      return null;
    }
  }
  const node = doc.nodeAt(payload.pos);
  return node ? Fragment.from(node) : null;
}

function selectInserted(tr: Transaction, pos: number) {
  const node = tr.doc.nodeAt(pos);
  if (!node) return;
  if (node.isAtom || node.type.name === 'horizontalRule') {
    tr.setSelection(NodeSelection.create(tr.doc, pos));
  } else {
    tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)));
  }
}

/**
 * The Divider extension filters out any transaction inserting content while a
 * divider is node-selected (to stop typing over it). Collapse such selections
 * first so structural edits (drop, duplicate) go through.
 */
function releaseNodeSelection(view: EditorView) {
  const { selection, doc } = view.state;
  if (selection instanceof NodeSelection) {
    view.dispatch(view.state.tr.setSelection(Selection.near(doc.resolve(selection.from))));
  }
}

/**
 * Inserting at the very end of a zone would land after TrailingNode's empty
 * filler paragraph, which then stops being "trailing" and shows up as a stray
 * empty line. Insert before it instead.
 */
function beforeTrailingFiller(doc: PMNode, target: DropTarget): DropTarget {
  if (target.replaceTo !== undefined) return target;
  const $pos = doc.resolve(target.pos);
  const parent = $pos.parent;
  const last = parent.lastChild;
  const atEnd = $pos.index() === parent.childCount;
  if (!atEnd || !last || parent.childCount < 2 || !isEmptyParagraph(last)) return target;
  return { ...target, pos: target.pos - last.nodeSize };
}

/** Applies a drop. Returns true when the document changed. */
export function applyDrop(editor: Editor, payload: DragPayload, rawTarget: DropTarget): boolean {
  const { view } = editor;
  releaseNodeSelection(view);
  const fragment = payloadFragment(view, payload);
  if (!fragment) return false;
  const target = beforeTrailingFiller(view.state.doc, rawTarget);
  const tr = view.state.tr;

  if (payload.kind === 'new') {
    if (target.replaceTo !== undefined) tr.replaceWith(target.pos, target.replaceTo, fragment);
    else tr.insert(target.pos, fragment);
    selectInserted(tr, target.pos);
  } else {
    const node = view.state.doc.nodeAt(payload.pos);
    if (!node) return false;
    const from = payload.pos;
    const to = from + node.nodeSize;
    // Dropping right before or after itself is a no-op.
    if (target.replaceTo === undefined && (target.pos === from || target.pos === to)) return false;

    removeNode(tr, from, to);
    const mappedFrom = tr.mapping.map(target.pos, -1);
    if (target.replaceTo !== undefined) {
      const mappedTo = tr.mapping.map(target.replaceTo, 1);
      tr.replaceWith(mappedFrom, mappedTo, node);
    } else {
      tr.insert(mappedFrom, node);
    }
    selectInserted(tr, mappedFrom);
  }

  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
}

/** Deletes a node; keeps its parent valid by leaving an empty paragraph if needed. */
export function removeNode(tr: Transaction, from: number, to: number) {
  const $from = tr.doc.resolve(from);
  const parent = $from.parent;
  if (parent.childCount === 1 && BLOCK_CONTAINERS.has(parent.type.name)) {
    tr.replaceWith(from, to, tr.doc.type.schema.nodes.paragraph.create());
  } else {
    tr.delete(from, to);
  }
}

// ---------------------------------------------------------------------------
// Block "units": what gets outlined, labelled and moved in the canvas.
// ---------------------------------------------------------------------------

export interface BlockUnit {
  pos: number;
  node: PMNode;
}

/** The innermost node at `pos` (or one of its ancestors) that sits directly in a drop zone. */
export function unitAt(doc: PMNode, pos: number, includeSelf = true): BlockUnit | null {
  if (pos < 0 || pos > doc.content.size) return null;
  const candidates: BlockUnit[] = [];
  const self = doc.nodeAt(pos);
  if (includeSelf && self) candidates.push({ pos, node: self });
  const $pos = doc.resolve(pos);
  for (let depth = $pos.depth; depth > 0; depth--) {
    candidates.push({ pos: $pos.before(depth), node: $pos.node(depth) });
  }
  for (const candidate of candidates) {
    const parent = doc.resolve(candidate.pos).parent.type.name;
    // Columns are units too (selectable, styleable), but they can't be moved out of their row.
    if (BLOCK_CONTAINERS.has(parent) || COLUMN_PARENTS.has(parent)) return candidate;
  }
  return null;
}

/** Columns live in fixed-size rows: they can be selected but not moved, duplicated or deleted. */
export function isFixedUnit(unit: BlockUnit) {
  return unit.node.type.name === 'columnsColumn';
}

/** The unit enclosing `unit` (e.g. paragraph -> its columns row). */
export function parentUnit(doc: PMNode, unit: BlockUnit): BlockUnit | null {
  const $pos = doc.resolve(unit.pos);
  for (let depth = $pos.depth; depth > 0; depth--) {
    const candidatePos = $pos.before(depth);
    const found = unitAt(doc, candidatePos);
    if (found && found.pos !== unit.pos) return found;
  }
  return null;
}

export function selectedUnit(editor: Editor): BlockUnit | null {
  const { selection, doc } = editor.state;
  if (selection instanceof NodeSelection) {
    return unitAt(doc, selection.from) ?? { pos: selection.from, node: selection.node };
  }
  return unitAt(doc, selection.from, false);
}

export function selectUnit(editor: Editor, unit: BlockUnit) {
  const { view } = editor;
  const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, unit.pos));
  view.dispatch(tr);
  view.focus();
}

export function duplicateUnit(editor: Editor, unit: BlockUnit) {
  const { view } = editor;
  releaseNodeSelection(view);
  const node = view.state.doc.nodeAt(unit.pos);
  if (!node) return;
  const insertAt = unit.pos + node.nodeSize;
  const tr = view.state.tr.insert(insertAt, node.copy(node.content));
  tr.setSelection(NodeSelection.create(tr.doc, insertAt));
  view.dispatch(tr.scrollIntoView());
  view.focus();
}

export function deleteUnit(editor: Editor, unit: BlockUnit) {
  const { view } = editor;
  const node = view.state.doc.nodeAt(unit.pos);
  if (!node) return;
  const tr = view.state.tr;
  removeNode(tr, unit.pos, unit.pos + node.nodeSize);
  view.dispatch(tr);
}

/** Appends blocks at the end of the email (click-to-insert from the palette). */
export function appendBlocks(editor: Editor, content: JSONContent[]) {
  const root = findRootContainer(editor.state.doc);
  if (!root) return;
  const last = root.node.lastChild;
  const end = root.pos + root.node.nodeSize - 1;
  const target: DropTarget =
    last && isEmptyParagraph(last) && root.node.childCount > 1
      ? { pos: end - last.nodeSize, replaceTo: end, line: { top: 0, left: 0, width: 0 } }
      : { pos: end, line: { top: 0, left: 0, width: 0 } };
  applyDrop(editor, { kind: 'new', label: '', content: () => content }, target);
}

// ---------------------------------------------------------------------------
// Shared hover: the canvas and the layers panel highlight the same block.
// ---------------------------------------------------------------------------

let hoverPos: number | null = null;
const hoverListeners = new Set<() => void>();
export const hoverStore = {
  get: () => hoverPos,
  set: (pos: number | null) => {
    if (pos === hoverPos) return;
    hoverPos = pos;
    for (const listener of hoverListeners) listener();
  },
  subscribe: (listener: () => void) => {
    hoverListeners.add(listener);
    return () => {
      hoverListeners.delete(listener);
    };
  },
};
