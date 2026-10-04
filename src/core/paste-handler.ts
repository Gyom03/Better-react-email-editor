import type { Extensions } from '@tiptap/core';
import { generateJSON } from '@tiptap/html';
import type { Slice } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';

/*
 * Same paste handling as `EmailEditor` from @react-email/editor (MIT), which
 * this library replaces with its own provider so the canvas can be placed
 * anywhere in the layout. Neither helper is exported by the package.
 */

const EDITOR_CLASS_PATTERN = /class="[^"]*node-/;
const FORBIDDEN_TAGS = ['script', 'iframe', 'object', 'embed', 'meta', 'base'];
const URL_ATTRIBUTES = ['href', 'src'];
/** Attributes kept on external content: functional ones only, no style or class. */
const PRESERVED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope'],
  table: ['border', 'cellpadding', 'cellspacing'],
  '*': ['id'],
};

function isSafeUrl(value: string, allowDataImage: boolean) {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:')) return false;
  if (trimmed.startsWith('data:')) return allowDataImage && trimmed.startsWith('data:image/');
  return true;
}

function sanitizeElement(el: Element) {
  const allowed = new Set([...(PRESERVED_ATTRIBUTES[el.tagName.toLowerCase()] ?? []), ...PRESERVED_ATTRIBUTES['*']]);
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-') || !allowed.has(attr.name)) el.removeAttribute(attr.name);
  }
}

function sanitizeNode(node: Node) {
  if (node.nodeType === Node.ELEMENT_NODE) sanitizeElement(node as Element);
  for (const child of Array.from(node.childNodes)) sanitizeNode(child);
}

/**
 * Drops dangerous elements and URL schemes. Content copied from the editor
 * (node-* classes) keeps its attributes; external content keeps semantic HTML only.
 */
export function sanitizePastedHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const tag of FORBIDDEN_TAGS) for (const el of Array.from(doc.body.getElementsByTagName(tag))) el.remove();
  for (const el of Array.from(doc.body.querySelectorAll('[href], [src]'))) {
    const allowDataImage = el.tagName.toLowerCase() === 'img';
    for (const attr of URL_ATTRIBUTES) {
      const value = el.getAttribute(attr);
      if (value !== null && !isSafeUrl(value, allowDataImage)) el.removeAttribute(attr);
    }
  }
  if (!EDITOR_CLASS_PATTERN.test(html)) sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

export function createPasteHandler(extensions: Extensions) {
  return (view: EditorView, event: ClipboardEvent, slice: Slice) => {
    if (slice.content.childCount === 1) return false;
    const html = event.clipboardData?.getData?.('text/html');
    if (!html) return false;
    event.preventDefault();
    const json = generateJSON(sanitizePastedHtml(html), extensions);
    const node = view.state.schema.nodeFromJSON(json);
    view.dispatch(view.state.tr.replaceSelectionWith(node, false));
    return true;
  };
}
