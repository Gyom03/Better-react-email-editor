import type { DragPayload } from './dnd';

/**
 * Per-editor state shared by the canvas, the palette and the layers panel.
 * One instance lives in each `EditorRoot`, so several editors can coexist on a page.
 */

/** Only one drag happens at a time; `dragover` can't read dataTransfer payloads, so the active payload lives here. */
export interface DragSession {
  get: () => DragPayload | null;
  start: (payload: DragPayload) => void;
  end: () => void;
}

export function createDragSession(): DragSession {
  let active: DragPayload | null = null;
  return {
    get: () => active,
    start: (payload) => {
      active = payload;
    },
    end: () => {
      active = null;
    },
  };
}

/** Hovered block position: the canvas and the layers panel highlight the same block. */
export interface HoverStore {
  get: () => number | null;
  set: (pos: number | null) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createHoverStore(): HoverStore {
  let hoverPos: number | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => hoverPos,
    set: (pos) => {
      if (pos === hoverPos) return;
      hoverPos = pos;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
