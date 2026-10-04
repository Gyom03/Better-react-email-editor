import { en, type Messages } from './en';
import { fr } from './fr';

export { en, fr, type Messages };

/** Built-in locales. Pass your own `messages` to support any other language. */
export const locales = { en, fr } as const;

export type BuiltInLocale = keyof typeof locales;

export interface I18n {
  locale: string;
  t: Messages;
}

/**
 * A user-facing string: plain text, or a function of the current locale.
 * Lets custom palette items and templates follow the editor's language.
 */
export type Label = string | ((i18n: I18n) => string);

export function resolveLabel(label: Label, i18n: I18n): string {
  return typeof label === 'function' ? label(i18n) : label;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends readonly unknown[]
      ? T[K]
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K];
};

export type PartialMessages = DeepPartial<Messages>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function merge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(patch) || !isPlainObject(base)) return (patch ?? base) as T;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    result[key] = isPlainObject(value) && isPlainObject(result[key]) ? merge(result[key], value) : value;
  }
  return result as T;
}

/** Built-in locale (falls back to English) with optional overrides on top. */
export function resolveMessages(locale: string, overrides?: PartialMessages): Messages {
  const base = (locales as Record<string, Messages>)[locale] ?? en;
  return overrides ? merge(base, overrides) : base;
}
