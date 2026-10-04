import type { Editor } from '@tiptap/core';
import { Button } from '@react-email/editor/extensions';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { COLUMN_PARENTS } from './dnd';

/**
 * The package's Button renders `data-href` and wraps the link in
 * `div.align-*`, but its parseHTML reads neither: a copied button came back
 * with href "#" and left-aligned. Read them back so copy/paste round-trips.
 */
export const EmailButton = Button.extend({
  parseHTML() {
    return [
      {
        tag: 'a[data-id="react-email-button"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const el = node as HTMLElement;
          const alignment = el.parentElement?.className.match(/align-(left|center|right)/)?.[1];
          const cls = el.className.replace(/\bnode-button\b/g, '').trim();
          return {
            href: el.getAttribute('href') ?? el.dataset.href ?? '#',
            alignment: alignment ?? 'left',
            class: cls || 'button',
            style: el.getAttribute('style'),
          };
        },
      },
    ];
  },
});

/**
 * Block-friendly paste, wired as a capture-phase `paste` listener on the canvas:
 *
 * 1. With a block selected (NodeSelection), ProseMirror would *replace* it.
 *    Builders (Unlayer, Elementor) paste *after* it instead, so copy + paste on
 *    the same block duplicates it. We open an empty paragraph after the block
 *    and paste there.
 * 2. Content copied from this editor (`data-pm-slice`) is replayed through
 *    `view.pasteHTML` without clipboard data, which makes the package's paste
 *    handler step aside and lets ProseMirror restore the exact slice.
 *    External HTML still goes through the package's sanitizer.
 *
 * Returns true when the event was handled.
 */
export function handleCanvasPaste(editor: Editor, event: ClipboardEvent): boolean {
  const html = event.clipboardData?.getData('text/html') ?? '';
  const internal = html.includes('data-pm-slice');
  const hasFiles = (event.clipboardData?.files?.length ?? 0) > 0;
  if (hasFiles) return false; // image files: the image extension uploads them

  const { view } = editor;
  const { state } = view;
  const { selection } = state;

  if (selection instanceof NodeSelection && selection.node.isBlock) {
    const node = selection.node;
    // A column can't get siblings: paste at the end of its content instead.
    const isColumn = node.type.name === 'columnsColumn';
    const insertAt = isColumn ? selection.from + node.nodeSize - 1 : selection.from + node.nodeSize;
    const $insert = state.doc.resolve(insertAt);
    const paragraph = state.schema.nodes.paragraph;
    if (COLUMN_PARENTS.has($insert.parent.type.name)) return false;
    if (!$insert.parent.canReplaceWith($insert.index(), $insert.index(), paragraph)) return false;
    // Divider's filterTransaction rejects inserts while a divider is node-selected:
    // collapse the selection in a first transaction.
    view.dispatch(state.tr.setSelection(TextSelection.near($insert)));
    const tr = view.state.tr.insert(insertAt, paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, insertAt + 1));
    view.dispatch(tr);
  }

  if (!internal) return false; // let the browser event continue (package handler / ProseMirror)

  event.preventDefault();
  event.stopPropagation();
  view.pasteHTML(html);
  return true;
}
