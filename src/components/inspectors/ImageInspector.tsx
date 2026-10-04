import { useEmailEditor } from '../../context';
import { cx } from '../../core/cx';
import type { InspectorProps } from '../../registry/types';
import { AlignInput, Field, Group, NumberInput, RangeInput, TextInput } from '../fields';
import { css, SpacingGroup } from './groups';

export function ImageInspector({ ctx, className, style }: InspectorProps) {
  const { t, uploadImage } = useEmailEditor();
  const i = t.inspector;
  const width = String(ctx.getAttr('width') ?? 'auto');
  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <Group title={i.image}>
        <div className="bree-image-preview">{ctx.getAttr('src') ? <img src={String(ctx.getAttr('src'))} alt="" /> : null}</div>
        <label className="bree-button-like">
          {i.uploadImage}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) ctx.setAttr('src', (await uploadImage(file)).url);
              e.target.value = '';
            }}
          />
        </label>
        <Field label={i.imageUrl} stacked>
          <TextInput value={String(ctx.getAttr('src') ?? '')} onChange={(v) => ctx.setAttr('src', v)} />
        </Field>
        <Field label={i.altText} stacked>
          <TextInput value={String(ctx.getAttr('alt') ?? '')} onChange={(v) => ctx.setAttr('alt', v)} placeholder={i.altPlaceholder} />
        </Field>
      </Group>
      <Group title={i.layout}>
        <Field label={i.autoWidth}>
          <input type="checkbox" checked={width === 'auto'} onChange={(e) => ctx.setAttr('width', e.target.checked ? 'auto' : '300')} />
        </Field>
        {width !== 'auto' && (
          <Field label={i.width}>
            <RangeInput value={width} min={20} max={900} onChange={(v) => ctx.setAttr('width', String(v))} />
          </Field>
        )}
        <Field label={i.alignment}>
          <AlignInput value={String(ctx.getAttr('alignment') ?? 'center')} onChange={(v) => ctx.setAttr('alignment', v)} />
        </Field>
        <Field label={i.radius}>
          <NumberInput value={ctx.getStyle(css('borderRadius'))} onChange={(v) => ctx.setStyle(css('borderRadius'), v)} />
        </Field>
      </Group>
      <Group title={i.action}>
        <Field label={i.clickLink} stacked>
          <TextInput value={String(ctx.getAttr('href') ?? '')} onChange={(v) => ctx.setAttr('href', v || null)} placeholder="https://" />
        </Field>
      </Group>
      <SpacingGroup ctx={ctx} />
    </div>
  );
}
