import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { BubbleMenu, defaultSlashCommands, SlashCommand, type SlashCommandItem } from '@react-email/editor/ui';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useEmailEditor } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { CanvasOverlay } from './CanvasOverlay';
import { EmailHeader } from './EmailHeader';

export interface CanvasProps extends StyleProps {
  /** Hover / selection frames, block toolbar and drag & drop. Default: true. */
  overlay?: boolean;
  /** The package's floating text menu (bold, link…). Default: true. */
  bubbleMenu?: boolean;
  /** "/" command menu. `true` (default), `false`, or your own items. */
  slashCommands?: boolean | SlashCommandItem[];
  /** Subject and preview text fields above the email. Default: false. */
  header?: boolean;
  /** Extra content rendered inside the canvas scroll area. */
  children?: ReactNode;
}

interface EmailFrame {
  width: number | undefined;
  background: string;
}

/** Width of the email container and body background, so the header lines up with the email. */
function useEmailFrame(editor: Editor, enabled: boolean): EmailFrame | null {
  const [frame, setFrame] = useState<EmailFrame | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let observed: Element | null = null;
    const read = () => {
      const body = editor.view.dom;
      const container = body.querySelector(':scope > .node-container');
      if (container !== observed) {
        if (observed) resize.unobserve(observed);
        if (container) resize.observe(container);
        observed = container;
      }
      const next = {
        width: container instanceof HTMLElement ? container.offsetWidth : undefined,
        background: getComputedStyle(body).backgroundColor,
      };
      setFrame((prev) => (prev?.width === next.width && prev?.background === next.background ? prev : next));
    };
    // Theme styles land after the transaction: read on the next frame.
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    const resize = new ResizeObserver(schedule);
    read();
    editor.on('update', schedule);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      editor.off('update', schedule);
    };
  }, [editor, enabled]);
  return enabled ? frame : null;
}

/** The editable email. Scrolls on its own: give it a height through its parent or `style`. */
export function Canvas({ overlay = true, bubbleMenu = true, slashCommands = true, header = false, className, style, children }: CanvasProps) {
  const { editor, device, t } = useEmailEditor();
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const frame = useEmailFrame(editor, header);

  const slashItems = useMemo(() => {
    if (Array.isArray(slashCommands)) return slashCommands;
    return defaultSlashCommands.map((item) => ({ ...item, ...t.slashCommands[item.title] }));
  }, [slashCommands, t]);

  return (
    <div ref={setHost} className={cx('bree-canvas', className)} style={style} data-device={device}>
      {header && (
        <div className="bree-canvas-header" style={{ background: frame?.background }}>
          <EmailHeader style={{ width: frame?.width }} />
        </div>
      )}
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
