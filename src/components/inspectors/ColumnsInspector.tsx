import { NodeSelection } from '@tiptap/pm/state';
import { useEmailEditor } from '../../context';
import { cx } from '../../core/cx';
import type { InspectorProps } from '../../registry/types';
import { Field, Group, NumberInput } from '../fields';

/** Rows of 2, 3 or 4 columns: width presets and gap. */
export function ColumnsInspector({ ctx, className, style }: InspectorProps) {
  const { editor, t } = useEmailEditor();
  const i = t.inspector;
  const count = ({ twoColumns: 2, threeColumns: 3, fourColumns: 4 } as Record<string, number>)[ctx.nodeType] ?? 2;
  const presets: Array<[string, number[]]> =
    count === 2
      ? [
          ['50 / 50', [50, 50]],
          ['33 / 67', [33, 67]],
          ['67 / 33', [67, 33]],
          ['25 / 75', [25, 75]],
        ]
      : count === 3
        ? [
            [i.equal, [33.33, 33.33, 33.34]],
            ['25 / 50 / 25', [25, 50, 25]],
          ]
        : [[i.equal, [25, 25, 25, 25]]];

  const applyWidths = (widths: number[]) => {
    const { state } = editor;
    const row = state.doc.nodeAt(ctx.nodePos.pos);
    if (!row) return;
    const tr = state.tr;
    row.forEach((col, offset, index) => {
      const pos = ctx.nodePos.pos + 1 + offset;
      const rest = String(col.attrs.style ?? '')
        .split(';')
        .filter((d) => d.trim() && !d.trim().startsWith('width'))
        .join(';');
      tr.setNodeMarkup(pos, undefined, { ...col.attrs, style: `${rest ? `${rest};` : ''}width:${widths[index]}%` });
    });
    if (state.selection instanceof NodeSelection) tr.setSelection(NodeSelection.create(tr.doc, ctx.nodePos.pos));
    editor.view.dispatch(tr);
  };

  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <Group title={i.columns}>
        <Field label={i.distribution} stacked>
          <div className="bree-ratio-grid">
            {presets.map(([label, widths]) => (
              <button key={label} type="button" className="bree-ratio" onClick={() => applyWidths(widths)}>
                <span className="bree-ratio-bars">
                  {widths.map((w, index) => (
                    <i key={index} style={{ flex: w }} />
                  ))}
                </span>
                {label}
              </button>
            ))}
          </div>
        </Field>
        <Field label={i.columnGap}>
          <NumberInput value={ctx.getAttr('cellspacing') ?? 0} onChange={(v) => ctx.setAttr('cellspacing', v === '' ? null : v)} />
        </Field>
        <p className="bree-hint">{i.columnsHint}</p>
      </Group>
    </div>
  );
}
