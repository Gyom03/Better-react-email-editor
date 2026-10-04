import type { CSSProperties } from 'react';

/** "padding-top: 4px; color: red" -> { paddingTop: '4px', color: 'red' } */
export function inlineStyleToObject(style: unknown): CSSProperties {
  if (typeof style !== 'string' || !style.trim()) return {};
  const result: Record<string, string> = {};
  for (const declaration of style.split(';')) {
    const index = declaration.indexOf(':');
    if (index === -1) continue;
    const prop = declaration.slice(0, index).trim();
    const value = declaration.slice(index + 1).trim();
    if (!prop || !value) continue;
    result[prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] =
      value;
  }
  return result as CSSProperties;
}
