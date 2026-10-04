import * as Popover from '@radix-ui/react-popover';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, EditorFocusScope } from '@react-email/editor/ui';
import { useMessages } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { PipetteIcon } from './icons';

/**
 * Form controls of the properties panel. Exported so custom inspectors look
 * like the built-in ones. Text-like inputs commit on blur / Enter to avoid
 * spamming editor transactions.
 */

export interface GroupProps extends StyleProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** Collapsible section of the properties panel. */
export function Group({ title, children, defaultOpen = true, className, style }: GroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={cx('bree-group', className)} style={style}>
      <button type="button" className="bree-group-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        <span className={cx('bree-chevron', open && 'bree-open')} aria-hidden>
          ›
        </span>
      </button>
      {open && <div className="bree-group-body">{children}</div>}
    </section>
  );
}

export interface FieldProps extends StyleProps {
  label: string;
  children: ReactNode;
  /** Label above the control instead of beside it. */
  stacked?: boolean;
}

export function Field({ label, children, stacked, className, style }: FieldProps) {
  return (
    <label className={cx('bree-field', stacked && 'bree-stacked', className)} style={style}>
      <span className="bree-field-label">{label}</span>
      <span className="bree-field-control">{children}</span>
    </label>
  );
}

/** Local draft that resets whenever the external value changes. */
function useDraft<T>(value: T) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (!Object.is(value, synced)) {
    setSynced(value);
    setDraft(value);
  }
  return [draft, setDraft] as const;
}

export interface TextInputProps extends StyleProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

export function TextInput({ value, onChange, placeholder, type = 'text', className, style }: TextInputProps) {
  const [draft, setDraft] = useDraft(value);
  return (
    <input
      className={cx('bree-input', className)}
      style={style}
      type={type}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onChange(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onChange(draft);
      }}
    />
  );
}

export interface TextAreaProps extends StyleProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

export function TextArea({ value, onChange, rows = 8, className, style }: TextAreaProps) {
  const [draft, setDraft] = useDraft(value);
  return (
    <textarea
      className={cx('bree-input bree-textarea', className)}
      style={style}
      rows={rows}
      value={draft}
      spellCheck={false}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onChange(draft)}
    />
  );
}

function toNumber(value: unknown): number | '' {
  if (value === undefined || value === null || value === '' || value === 'auto') return '';
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : '';
}

export interface NumberInputProps extends StyleProps {
  value: unknown;
  onChange: (value: number | '') => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

/** Number with a unit suffix. Arrow keys step (Shift = ×10). Empty means "auto". */
export function NumberInput({ value, onChange, unit = 'px', min = 0, max, step = 1, placeholder, className, style }: NumberInputProps) {
  const t = useMessages();
  const [draft, setDraft] = useDraft<string>(String(toNumber(value)));
  const commit = (raw: string) => {
    if (raw.trim() === '') return onChange('');
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) onChange(Math.max(min, max !== undefined ? Math.min(max, n) : n));
  };
  return (
    <span className={cx('bree-number', className)} style={style}>
      <input
        className="bree-input"
        inputMode="decimal"
        value={draft}
        placeholder={placeholder ?? t.fields.auto}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(draft);
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const current = toNumber(draft) || 0;
            const next = current + (e.key === 'ArrowUp' ? step : -step) * (e.shiftKey ? 10 : 1);
            setDraft(String(next));
            commit(String(next));
          }
        }}
      />
      {unit && <span className="bree-unit">{unit}</span>}
    </span>
  );
}

export interface RangeInputProps extends StyleProps {
  value: unknown;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
}

export function RangeInput({ value, onChange, min, max, unit = 'px', className, style }: RangeInputProps) {
  const n = toNumber(value) || min;
  return (
    <span className={cx('bree-range', className)} style={style}>
      <input type="range" min={min} max={max} value={n} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="bree-range-value">
        {n}
        {unit}
      </span>
    </span>
  );
}

export const DEFAULT_SWATCHES = [
  '#111827', '#374151', '#6b7280', '#d1d5db', '#f3f4f6', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#0ea5e9', '#2563eb',
  '#4f46e5', '#7c3aed', '#db2777', '#eef2ff', '#ecfdf5', '#fef3c7',
];

/** "#abc" / "#aabbcc" / "rgb(1, 2, 3)" -> "#aabbcc" (null when not a plain color). */
export function toHex(color: string): string | null {
  const c = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(c)) return c;
  if (/^#[0-9a-f]{3}$/.test(c)) return `#${[...c.slice(1)].map((x) => x + x).join('')}`;
  const rgb = c.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (rgb) return `#${rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
  return null;
}

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

export interface ColorInputProps extends StyleProps {
  value: unknown;
  onChange: (value: string) => void;
  /** Colors already used in the document, offered first. */
  presets?: string[];
  /** Palette of the picker. */
  swatches?: string[];
  placeholder?: string;
  /** Class name of the (portaled) picker popover. */
  popoverClassName?: string;
}

/**
 * Color field: swatch + hex text, opening a react-colorful picker in a Radix
 * popover. The popover is portaled out of the sidebar, so it is wrapped in an
 * EditorFocusScope: interacting with it keeps the block selected.
 */
export function ColorInput({
  value,
  onChange,
  presets = [],
  swatches = DEFAULT_SWATCHES,
  placeholder,
  className,
  style,
  popoverClassName,
}: ColorInputProps) {
  const t = useMessages();
  const emptyLabel = placeholder ?? t.fields.colorDefault;
  const raw = typeof value === 'string' ? value : '';
  const hex = toHex(raw);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(hex ?? '#ffffff');
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const pending = useRef<string | null>(null);
  const timer = useRef(0);

  const flush = () => {
    window.clearTimeout(timer.current);
    timer.current = 0;
    if (pending.current) onChangeRef.current(pending.current);
    pending.current = null;
  };
  // Dragging in the picker fires continuously: commit at most every 60ms.
  const live = (color: string) => {
    setDraft(color);
    pending.current = color;
    if (!timer.current) timer.current = window.setTimeout(flush, 60);
  };
  const commit = (color: string) => {
    pending.current = null;
    window.clearTimeout(timer.current);
    timer.current = 0;
    setDraft(toHex(color) ?? draft);
    onChangeRef.current(color);
  };

  const EyeDropper = typeof window !== 'undefined' ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined;
  const documentColors = [...new Set(presets.map((c) => toHex(c)).filter((c): c is string => !!c))].slice(0, 9);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(hex ?? '#ffffff');
        else flush();
        setOpen(next);
      }}
    >
      <span className={cx('bree-color-field', className)} style={style}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cx('bree-color-trigger', !hex && 'bree-empty')}
            style={hex ? { background: hex } : undefined}
            aria-label={t.fields.chooseColor(raw || emptyLabel)}
          />
        </Popover.Trigger>
        <TextInput value={raw} onChange={onChange} placeholder={emptyLabel} />
      </span>
      <Popover.Portal>
        <EditorFocusScope>
          <Popover.Content
            // Portaled outside the editor root: `bree` brings the theme variables along.
            className={cx('bree bree-color-popover', popoverClassName)}
            side="left"
            align="start"
            sideOffset={10}
            collisionPadding={12}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <HexColorPicker color={draft} onChange={live} />
            <div className="bree-color-popover-row">
              <span className="bree-color-preview" style={{ background: draft }} />
              <label className="bree-hex-field">
                <span>#</span>
                <HexColorInput color={draft} onChange={commit} aria-label={t.fields.hexCode} />
              </label>
              {EyeDropper && (
                <button
                  type="button"
                  className="bree-icon-button"
                  title={t.fields.eyedropper}
                  onClick={() =>
                    new EyeDropper()
                      .open()
                      .then((result) => commit(result.sRGBHex))
                      .catch(() => {})
                  }
                >
                  <PipetteIcon />
                </button>
              )}
            </div>
            {documentColors.length > 0 && (
              <>
                <span className="bree-color-popover-title">{t.fields.documentColors}</span>
                <div className="bree-swatches">
                  {documentColors.map((swatch) => (
                    <button key={swatch} type="button" className="bree-swatch" style={{ background: swatch }} title={swatch} onClick={() => commit(swatch)} />
                  ))}
                </div>
              </>
            )}
            <span className="bree-color-popover-title">{t.fields.palette}</span>
            <div className="bree-swatches">
              {swatches.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={cx('bree-swatch', swatch === draft && 'bree-active')}
                  style={{ background: swatch }}
                  title={swatch}
                  onClick={() => commit(swatch)}
                />
              ))}
            </div>
            <button
              type="button"
              className="bree-color-reset"
              onClick={() => {
                pending.current = null;
                onChangeRef.current('');
                setOpen(false);
              }}
            >
              {t.fields.resetColor}
            </button>
          </Popover.Content>
        </EditorFocusScope>
      </Popover.Portal>
    </Popover.Root>
  );
}

export interface SelectProps extends StyleProps {
  value: string;
  onChange: (value: string) => void;
  /** [value, label] pairs. */
  options: Array<[string, string]>;
}

export function Select({ value, onChange, options, className, style }: SelectProps) {
  return (
    <select className={cx('bree-input bree-select', className)} style={style} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

export interface SegmentedProps<T extends string> extends StyleProps {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: ReactNode; title?: string }>;
  ariaLabel?: string;
}

export function Segmented<T extends string>({ value, onChange, options, ariaLabel, className, style }: SegmentedProps<T>) {
  return (
    <span className={cx('bree-segmented', className)} style={style} role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          title={option.title}
          className={cx(value === option.value && 'bree-active')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </span>
  );
}

export interface AlignInputProps extends StyleProps {
  value: string;
  onChange: (value: string) => void;
}

export function AlignInput({ value, onChange, className, style }: AlignInputProps) {
  const t = useMessages();
  return (
    <Segmented
      className={className}
      style={style}
      value={value || 'left'}
      onChange={onChange}
      options={[
        { value: 'left', label: <AlignLeftIcon size={14} />, title: t.fields.alignLeft },
        { value: 'center', label: <AlignCenterIcon size={14} />, title: t.fields.alignCenter },
        { value: 'right', label: <AlignRightIcon size={14} />, title: t.fields.alignRight },
      ]}
    />
  );
}

export type Side = 'Top' | 'Right' | 'Bottom' | 'Left';

export interface PaddingInputProps extends StyleProps {
  get: (side: Side) => unknown;
  set: (changes: Array<[side: Side, value: number | '']>) => void;
}

/** One value for the four sides, or four values with "More options". */
export function PaddingInput({ get, set, className, style }: PaddingInputProps) {
  const t = useMessages();
  const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
  const values = sides.map((side) => toNumber(get(side)));
  const uniform = values.every((v) => v === values[0]);
  const [expanded, setExpanded] = useState(!uniform);
  const labels = { Top: t.fields.top, Right: t.fields.right, Bottom: t.fields.bottom, Left: t.fields.left };
  return (
    <div className={cx('bree-padding', className)} style={style}>
      {expanded ? (
        <div className="bree-padding-grid">
          {sides.map((side, i) => (
            <label key={side} className="bree-padding-side">
              <span>{labels[side]}</span>
              <NumberInput value={values[i]} onChange={(v) => set([[side, v]])} />
            </label>
          ))}
        </div>
      ) : (
        <NumberInput value={values[0]} onChange={(v) => set(sides.map((side) => [side, v]))} />
      )}
      <label className="bree-checkbox">
        <input type="checkbox" checked={expanded} onChange={(e) => setExpanded(e.target.checked)} />
        {t.fields.moreOptions}
      </label>
    </div>
  );
}
