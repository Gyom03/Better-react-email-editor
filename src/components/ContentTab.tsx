import { useEmailEditor, useI18n } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { resolveLabel } from '../i18n';
import type { PaletteGroup, PaletteItem } from '../registry/types';
import { useDraggableBlock } from './useDraggableBlock';

export interface PaletteTileProps extends StyleProps {
  item: PaletteItem;
}

/** One draggable tile of the palette. */
export function PaletteTile({ item, className, style }: PaletteTileProps) {
  const i18n = useI18n();
  const label = resolveLabel(item.label, i18n);
  const drag = useDraggableBlock(label, () => item.content(i18n));
  return (
    <button type="button" className={cx('bree-tile', className)} style={style} title={i18n.t.sidebar.tileTitle(label)} {...drag}>
      <span className="bree-tile-icon">{item.icon}</span>
      <span className="bree-tile-label">{label}</span>
    </button>
  );
}

export interface ContentTabProps extends StyleProps {
  /** Defaults to the editor's `palette`. */
  items?: PaletteItem[];
  /** Defaults to the editor's `paletteGroups`; groups found only in items are added at the end. */
  groups?: PaletteGroup[];
  /** Hint under the tiles. `null` hides it. */
  hint?: string | null;
}

/** "Content" tab: layout and content tiles, grouped. */
export function ContentTab({ items, groups, hint, className, style }: ContentTabProps) {
  const ctx = useEmailEditor();
  const palette = items ?? ctx.palette;
  const known = groups ?? ctx.paletteGroups;
  const allGroups = [
    ...known,
    ...[...new Set(palette.map((item) => item.group))].filter((id) => !known.some((g) => g.id === id)).map((id) => ({ id, title: id })),
  ];
  return (
    <div className={cx('bree-content-tab', className)} style={style}>
      {allGroups.map((group) => {
        const groupItems = palette.filter((item) => item.group === group.id);
        if (!groupItems.length) return null;
        return (
          <section key={group.id}>
            <h3 className="bree-panel-title">{resolveLabel(group.title, ctx)}</h3>
            <div className="bree-tiles">
              {groupItems.map((item) => (
                <PaletteTile key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
      {hint !== null && <p className="bree-hint">{hint ?? ctx.t.sidebar.dragHint}</p>}
    </div>
  );
}
