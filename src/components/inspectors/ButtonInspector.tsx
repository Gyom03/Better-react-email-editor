import { useMessages } from '../../context';
import { cx } from '../../core/cx';
import type { InspectorProps } from '../../registry/types';
import { AlignInput, ColorInput, Field, Group, NumberInput, TextInput } from '../fields';
import { css, SpacingGroup } from './groups';

export function ButtonInspector({ ctx, className, style }: InspectorProps) {
  const t = useMessages();
  const i = t.inspector;
  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <Group title={i.action}>
        <Field label={i.linkUrl} stacked>
          <TextInput value={String(ctx.getAttr('href') ?? '')} onChange={(v) => ctx.setAttr('href', v)} placeholder="https://" />
        </Field>
      </Group>
      <Group title={i.button}>
        <Field label={i.alignment}>
          <AlignInput value={String(ctx.getAttr('alignment') ?? 'left')} onChange={(v) => ctx.setAttr('alignment', v)} />
        </Field>
        <Field label={i.backgroundColor} stacked>
          <ColorInput value={ctx.getStyle(css('backgroundColor'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('backgroundColor'), v)} />
        </Field>
        <Field label={i.textColor} stacked>
          <ColorInput value={ctx.getStyle(css('color'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('color'), v)} />
        </Field>
        <Field label={i.textSize}>
          <NumberInput value={ctx.getStyle(css('fontSize'))} onChange={(v) => ctx.setStyle(css('fontSize'), v)} min={8} max={48} />
        </Field>
        <Field label={i.radius}>
          <NumberInput value={ctx.getStyle(css('borderRadius'))} onChange={(v) => ctx.setStyle(css('borderRadius'), v)} />
        </Field>
      </Group>
      <SpacingGroup ctx={ctx} title={i.buttonPadding} />
    </div>
  );
}
