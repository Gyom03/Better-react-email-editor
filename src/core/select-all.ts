import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, Selection, TextSelection } from '@tiptap/pm/state';
import { ReplaceStep } from '@tiptap/pm/transform';

const SCOPES = new Set(['columnsColumn', 'codeBlock']);

/**
 * Select-all that keeps the email's structure.
 *
 * The package's Mod-a inside a column selects the whole column with a
 * TextSelection whose ends sit on the column itself, not in text. Deleting it
 * (Delete, Backspace, cut) empties the column, but the mapped selection then
 * lands outside it: on the next block as a NodeSelection (the next key
 * replaces that block) or in the next column. Put the caret back in the
 * emptied column instead.
 */
export const SelectAllFix = Extension.create({
  name: 'selectAllFix',
  // Above Tiptap's core keymap, whose Mod-a selects the whole document.
  priority: 101,

  addKeyboardShortcuts() {
    return {
      // The default select-all also takes the hidden globalContent node (email
      // body styles) and the container: deleting it wiped the theme and layout.
      // Select the container's content instead.
      'Mod-a': ({ editor }) => {
        const { state } = editor;
        // A column or code block not yet fully selected: its own Mod-a selects it.
        const { $from } = state.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          if (!SCOPES.has($from.node(depth).type.name)) continue;
          if (state.selection.from !== $from.start(depth) || state.selection.to !== $from.end(depth)) return false;
        }
        let pos = -1;
        state.doc.forEach((node, offset) => {
          if (pos < 0 && node.type.name === 'container') pos = offset;
        });
        const container = pos < 0 ? null : state.doc.nodeAt(pos);
        if (!container) return false;
        const from = pos + 1;
        const to = pos + container.nodeSize - 1;
        if (state.selection.from !== from || state.selection.to !== to) {
          editor.view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, from, to)));
        }
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('selectAllFix'),
        appendTransaction(transactions, oldState, newState) {
          const old = oldState.selection;
          if (!(old instanceof TextSelection) || (old.$from.parent.inlineContent && old.$to.parent.inlineContent)) return null;
          const replacesSelection = transactions.some((tr) =>
            tr.steps.some((step) => step instanceof ReplaceStep && step.from === old.from && step.to === old.to),
          );
          if (!replacesSelection) return null;

          let from = old.from;
          let to = old.to;
          for (const tr of transactions) {
            from = tr.mapping.map(from, -1);
            to = tr.mapping.map(to, 1);
          }
          // Typing or pasting over the selection leaves the caret in what was inserted.
          const { selection } = newState;
          if (selection instanceof TextSelection && selection.from >= from && selection.to <= to) return null;

          const $pos = newState.doc.resolve(from);
          return newState.tr.setSelection(Selection.findFrom($pos, 1, true) ?? Selection.near($pos));
        },
      }),
    ];
  },
});
