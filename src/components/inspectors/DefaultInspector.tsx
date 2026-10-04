import { cx } from '../../core/cx';
import type { InspectorProps } from '../../registry/types';
import { BoxGroup, SpacingGroup, TypographyGroup } from './groups';

/** Text-like blocks (paragraph, list, quote…) and any node without its own inspector. */
export function DefaultInspector({ ctx, className, style }: InspectorProps) {
  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <TypographyGroup ctx={ctx} alignment={String(ctx.getAttr('alignment') ?? 'left')} setAlignment={(v) => ctx.setAttr('alignment', v)} />
      <SpacingGroup ctx={ctx} />
      <BoxGroup ctx={ctx} />
    </div>
  );
}
