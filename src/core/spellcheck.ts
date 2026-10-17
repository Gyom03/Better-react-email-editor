import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Spell check only where the user is writing: the text blocks of the
 * selection, while the editable area has the browser focus. The rest of the
 * email shows no red underlines.
 *
 * Tracks DOM focus itself: `editor.isFocused` stays true while the user works
 * in the sidebar or top bar (the package's focus scopes keep the selection
 * alive for the properties panel).
 *
 * Firefox keeps underlines when a block's `spellcheck` attribute turns off, so
 * spell check is disabled there altogether.
 */
export const FocusedSpellcheck = Extension.create({
  name: 'focusedSpellcheck',

  addProseMirrorPlugins() {
    const key = new PluginKey<boolean>('focusedSpellcheck');
    const firefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
    let domFocused = false;
    return [
      new Plugin<boolean>({
        key,
        state: {
          init: () => false,
          // Redrawing while the click's mousedown is in progress (Tiptap's own
          // focus transaction) writes the previous selection back to the DOM,
          // and the caret lands in the old block. Skip that transaction: the
          // click's selection transaction comes right after.
          apply: (tr, active) => (tr.getMeta('focus') ? active : domFocused),
        },
        props: {
          attributes: { spellcheck: 'false' },
          handleDOMEvents: {
            focus: () => {
              domFocused = true;
              return false;
            },
            blur: (view) => {
              domFocused = false;
              view.dispatch(view.state.tr.setMeta('addToHistory', false));
              return false;
            },
          },
          decorations: (state) => {
            if (firefox || !key.getState(state)) return DecorationSet.empty;
            const { from, to, $from } = state.selection;
            const decorations: Decoration[] = [];
            state.doc.nodesBetween(from, to, (node, pos) => {
              if (!node.isTextblock) return true;
              decorations.push(Decoration.node(pos, pos + node.nodeSize, { spellcheck: 'true' }));
              return false;
            });
            if (!decorations.length && $from.parent.isTextblock && $from.depth > 0) {
              decorations.push(Decoration.node($from.before(), $from.after(), { spellcheck: 'true' }));
            }
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
