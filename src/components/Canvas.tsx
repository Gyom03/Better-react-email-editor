import { EditorContent } from '@tiptap/react';
import { BubbleMenu, defaultSlashCommands, SlashCommand, type SlashCommandItem } from '@react-email/editor/ui';
import { useMemo, useState, type ReactNode } from 'react';
import { useEmailEditor } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { CanvasOverlay } from './CanvasOverlay';

export interface CanvasProps extends StyleProps {
  /** Hover / selection frames, block toolbar and drag & drop. Default: true. */
  overlay?: boolean;
  /** The package's floating text menu (bold, link…). Default: true. */
  bubbleMenu?: boolean;
  /** "/" command menu. `true` (default), `false`, or your own items. */
  slashCommands?: boolean | SlashCommandItem[];
  /** Extra content rendered inside the canvas scroll area. */
  children?: ReactNode;
}

/** The editable email. Scrolls on its own: give it a height through its parent or `style`. */
export function Canvas({ overlay = true, bubbleMenu = true, slashCommands = true, className, style, children }: CanvasProps) {
  const { editor, device, t } = useEmailEditor();
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  const slashItems = useMemo(() => {
    if (Array.isArray(slashCommands)) return slashCommands;
    return defaultSlashCommands.map((item) => ({ ...item, ...t.slashCommands[item.title] }));
  }, [slashCommands, t]);

  return (
    <div ref={setHost} className={cx('bree-canvas', className)} style={style} data-device={device}>
      <EditorContent editor={editor} className="bree-canvas-content" />
      {bubbleMenu && (
        <>
          <BubbleMenu hideWhenActiveNodes={['button', 'horizontalRule']} hideWhenActiveMarks={['link']} />
          <BubbleMenu.LinkDefault />
          <BubbleMenu.ButtonDefault />
          <BubbleMenu.ImageDefault />
        </>
      )}
      {slashCommands !== false && <SlashCommand items={slashItems} />}
      {overlay && host && <CanvasOverlay editor={editor} host={host} />}
      {children}
    </div>
  );
}
