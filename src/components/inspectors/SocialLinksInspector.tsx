import { XIcon } from '@react-email/editor/ui';
import { useMessages } from '../../context';
import { cx } from '../../core/cx';
import { SOCIAL_NETWORKS, type SocialLink } from '../../nodes/custom-nodes';
import type { InspectorProps } from '../../registry/types';
import { AlignInput, Field, Group, RangeInput, Select, TextInput } from '../fields';
import { SpacingGroup } from './groups';

export function SocialLinksInspector({ ctx, className, style }: InspectorProps) {
  const t = useMessages();
  const i = t.inspector;
  const raw = ctx.getAttr('links');
  const links: SocialLink[] = Array.isArray(raw) ? (raw as SocialLink[]) : [];
  const save = (next: SocialLink[]) => ctx.setAttr('links', next);
  return (
    <div className={cx('bree-inspector', className)} style={style}>
      <Group title={i.networks}>
        <div className="bree-social-list">
          {links.map((link, index) => (
            <div key={index} className="bree-social-row">
              <Select
                value={link.network}
                onChange={(network) => save(links.map((l, j) => (j === index ? { ...l, network } : l)))}
                options={Object.entries(SOCIAL_NETWORKS).map(([id, meta]) => [id, meta.label])}
              />
              <TextInput value={link.url} onChange={(url) => save(links.map((l, j) => (j === index ? { ...l, url } : l)))} />
              <button type="button" className="bree-icon-button" title={i.removeNetwork} onClick={() => save(links.filter((_, j) => j !== index))}>
                <XIcon size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="bree-button-like" onClick={() => save([...links, { network: 'youtube', url: 'https://youtube.com/' }])}>
          {i.addNetwork}
        </button>
      </Group>
      <Group title={i.appearance}>
        <Field label={i.iconSize}>
          <RangeInput value={ctx.getAttr('size')} min={16} max={64} onChange={(v) => ctx.setAttr('size', v)} />
        </Field>
        <Field label={i.gap}>
          <RangeInput value={ctx.getAttr('gap')} min={0} max={40} onChange={(v) => ctx.setAttr('gap', v)} />
        </Field>
        <Field label={i.alignment}>
          <AlignInput value={String(ctx.getAttr('alignment') ?? 'center')} onChange={(v) => ctx.setAttr('alignment', v)} />
        </Field>
      </Group>
      <SpacingGroup ctx={ctx} />
    </div>
  );
}
