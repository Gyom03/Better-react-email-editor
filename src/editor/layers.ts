import type { Fragment, Node as PMNode } from '@tiptap/pm/model';
import { BLOCK_CONTAINERS, COLUMN_PARENTS, type DropTarget, findRootContainer, isEmptyParagraph } from './dnd';

export interface LayerItem {
  /** Stable-ish key built from the child indexes ("0.2.1"). */
  key: string;
  pos: number;
  node: PMNode;
  depth: number;
  /** 1-based index among siblings (used to name columns). */
  index: number;
  children: LayerItem[];
  /** Accepts blocks dropped "inside" (section, column). */
  accepts: boolean;
  /** Can't be moved (columns are locked in their row). */
  fixed: boolean;
  /** Drop zone holding nothing but its placeholder paragraph. */
  empty: boolean;
}

/** TrailingNode filler: same rule as the serializer, which drops it on export. */
function isTrailingFiller(parent: PMNode, index: number) {
  const child = parent.child(index);
  return (
    index === parent.childCount - 1 &&
    parent.childCount > 1 &&
    isEmptyParagraph(child) &&
    parent.child(index - 1).type.name !== 'paragraph'
  );
}

function itemsOf(parent: PMNode, parentPos: number, depth: number, path: string): LayerItem[] {
  const items: LayerItem[] = [];
  parent.forEach((child, offset, index) => {
    if (isTrailingFiller(parent, index)) return;
    const pos = parentPos + 1 + offset;
    const type = child.type.name;
    const key = `${path}${index}`;
    const accepts = BLOCK_CONTAINERS.has(type);
    const empty = accepts && child.childCount === 1 && isEmptyParagraph(child.firstChild!);
    const nested = accepts || COLUMN_PARENTS.has(type);
    items.push({
      key,
      pos,
      node: child,
      depth,
      index: index + 1,
      children: nested && !empty ? itemsOf(child, pos, depth + 1, `${key}.`) : [],
      accepts,
      fixed: type === 'columnsColumn',
      empty,
    });
  });
  return items;
}

export function buildLayers(doc: PMNode): LayerItem[] {
  const root = findRootContainer(doc);
  return root ? itemsOf(root.node, root.pos, 0, '') : [];
}

export type LayerZone = 'before' | 'after' | 'inside';

/** Which part of a row the pointer is over, given what the row can accept. */
export function zoneFor(item: LayerItem, ratio: number): LayerZone {
  if (item.fixed) return 'inside';
  if (item.accepts) return ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside';
  return ratio < 0.5 ? 'before' : 'after';
}

/** Translates a layers-panel drop into a document position, validated by the schema. */
export function layerDropTarget(
  doc: PMNode,
  item: LayerItem,
  zone: LayerZone,
  fragment: Fragment,
  exclude?: { from: number; to: number },
): DropTarget | null {
  let pos: number;
  let replaceTo: number | undefined;

  if (zone === 'inside') {
    if (!item.accepts) return null;
    if (item.empty) {
      pos = item.pos + 1;
      replaceTo = pos + item.node.firstChild!.nodeSize;
    } else {
      pos = item.pos + item.node.nodeSize - 1;
    }
  } else {
    if (item.fixed) return null;
    pos = zone === 'before' ? item.pos : item.pos + item.node.nodeSize;
  }

  // A block can't be dropped into itself, and dropping next to itself is a no-op.
  if (exclude && pos >= exclude.from && pos <= exclude.to) return null;

  const $pos = doc.resolve(pos);
  const index = $pos.index();
  const ok = $pos.parent.canReplace(index, replaceTo !== undefined ? index + 1 : index, fragment);
  return ok ? { pos, replaceTo } : null;
}
