import { useId } from 'react';
import { useEmailEditor } from '../context';
import { cx, type StyleProps } from '../core/cx';

export type EmailHeaderProps = StyleProps;

/** Card with the subject line and the preview text, as an inbox shows them. */
export function EmailHeader({ className, style }: EmailHeaderProps) {
  const { settings, updateSettings, t } = useEmailEditor();
  const h = t.emailHeader;
  const id = useId();
  return (
    <div className={cx('bree-email-header', className)} style={style}>
      <div className="bree-email-header-row">
        <label htmlFor={`${id}-subject`}>{h.subject}</label>
        <input
          id={`${id}-subject`}
          className="bree-email-header-subject"
          value={settings.subject ?? ''}
          placeholder={h.subjectPlaceholder}
          onChange={(e) => updateSettings({ subject: e.target.value })}
        />
      </div>
      <div className="bree-email-header-row">
        <label htmlFor={`${id}-preview`}>{h.previewText}</label>
        <input
          id={`${id}-preview`}
          value={settings.previewText}
          placeholder={h.previewTextPlaceholder}
          onChange={(e) => updateSettings({ previewText: e.target.value })}
        />
      </div>
    </div>
  );
}
