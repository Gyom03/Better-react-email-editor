import type { JSONContent } from '@tiptap/core';

/**
 * Small helpers to build email JSON (the editor's document format).
 * Handy to write palette items, templates or starter documents.
 */

type Attrs = Record<string, unknown>;

export const text = (value: string, marks?: JSONContent['marks']): JSONContent => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});

export const paragraph = (value: string | JSONContent[] = '', attrs: Attrs = {}): JSONContent => ({
  type: 'paragraph',
  attrs,
  content: typeof value === 'string' ? (value ? [text(value)] : []) : value,
});

export const heading = (level: 1 | 2 | 3, value: string, attrs: Attrs = {}): JSONContent => ({
  type: 'heading',
  attrs: { level, ...attrs },
  content: [text(value)],
});

export const button = (label: string, attrs: Attrs = {}): JSONContent => ({
  type: 'button',
  attrs: { href: 'https://example.com', alignment: 'center', ...attrs },
  content: [text(label)],
});

export const image = (src: string, attrs: Attrs = {}): JSONContent => ({
  type: 'image',
  attrs: { src, alt: '', alignment: 'center', ...attrs },
});

export const column = (...content: JSONContent[]): JSONContent => ({
  type: 'columnsColumn',
  content: content.length ? content : [paragraph()],
});

/** Sets a column's width, in percent of its row. */
export const sized = (col: JSONContent, width: number): JSONContent => ({
  ...col,
  attrs: { ...col.attrs, style: `width:${width}%` },
});

export const columns = (count: 2 | 3 | 4, cols?: JSONContent[], attrs?: Attrs): JSONContent => ({
  type: ({ 2: 'twoColumns', 3: 'threeColumns', 4: 'fourColumns' } as const)[count],
  ...(attrs ? { attrs } : {}),
  content: cols ?? Array.from({ length: count }, () => column()),
});

export const section = (style: string, ...content: JSONContent[]): JSONContent => ({
  type: 'section',
  attrs: { style },
  content,
});

/** Longhand paddings keep the inspector's per-side controls accurate. */
export const padding = (y: number, x = y) =>
  `padding-top:${y}px;padding-right:${x}px;padding-bottom:${y}px;padding-left:${x}px`;

export const link = (href: string) => [{ type: 'link', attrs: { href } }];

export const placeholderImage = (w: number, h: number, label = 'Image') =>
  `https://placehold.co/${w}x${h}/e2e8f0/64748b/png?text=${encodeURIComponent(label)}`;

/** Wraps blocks into a full document. */
export const doc = (...content: JSONContent[]): JSONContent => ({ type: 'doc', content });
