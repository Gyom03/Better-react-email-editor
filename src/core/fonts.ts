/** A font offered in the font pickers. `value` is a full CSS `font-family` stack. */
export interface FontOption {
  label: string;
  value: string;
}

/**
 * Fonts installed on virtually every device and supported by every email
 * client, each with fallbacks. Single quotes only: the stack ends up in a
 * `style` attribute.
 */
export const defaultFonts: FontOption[] = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Verdana, Segoe, sans-serif' },
  { label: 'Georgia', value: "Georgia, 'Times New Roman', Times, serif" },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
];

/** First family of a stack, unquoted and lowercased: `"'Times New Roman', serif"` -> `times new roman`. */
function primaryFamily(stack: string) {
  return stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase();
}

/** The option whose first family matches `value` (quotes and fallbacks may differ). */
export function findFont(fonts: FontOption[], value: string | undefined): FontOption | undefined {
  if (!value) return undefined;
  const family = primaryFamily(value);
  return fonts.find((font) => primaryFamily(font.value) === family);
}
