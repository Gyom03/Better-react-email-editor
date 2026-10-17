import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import { BubbleMenu, defaultSlashCommands, SlashCommand, type SlashCommandItem } from '@react-email/editor/ui';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
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

interface HeaderBox {
  top: number;
  left: number;
  width: number;
  radius: string;
}

/**
 * Places the header card on top of the email container, so both read as one
 * card. The container makes room for it with a top margin
 * (`--bree-email-header-height`); everything is measured from the DOM, so it
 * follows any theme width, padding or radius and the device toggle.
 */
function useHeaderBox(editor: Editor, host: HTMLElement | null, header: HTMLElement | null): HeaderBox | null {
  const [box, setBox] = useState<HeaderBox | null>(null);
  useEffect(() => {
    if (!host || !header) return;
    let raf = 0;
    let observed: Element | null = null;
    const read = () => {
      host.style.setProperty('--bree-email-header-height', `${header.offsetHeight}px`);
      const container = editor.view.dom.querySelector(':scope > .node-container');
      if (container !== observed) {
        if (observed) resize.unobserve(observed);
        if (container) resize.observe(container);
        observed = container;
      }
      if (!(container instanceof HTMLElement)) {
        setBox(null);
        return;
      }
      const hostRect = host.getBoundingClientRect();
      const rect = container.getBoundingClientRect();
      const next = {
        top: rect.top - hostRect.top + host.scrollTop - header.offsetHeight,
        left: rect.left - hostRect.left + host.scrollLeft,
        width: rect.width,
        // Top corners are squared off in the canvas (see styles.css): the bottom ones keep the theme's radius.
        radius: getComputedStyle(container).borderBottomLeftRadius,
      };
      setBox((prev) =>
        prev && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.radius === next.radius ? prev : next,
      );
    };
    // Theme styles land after the transaction: read on the next frame.
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(host);
    resize.observe(header);
    read();
    editor.on('update', schedule);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      editor.off('update', schedule);
      host.style.removeProperty('--bree-email-header-height');
    };
  }, [editor, host, header]);
  return header ? box : null;
}

/** The editable email. Scrolls on its own: give it a height through its parent or `style`. */
export function Canvas({ overlay = true, bubbleMenu = true, slashCommands = true, header = false, className, style, children }: CanvasProps) {
  const { editor, device, t } = useEmailEditor();
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [headerEl, setHeaderEl] = useState<HTMLDivElement | null>(null);
  const box = useHeaderBox(editor, host, header ? headerEl : null);

  const slashItems = useMemo(() => {
    if (Array.isArray(slashCommands)) return slashCommands;
    return defaultSlashCommands.map((item) => ({ ...item, ...t.slashCommands[item.title] }));
  }, [slashCommands, t]);

  return (
    <div ref={setHost} className={cx('bree-canvas', className)} style={style} data-device={device} data-email-header={header || undefined}>
      {header && (
        <div
          ref={setHeaderEl}
          className="bree-canvas-header"
          data-placed={box ? '' : undefined}
          style={box ? { position: 'absolute', top: box.top, left: box.left, width: box.width, '--bree-email-header-radius': box.radius } as CSSProperties : undefined}
        >
          <EmailHeader />
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
