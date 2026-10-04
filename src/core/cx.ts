import type { CSSProperties } from 'react';

/** Joins class names, skipping falsy values. */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/** Props accepted by every visual component of the library. */
export interface StyleProps {
  className?: string;
  style?: CSSProperties;
}
