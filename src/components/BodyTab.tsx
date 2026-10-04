import type { InspectorDocumentProps } from '@react-email/editor/ui';
import { useEmailEditor } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { ColorInput, Field, Group, NumberInput, TextInput } from './fields';

/** Context given by `Inspector.Document`: global (theme) styles of the email. */
export type DocumentContext = Parameters<NonNullable<InspectorDocumentProps['children']>>[0];

export interface BodyTabProps extends StyleProps {
  ctx: DocumentContext;
}

/** "Body" tab: email-wide settings (background, width, default colors, preview text). */
export function BodyTab({ ctx, className, style }: BodyTabProps) {
  const { settings, updateSettings, t } = useEmailEditor();
  const b = t.body;
  const { findStyleValue, setGlobalStyle } = ctx;
  return (
    <div className={cx('bree-body-tab', className)} style={style}>
      <Group title={b.general}>
        <Field label={b.previewText} stacked>
          <TextInput value={settings.previewText} onChange={(previewText) => updateSettings({ previewText })} placeholder={b.previewTextPlaceholder} />
        </Field>
      </Group>
      <Group title={b.background}>
        <Field label={b.backgroundColor} stacked>
          <ColorInput value={findStyleValue('body', 'backgroundColor')} onChange={(v) => setGlobalStyle('body', 'backgroundColor', v)} />
        </Field>
        <Field label={b.outerPadding}>
          <NumberInput value={findStyleValue('body', 'padding')} onChange={(v) => setGlobalStyle('body', 'padding', v)} />
        </Field>
      </Group>
      <Group title={b.content}>
        <Field label={b.width}>
          <NumberInput value={findStyleValue('container', 'width')} onChange={(v) => setGlobalStyle('container', 'width', v)} min={320} max={900} />
        </Field>
        <Field label={b.contentColor} stacked>
          <ColorInput value={findStyleValue('container', 'backgroundColor')} onChange={(v) => setGlobalStyle('container', 'backgroundColor', v)} />
        </Field>
        <Field label={b.innerPadding}>
          <NumberInput value={findStyleValue('container', 'padding')} onChange={(v) => setGlobalStyle('container', 'padding', v)} />
        </Field>
        <Field label={b.radius}>
          <NumberInput value={findStyleValue('container', 'borderRadius')} onChange={(v) => setGlobalStyle('container', 'borderRadius', v)} />
        </Field>
      </Group>
      <Group title={b.defaultStyles}>
        <Field label={b.text} stacked>
          <ColorInput value={findStyleValue('paragraph', 'color')} onChange={(v) => setGlobalStyle('paragraph', 'color', v)} />
        </Field>
        <Field label={b.headings} stacked>
          <ColorInput
            value={findStyleValue('h1', 'color')}
            onChange={(v) =>
              ctx.batchSetGlobalStyle((['h1', 'h2', 'h3'] as const).map((classReference) => ({ classReference, property: 'color', value: v })))
            }
          />
        </Field>
        <Field label={b.links} stacked>
          <ColorInput value={findStyleValue('link', 'color')} onChange={(v) => setGlobalStyle('link', 'color', v)} />
        </Field>
        <Field label={b.buttonBackground} stacked>
          <ColorInput value={findStyleValue('button', 'backgroundColor')} onChange={(v) => setGlobalStyle('button', 'backgroundColor', v)} />
        </Field>
        <Field label={b.buttonText} stacked>
          <ColorInput value={findStyleValue('button', 'color')} onChange={(v) => setGlobalStyle('button', 'color', v)} />
        </Field>
      </Group>
    </div>
  );
}
