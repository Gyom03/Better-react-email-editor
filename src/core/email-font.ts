import type { Editor } from '@tiptap/core';
import { getEmailTheming, setGlobalStyles, type PanelGroup } from '@react-email/editor/plugins';

// The theme's panels have no font input, but any input is turned into CSS:
// the email font is stored as extra inputs of the "body" panel. Quotes get the
// same font, as the theme gives them their own.
const FONT_TARGETS = ['body', 'blockquote'];

/** Font chosen for the whole email, or '' when it uses the theme's (system) font. */
export function getEmailFont(editor: Editor): string {
  const { styles } = getEmailTheming(editor);
  const input = styles.flatMap((group) => group.inputs).find((i) => (i.prop as string) === 'fontFamily' && i.classReference === 'body');
  return String(input?.value ?? '');
}

/** Sets the default font of the email. '' goes back to the theme's font. */
export function setEmailFont(editor: Editor, value: string) {
  const { styles } = getEmailTheming(editor);
  const isFont = (input: PanelGroup['inputs'][number]) => (input.prop as string) === 'fontFamily' && FONT_TARGETS.includes(input.classReference ?? '');
  const bodyIndex = Math.max(0, styles.findIndex((group) => group.id === 'body'));
  const next = styles.map((group, index) => {
    const inputs = group.inputs.filter((input) => !isFont(input));
    if (index !== bodyIndex || !value) return { ...group, inputs };
    const fonts = FONT_TARGETS.map((classReference) => ({ label: 'Font', type: 'text' as const, prop: 'fontFamily', classReference, value }));
    return { ...group, inputs: [...inputs, ...fonts] };
  });
  setGlobalStyles(editor, next as PanelGroup[]);
}
