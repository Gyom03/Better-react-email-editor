import type { JSONContent } from '@tiptap/core';
import type { DragEvent } from 'react';
import { useEmailEditor } from '../context';
import { appendBlocks, DND_MIME } from '../core/dnd';

/**
 * Makes any element a source of new blocks: drag it onto the canvas or the
 * layers panel, or click it to append the blocks at the end of the email.
 *
 * ```tsx
 * const drag = useDraggableBlock('Promo', () => [paragraph('-20% today')]);
 * return <button {...drag}>Promo</button>;
 * ```
 */
export function useDraggableBlock(label: string, content: () => JSONContent[]) {
  const { editor, dragSession } = useEmailEditor();
  return {
    draggable: true,
    onDragStart: (event: DragEvent) => {
      dragSession.start({ kind: 'new', label, content });
      event.dataTransfer.setData(DND_MIME, label);
      event.dataTransfer.effectAllowed = 'copy';
    },
    onDragEnd: () => dragSession.end(),
    onClick: () => appendBlocks(editor, content()),
  };
}
