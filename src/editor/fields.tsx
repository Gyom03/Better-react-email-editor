import * as Popover from '@radix-ui/react-popover';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, EditorFocusScope } from '@react-email/editor/ui';

export function Group({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="group">
      <button type="button" className="group-header" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        <span className={`chevron ${open ? 'open' : ''}`} aria-hidden>
          ›
        </span>
      </button>
      {open && <div className="group-body">{children}</div>}
    </section>
  );
}

export function Field({ label, children, stacked }: { label: string; children: ReactNode; stacked?: boolean }) {
  return (
    <label className={`field ${stacked ? 'stacked' : ''}`}>
      <span className="field-label">{label}</span>
      <span className="field-control">{children}</span>
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

/** Text input that commits on blur / Enter, so we don't spam transactions. */
export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [draft, setDraft] = useDraft(value);
  return (
    <input
      className="input"
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

export function TextArea({ value, onChange, rows = 8 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  const [draft, setDraft] = useDraft(value);
  return (
    <textarea
      className="input textarea"
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

export function NumberInput({
  value,
  onChange,
  unit = 'px',
  min = 0,
  max,
  step = 1,
  placeholder = 'auto',
}: {
  value: unknown;
  onChange: (value: number | '') => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useDraft<string>(String(toNumber(value)));
  const commit = (raw: string) => {
    if (raw.trim() === '') return onChange('');
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) onChange(Math.max(min, max !== undefined ? Math.min(max, n) : n));
  };
  return (
    <span className="number">
      <input
        className="input"
        inputMode="decimal"
        value={draft}
        placeholder={placeholder}
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
      {unit && <span className="unit">{unit}</span>}
    </span>
  );
}

export function RangeInput({
  value,
  onChange,
  min,
  max,
  unit = 'px',
}: {
  value: unknown;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  const n = toNumber(value) || min;
  return (
    <span className="range">
      <input type="range" min={min} max={max} value={n} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="range-value">
        {n}
        {unit}
      </span>
    </span>
  );
}

const SWATCHES = [
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

const PipetteIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m2 22 1-1h3l9-9" />
    <path d="M3 21v-3l9-9" />
    <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
  </svg>
);

/**
 * Color field: swatch + hex text, opening a react-colorful picker (MIT) in a
 * Radix popover. The popover is portaled out of the sidebar, so it is wrapped
 * in an EditorFocusScope: interacting with it keeps the block selected.
 */
export function ColorInput({
  value,
  onChange,
  presets = [],
  placeholder = 'Par défaut',
}: {
  value: unknown;
  onChange: (value: string) => void;
  presets?: string[];
  placeholder?: string;
}) {
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
      <span className="color-field">
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`color-trigger ${hex ? '' : 'empty'}`}
            style={hex ? { background: hex } : undefined}
            aria-label={`Choisir une couleur (${raw || placeholder})`}
          />
        </Popover.Trigger>
        <TextInput value={raw} onChange={onChange} placeholder={placeholder} />
      </span>
      <Popover.Portal>
        <EditorFocusScope>
          <Popover.Content
            className="color-popover"
            side="left"
            align="start"
            sideOffset={10}
            collisionPadding={12}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <HexColorPicker color={draft} onChange={live} />
            <div className="color-popover-row">
              <span className="color-preview" style={{ background: draft }} />
              <label className="hex-field">
                <span>#</span>
                <HexColorInput color={draft} onChange={commit} aria-label="Code hexadécimal" />
              </label>
              {EyeDropper && (
                <button
                  type="button"
                  className="icon-button"
                  title="Pipette : prendre une couleur à l’écran"
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
                <span className="color-popover-title">Couleurs du document</span>
                <div className="swatches">
                  {documentColors.map((swatch) => (
                    <button key={swatch} type="button" className="swatch" style={{ background: swatch }} title={swatch} onClick={() => commit(swatch)} />
                  ))}
                </div>
              </>
            )}
            <span className="color-popover-title">Palette</span>
            <div className="swatches">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={`swatch ${swatch === draft ? 'active' : ''}`}
                  style={{ background: swatch }}
                  title={swatch}
                  onClick={() => commit(swatch)}
                />
              ))}
            </div>
            <button
              type="button"
              className="color-reset"
              onClick={() => {
                pending.current = null;
                onChangeRef.current('');
                setOpen(false);
              }}
            >
              Revenir à la valeur par défaut
            </button>
          </Popover.Content>
        </EditorFocusScope>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select className="input select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: ReactNode; title?: string }>;
}) {
  return (
    <span className="segmented" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          title={option.title}
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </span>
  );
}

export function AlignInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Segmented
      value={value || 'left'}
      onChange={onChange}
      options={[
        { value: 'left', label: <AlignLeftIcon size={14} />, title: 'Gauche' },
        { value: 'center', label: <AlignCenterIcon size={14} />, title: 'Centre' },
        { value: 'right', label: <AlignRightIcon size={14} />, title: 'Droite' },
      ]}
    />
  );
}

/** Unlayer-style padding control: one value, or four with "Plus d'options". */
export function PaddingInput({
  get,
  set,
}: {
  get: (side: 'Top' | 'Right' | 'Bottom' | 'Left') => unknown;
  set: (changes: Array<[side: 'Top' | 'Right' | 'Bottom' | 'Left', value: number | '']>) => void;
}) {
  const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
  const values = sides.map((side) => toNumber(get(side)));
  const uniform = values.every((v) => v === values[0]);
  const [expanded, setExpanded] = useState(!uniform);
  const labels = { Top: 'Haut', Right: 'Droite', Bottom: 'Bas', Left: 'Gauche' };
  return (
    <div className="padding">
      {expanded ? (
        <div className="padding-grid">
          {sides.map((side, i) => (
            <label key={side} className="padding-side">
              <span>{labels[side]}</span>
              <NumberInput value={values[i]} onChange={(v) => set([[side, v]])} />
            </label>
          ))}
        </div>
      ) : (
        <NumberInput value={values[0]} onChange={(v) => set(sides.map((side) => [side, v]))} />
      )}
      <label className="checkbox">
        <input type="checkbox" checked={expanded} onChange={(e) => setExpanded(e.target.checked)} />
        Plus d’options
      </label>
    </div>
  );
}
