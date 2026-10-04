import { useMessages } from '../../context';
import { cx } from '../../core/cx';
import type { InspectorProps } from '../../registry/types';
import { Field, Group, Segmented } from '../fields';
import { BoxGroup, SpacingGroup, TypographyGroup } from './groups';

export function HeadingInspector({ ctx, className, style }: InspectorProps) {
  const t = useMessages();
  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <Group title={t.inspector.heading}>
        <Field label={t.inspector.level}>
          <Segmented
            value={String(ctx.getAttr('level') ?? 1)}
            onChange={(v) => ctx.setAttr('level', Number(v))}
            options={[
              { value: '1', label: 'H1' },
              { value: '2', label: 'H2' },
              { value: '3', label: 'H3' },
            ]}
          />
        </Field>
      </Group>
      <TypographyGroup ctx={ctx} alignment={String(ctx.getAttr('alignment') ?? 'left')} setAlignment={(v) => ctx.setAttr('alignment', v)} />
      <SpacingGroup ctx={ctx} />
      <BoxGroup ctx={ctx} />
    </div>
  );
}
