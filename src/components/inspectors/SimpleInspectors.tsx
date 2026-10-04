import { useMessages } from '../../context';
import { cx } from '../../core/cx';
import type { InspectorProps } from '../../registry/types';
import { ColorInput, Field, Group, NumberInput, RangeInput, Segmented, TextArea } from '../fields';
import { BoxGroup, css, SpacingGroup } from './groups';

export function SpacerInspector({ ctx, className, style }: InspectorProps) {
  const t = useMessages();
  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <Group title={t.inspector.spacer}>
        <Field label={t.inspector.height}>
          <RangeInput value={ctx.getAttr('height')} min={4} max={160} onChange={(v) => ctx.setAttr('height', v)} />
        </Field>
      </Group>
    </div>
  );
}

export function HtmlInspector({ ctx, className, style }: InspectorProps) {
  const t = useMessages();
  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <Group title={t.inspector.htmlCode}>
        <TextArea value={String(ctx.getAttr('html') ?? '')} onChange={(v) => ctx.setAttr('html', v)} rows={14} />
        <p className="bree-hint">{t.inspector.htmlHint}</p>
      </Group>
    </div>
  );
}

export function DividerInspector({ ctx, className, style }: InspectorProps) {
  const t = useMessages();
  const i = t.inspector;
  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <Group title={i.line}>
        <Field label={i.color} stacked>
          <ColorInput value={ctx.getStyle(css('borderTopColor'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('borderTopColor'), v)} />
        </Field>
        <Field label={i.thickness}>
          <NumberInput
            value={ctx.getStyle(css('borderTopWidth')) ?? 1}
            onChange={(v) =>
              ctx.batchSetStyle([
                { prop: css('borderTopWidth'), value: v },
                { prop: css('borderTopStyle'), value: 'solid' },
              ])
            }
            min={1}
            max={12}
          />
        </Field>
        <Field label={i.lineStyle}>
          <Segmented
            value={String(ctx.getStyle(css('borderTopStyle')) ?? 'solid')}
            onChange={(v) => ctx.setStyle(css('borderTopStyle'), v)}
            options={[
              { value: 'solid', label: '———' },
              { value: 'dashed', label: '- - -' },
              { value: 'dotted', label: '· · ·' },
            ]}
          />
        </Field>
      </Group>
    </div>
  );
}

/** Sections and columns: background, border and padding. */
export function ContainerInspector({ ctx, className, style }: InspectorProps) {
  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <BoxGroup ctx={ctx} />
      <SpacingGroup ctx={ctx} />
    </div>
  );
}
