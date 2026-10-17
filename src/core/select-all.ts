import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, Selection, TextSelection } from '@tiptap/pm/state';
import { ReplaceStep } from '@tiptap/pm/transform';

/**
 * The package's Mod-a inside a column selects the whole column with a
 * TextSelection whose ends sit on the column itself, not in text. Deleting it
 * (Delete, Backspace, cut) empties the column, but the mapped selection then
 * lands outside it: on the next block as a NodeSelection (the next key
 * replaces that block) or in the next column. Put the caret back in the
 * emptied column instead.
 */
export const SelectAllFix = Extension.create({
  name: 'selectAllFix',

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
