import type { InspectorNodeContext } from '@react-email/editor/ui';
import type { KnownCssProperties } from '@react-email/editor/plugins';
import { useMessages } from '../../context';
import type { StyleProps } from '../../core/cx';
import { AlignInput, ColorInput, Field, Group, NumberInput, PaddingInput, Select } from '../fields';

/** Reusable groups of controls, shared by the built-in inspectors. */

export const css = (prop: string) => prop as KnownCssProperties;

export type StyleContext = Pick<InspectorNodeContext, 'getStyle' | 'setStyle' | 'presetColors'>;

export interface TypographyGroupProps extends StyleProps {
  ctx: StyleContext;
  alignment?: string;
  /** Shows the alignment control when set. */
  setAlignment?: (value: string) => void;
}

export function TypographyGroup({ ctx, alignment, setAlignment, className, style }: TypographyGroupProps) {
  const t = useMessages();
  const i = t.inspector;
  return (
    <Group title={i.typography} className={className} style={style}>
      <Field label={i.color} stacked>
        <ColorInput value={ctx.getStyle(css('color'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('color'), v)} />
      </Field>
      <Field label={i.size}>
        <NumberInput value={ctx.getStyle(css('fontSize'))} onChange={(v) => ctx.setStyle(css('fontSize'), v)} min={8} max={96} />
      </Field>
      <Field label={i.weight}>
        <Select
          value={String(ctx.getStyle(css('fontWeight')) ?? '400')}
          onChange={(v) => ctx.setStyle(css('fontWeight'), v)}
          options={[
            ['300', i.weightLight],
            ['400', i.weightNormal],
            ['600', i.weightSemibold],
            ['700', i.weightBold],
            ['800', i.weightExtrabold],
          ]}
        />
      </Field>
      <Field label={i.lineHeight}>
        <NumberInput value={ctx.getStyle(css('lineHeight'))} unit="%" onChange={(v) => ctx.setStyle(css('lineHeight'), v)} min={80} max={300} step={5} />
      </Field>
      {setAlignment && (
        <Field label={i.alignment}>
          <AlignInput value={alignment ?? 'left'} onChange={setAlignment} />
        </Field>
      )}
    </Group>
  );
}

export interface SpacingGroupProps extends StyleProps {
  ctx: InspectorNodeContext;
  title?: string;
}

export function SpacingGroup({ ctx, title, className, style }: SpacingGroupProps) {
  const t = useMessages();
  return (
    <Group title={title ?? t.inspector.spacing} className={className} style={style}>
      <Field label={t.inspector.padding} stacked>
        <PaddingInput
          get={(side) => ctx.getStyle(css(`padding${side}`)) ?? ctx.getStyle(css('padding'))}
          set={(changes) =>
            ctx.batchSetStyle([
              // Drop any shorthand so the four longhands are the single source of truth.
              { prop: css('padding'), value: '' },
              ...changes.map(([side, value]) => ({ prop: css(`padding${side}`), value })),
            ])
          }
        />
      </Field>
    </Group>
  );
}

export interface BoxGroupProps extends StyleProps {
  ctx: InspectorNodeContext;
}

export function BoxGroup({ ctx, className, style }: BoxGroupProps) {
  const t = useMessages();
  const i = t.inspector;
  return (
    <Group title={i.box} className={className} style={style}>
      <Field label={i.backgroundColor} stacked>
        <ColorInput value={ctx.getStyle(css('backgroundColor'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('backgroundColor'), v)} />
      </Field>
      <Field label={i.radius}>
        <NumberInput value={ctx.getStyle(css('borderRadius'))} onChange={(v) => ctx.setStyle(css('borderRadius'), v)} />
      </Field>
      <Field label={i.border}>
        <NumberInput
          value={ctx.getStyle(css('borderWidth'))}
          onChange={(v) =>
            ctx.batchSetStyle([
              { prop: css('borderWidth'), value: v },
              { prop: css('borderStyle'), value: v ? 'solid' : '' },
            ])
          }
        />
      </Field>
      <Field label={i.borderColor} stacked>
        <ColorInput value={ctx.getStyle(css('borderColor'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('borderColor'), v)} />
      </Field>
    </Group>
  );
}
