import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Spell check only where the user is writing: the text blocks of the
 * selection, while the editor has focus. The rest of the email shows no red
 * underlines. Tiptap dispatches a transaction on focus and blur, so the
 * decorations follow.
 */
export const FocusedSpellcheck = Extension.create({
  name: 'focusedSpellcheck',

  addProseMirrorPlugins() {
    const { editor } = this;
    return [
      new Plugin({
        key: new PluginKey('focusedSpellcheck'),
        props: {
          attributes: { spellcheck: 'false' },
          decorations: (state) => {
            if (!editor.isFocused) return DecorationSet.empty;
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
