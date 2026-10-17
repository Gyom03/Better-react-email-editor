/** A font offered in the font pickers. `value` is a full CSS `font-family` stack. */
export interface FontOption {
  label: string;
  value: string;
  /** Stylesheet of a web font (e.g. Google Fonts). Loaded in the editor, and linked in the exported email when the font is used. */
  href?: string;
}

/**
 * Fonts installed on virtually every device and supported by every email
 * client, each with fallbacks, plus Inter as a web font: only some clients
 * (Apple Mail, iOS) load it, the others show Arial. Single quotes only: the
 * stack ends up in a `style` attribute.
 */
export const defaultFonts: FontOption[] = [
  { label: 'Inter', value: 'Inter, Arial, Helvetica, sans-serif', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap' },
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

/** Web fonts of `fonts` used by a rendered email (looked up in its `font-family` declarations). */
export function usedWebFonts(html: string, fonts: FontOption[]): FontOption[] {
  const families = new Set<string>();
  for (const match of html.matchAll(/font-family:\s*([^;"]+)/gi)) {
    families.add(primaryFamily(match[1].replace(/&#x27;|&quot;/g, "'")));
  }
  return fonts.filter((font) => font.href && families.has(primaryFamily(font.value)));
}

/** Adds `<link rel="stylesheet">` tags for the web fonts an email uses, so the clients that support them load them. */
export function linkWebFonts(html: string, fonts: FontOption[]): string {
  const links = usedWebFonts(html, fonts)
    .map((font) => `<link href="${font.href!.replace(/&/g, '&amp;')}" rel="stylesheet" />`)
    .join('');
  return links ? html.replace('</head>', `${links}</head>`) : html;
}
