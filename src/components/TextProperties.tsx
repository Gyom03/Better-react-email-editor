import { BoldIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, type InspectorTextContext } from '@react-email/editor/ui';
import { useMessages } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { ColorInput, Field, Group } from './fields';
import { TypographyGroup } from './inspectors/groups';
import { PropertiesPanel } from './PropertiesPanel';

export interface TextPropertiesProps extends StyleProps {
  ctx: InspectorTextContext;
}

/** Properties of a text selection: marks, typography and link color. */
export function TextProperties({ ctx, className, style }: TextPropertiesProps) {
  const t = useMessages();
  const i = t.inspector;
  const marks = [
    { mark: 'bold', Icon: BoldIcon, title: i.bold },
    { mark: 'italic', Icon: ItalicIcon, title: i.italic },
    { mark: 'underline', Icon: UnderlineIcon, title: i.underline },
    { mark: 'strike', Icon: StrikethroughIcon, title: i.strike },
  ];
  return (
    <PropertiesPanel title={t.sidebar.selectedText} className={className} style={style}>
      <Group title={i.formatting}>
        <div className="bree-mark-row">
          {marks.map(({ mark, Icon, title }) => (
            <button
              key={mark}
              type="button"
              title={title}
              aria-pressed={!!ctx.marks[mark]}
              className={cx('bree-mark', ctx.marks[mark] && 'bree-active')}
              onClick={() => ctx.toggleMark(mark)}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </Group>
      <TypographyGroup ctx={ctx} alignment={ctx.alignment} setAlignment={ctx.setAlignment} />
      {ctx.isLinkActive && (
        <Group title={i.link}>
          <Field label={i.url} stacked>
            <span className="bree-readonly">{ctx.linkHref}</span>
          </Field>
          <Field label={i.linkColor} stacked>
            <ColorInput value={ctx.linkColor} presets={ctx.presetColors} onChange={ctx.setLinkColor} />
          </Field>
        </Group>
      )}
    </PropertiesPanel>
  );
}
