import { useEmailEditor, useI18n } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { resolveLabel } from '../i18n';
import { TemplateThumbnail } from '../registry/default-templates';
import type { TemplateItem } from '../registry/types';
import { useDraggableBlock } from './useDraggableBlock';

export interface TemplateCardProps extends StyleProps {
  template: TemplateItem;
}

/** One draggable prebuilt row. */
export function TemplateCard({ template, className, style }: TemplateCardProps) {
  const i18n = useI18n();
  const label = resolveLabel(template.label, i18n);
  const drag = useDraggableBlock(label, () => template.content(i18n));
  return (
    <button type="button" className={cx('bree-block-card', className)} style={style} {...drag}>
      {template.thumbnail ?? <TemplateThumbnail variant="default" />}
      <span className="bree-block-text">
        <strong>{label}</strong>
        {template.description && <span>{resolveLabel(template.description, i18n)}</span>}
      </span>
    </button>
  );
}

export interface BlocksTabProps extends StyleProps {
  /** Defaults to the editor's `templates`. */
  templates?: TemplateItem[];
}

/** "Blocks" tab: prebuilt rows (header, hero, footer…). */
export function BlocksTab({ templates, className, style }: BlocksTabProps) {
  const ctx = useEmailEditor();
  return (
    <div className={cx('bree-block-list', className)} style={style}>
      {(templates ?? ctx.templates).map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
