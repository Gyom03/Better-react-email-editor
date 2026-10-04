import { useCurrentEditor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import {
  BoldIcon,
  Inspector,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
  XIcon,
  type InspectorNodeContext,
  type InspectorTextContext,
} from '@react-email/editor/ui';
import type { KnownCssProperties } from '@react-email/editor/plugins';
import { useState, type DragEvent } from 'react';
import { CONTENT_ITEMS, LAYOUT_ITEMS, PREBUILT_BLOCKS, type PaletteItem, type PrebuiltBlock } from './blocks';
import { SOCIAL_NETWORKS, type SocialLink } from './custom-nodes';
import { appendBlocks, DND_MIME, dragSession } from './dnd';
import {
  AlignInput,
  ColorInput,
  Field,
  Group,
  NumberInput,
  PaddingInput,
  RangeInput,
  Segmented,
  Select,
  TextArea,
  TextInput,
} from './fields';
import { nodeLabel } from './node-labels';
import { useEmailSettings } from './settings';

// ---------------------------------------------------------------------------
// Palette (shown when nothing is selected, like Unlayer)
// ---------------------------------------------------------------------------

function startDrag(e: DragEvent, label: string, content: PaletteItem['content']) {
  dragSession.start({ kind: 'new', label, content });
  e.dataTransfer.setData(DND_MIME, label);
  e.dataTransfer.effectAllowed = 'copy';
}

function Tile({ item }: { item: PaletteItem }) {
  const { editor } = useCurrentEditor();
  return (
    <button
      type="button"
      className="tile"
      draggable
      onDragStart={(e) => startDrag(e, item.label, item.content)}
      onDragEnd={() => dragSession.end()}
      onClick={() => editor && appendBlocks(editor, item.content())}
      title={`Glissez « ${item.label} » dans l’email (ou cliquez pour l’ajouter à la fin)`}
    >
      <span className="tile-icon">{item.icon}</span>
      <span className="tile-label">{item.label}</span>
    </button>
  );
}

function BlockCard({ block }: { block: PrebuiltBlock }) {
  const { editor } = useCurrentEditor();
  return (
    <button
      type="button"
      className="block-card"
      draggable
      onDragStart={(e) => startDrag(e, block.label, block.content)}
      onDragEnd={() => dragSession.end()}
      onClick={() => editor && appendBlocks(editor, block.content())}
    >
      <span className={`block-thumb thumb-${block.id}`} aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="block-text">
        <strong>{block.label}</strong>
        <span>{block.description}</span>
      </span>
    </button>
  );
}

type DocumentContext = Parameters<NonNullable<Parameters<typeof Inspector.Document>[0]['children']>>[0];

function BodyPanel({ ctx }: { ctx: DocumentContext }) {
  const { settings, update } = useEmailSettings();
  const { findStyleValue, setGlobalStyle } = ctx;
  return (
    <>
      <Group title="Général">
        <Field label="Texte d’aperçu" stacked>
          <TextInput
            value={settings.previewText}
            onChange={(previewText) => update({ previewText })}
            placeholder="Affiché après l’objet dans la boîte de réception"
          />
        </Field>
      </Group>
      <Group title="Arrière-plan">
        <Field label="Couleur de fond" stacked>
          <ColorInput value={findStyleValue('body', 'backgroundColor')} onChange={(v) => setGlobalStyle('body', 'backgroundColor', v)} />
        </Field>
        <Field label="Marge extérieure">
          <NumberInput value={findStyleValue('body', 'padding')} onChange={(v) => setGlobalStyle('body', 'padding', v)} />
        </Field>
      </Group>
      <Group title="Contenu">
        <Field label="Largeur">
          <NumberInput value={findStyleValue('container', 'width')} onChange={(v) => setGlobalStyle('container', 'width', v)} min={320} max={900} />
        </Field>
        <Field label="Couleur du contenu" stacked>
          <ColorInput
            value={findStyleValue('container', 'backgroundColor')}
            onChange={(v) => setGlobalStyle('container', 'backgroundColor', v)}
          />
        </Field>
        <Field label="Marge intérieure">
          <NumberInput value={findStyleValue('container', 'padding')} onChange={(v) => setGlobalStyle('container', 'padding', v)} />
        </Field>
        <Field label="Arrondi">
          <NumberInput value={findStyleValue('container', 'borderRadius')} onChange={(v) => setGlobalStyle('container', 'borderRadius', v)} />
        </Field>
      </Group>
      <Group title="Styles par défaut">
        <Field label="Texte" stacked>
          <ColorInput value={findStyleValue('paragraph', 'color')} onChange={(v) => setGlobalStyle('paragraph', 'color', v)} />
        </Field>
        <Field label="Titres" stacked>
          <ColorInput
            value={findStyleValue('h1', 'color')}
            onChange={(v) => {
              ctx.batchSetGlobalStyle(
                (['h1', 'h2', 'h3'] as const).map((classReference) => ({ classReference, property: 'color', value: v })),
              );
            }}
          />
        </Field>
        <Field label="Liens" stacked>
          <ColorInput value={findStyleValue('link', 'color')} onChange={(v) => setGlobalStyle('link', 'color', v)} />
        </Field>
        <Field label="Fond des boutons" stacked>
          <ColorInput value={findStyleValue('button', 'backgroundColor')} onChange={(v) => setGlobalStyle('button', 'backgroundColor', v)} />
        </Field>
        <Field label="Texte des boutons" stacked>
          <ColorInput value={findStyleValue('button', 'color')} onChange={(v) => setGlobalStyle('button', 'color', v)} />
        </Field>
      </Group>
    </>
  );
}

type Tab = 'content' | 'blocks' | 'body';

function PalettePanel({ ctx }: { ctx: DocumentContext }) {
  const [tab, setTab] = useState<Tab>('content');
  return (
    <div className="palette">
      <nav className="tabs" role="tablist">
        {(
          [
            ['content', 'Contenu'],
            ['blocks', 'Blocs'],
            ['body', 'Corps'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="panel-scroll">
        {tab === 'content' && (
          <>
            <h3 className="panel-title">Mise en page</h3>
            <div className="tiles">
              {LAYOUT_ITEMS.map((item) => (
                <Tile key={item.id} item={item} />
              ))}
            </div>
            <h3 className="panel-title">Contenus</h3>
            <div className="tiles">
              {CONTENT_ITEMS.map((item) => (
                <Tile key={item.id} item={item} />
              ))}
            </div>
            <p className="hint">Glissez un élément dans l’email. Un clic l’ajoute à la fin.</p>
          </>
        )}
        {tab === 'blocks' && (
          <div className="block-list">
            {PREBUILT_BLOCKS.map((block) => (
              <BlockCard key={block.id} block={block} />
            ))}
          </div>
        )}
        {tab === 'body' && <BodyPanel ctx={ctx} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Properties (shown when a block is selected)
// ---------------------------------------------------------------------------

function deselect() {
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
}

function PropertiesShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { editor } = useCurrentEditor();
  return (
    <div className="properties">
      <header className="properties-header">
        <div>
          <span className="eyebrow">Propriétés</span>
          <h2>{title}</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          title="Fermer (retour aux contenus)"
          onClick={() => {
            deselect();
            editor?.commands.blur();
          }}
        >
          <XIcon size={16} />
        </button>
      </header>
      <Inspector.Breadcrumb>
        {(segments) =>
          segments.length > 1 && (
            <nav className="breadcrumb" aria-label="Hiérarchie">
              {segments.map((segment, i) => (
                <span key={`${segment.node.nodeType}-${segment.node.nodePos.pos}`} className="crumb">
                  {i > 0 && <span className="crumb-sep">/</span>}
                  <button type="button" disabled={i === segments.length - 1} onClick={segment.focus}>
                    {nodeLabel(segment.node.nodeType)}
                  </button>
                </span>
              ))}
            </nav>
          )
        }
      </Inspector.Breadcrumb>
      <div className="panel-scroll">{children}</div>
    </div>
  );
}

type StyleCtx = Pick<InspectorNodeContext, 'getStyle' | 'setStyle' | 'presetColors'>;

const css = (prop: string) => prop as KnownCssProperties;

function TypographyGroup({ ctx, alignment, setAlignment }: { ctx: StyleCtx; alignment?: string; setAlignment?: (v: string) => void }) {
  return (
    <Group title="Typographie">
      <Field label="Couleur" stacked>
        <ColorInput value={ctx.getStyle(css('color'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('color'), v)} />
      </Field>
      <Field label="Taille">
        <NumberInput value={ctx.getStyle(css('fontSize'))} onChange={(v) => ctx.setStyle(css('fontSize'), v)} min={8} max={96} />
      </Field>
      <Field label="Graisse">
        <Select
          value={String(ctx.getStyle(css('fontWeight')) ?? '400')}
          onChange={(v) => ctx.setStyle(css('fontWeight'), v)}
          options={[
            ['300', 'Fin'],
            ['400', 'Normal'],
            ['600', 'Semi-gras'],
            ['700', 'Gras'],
            ['800', 'Extra-gras'],
          ]}
        />
      </Field>
      <Field label="Interligne">
        <NumberInput value={ctx.getStyle(css('lineHeight'))} unit="%" onChange={(v) => ctx.setStyle(css('lineHeight'), v)} min={80} max={300} step={5} />
      </Field>
      {setAlignment && (
        <Field label="Alignement">
          <AlignInput value={alignment ?? 'left'} onChange={setAlignment} />
        </Field>
      )}
    </Group>
  );
}

function SpacingGroup({ ctx, title = 'Espacement' }: { ctx: InspectorNodeContext; title?: string }) {
  return (
    <Group title={title}>
      <Field label="Marge intérieure" stacked>
        <PaddingInput
          get={(side) => ctx.getStyle(css(`padding${side}`)) ?? ctx.getStyle(css('padding'))}
          set={(changes) =>
            ctx.batchSetStyle([
              // Drop any shorthand so the four longhands are the single source of truth.
              { prop: css('padding'), value: '' },
              ...changes.map(([side, value]) => ({ prop: css(`padding${side}`), value })),
            ])
          }
        />
      </Field>
    </Group>
  );
}

function BoxGroup({ ctx }: { ctx: InspectorNodeContext }) {
  return (
    <Group title="Fond et bordure">
      <Field label="Couleur de fond" stacked>
        <ColorInput value={ctx.getStyle(css('backgroundColor'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('backgroundColor'), v)} />
      </Field>
      <Field label="Arrondi">
        <NumberInput value={ctx.getStyle(css('borderRadius'))} onChange={(v) => ctx.setStyle(css('borderRadius'), v)} />
      </Field>
      <Field label="Bordure">
        <NumberInput
          value={ctx.getStyle(css('borderWidth'))}
          onChange={(v) =>
            ctx.batchSetStyle([
              { prop: css('borderWidth'), value: v },
              { prop: css('borderStyle'), value: v ? 'solid' : '' },
            ])
          }
        />
      </Field>
      <Field label="Couleur de bordure" stacked>
        <ColorInput value={ctx.getStyle(css('borderColor'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('borderColor'), v)} />
      </Field>
    </Group>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImagePanel({ ctx }: { ctx: InspectorNodeContext }) {
  const width = String(ctx.getAttr('width') ?? 'auto');
  return (
    <>
      <Group title="Image">
        <div className="image-preview">
          {ctx.getAttr('src') ? <img src={String(ctx.getAttr('src'))} alt="" /> : null}
        </div>
        <label className="button-like">
          Importer une image…
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) ctx.setAttr('src', await readFileAsDataUrl(file));
            }}
          />
        </label>
        <Field label="URL de l’image" stacked>
          <TextInput value={String(ctx.getAttr('src') ?? '')} onChange={(v) => ctx.setAttr('src', v)} />
        </Field>
        <Field label="Texte alternatif" stacked>
          <TextInput value={String(ctx.getAttr('alt') ?? '')} onChange={(v) => ctx.setAttr('alt', v)} placeholder="Décrivez l’image" />
        </Field>
      </Group>
      <Group title="Disposition">
        <Field label="Largeur auto">
          <input
            type="checkbox"
            checked={width === 'auto'}
            onChange={(e) => ctx.setAttr('width', e.target.checked ? 'auto' : '300')}
          />
        </Field>
        {width !== 'auto' && (
          <Field label="Largeur">
            <RangeInput value={width} min={20} max={900} onChange={(v) => ctx.setAttr('width', String(v))} />
          </Field>
        )}
        <Field label="Alignement">
          <AlignInput value={String(ctx.getAttr('alignment') ?? 'center')} onChange={(v) => ctx.setAttr('alignment', v)} />
        </Field>
        <Field label="Arrondi">
          <NumberInput value={ctx.getStyle(css('borderRadius'))} onChange={(v) => ctx.setStyle(css('borderRadius'), v)} />
        </Field>
      </Group>
      <Group title="Action">
        <Field label="Lien au clic" stacked>
          <TextInput value={String(ctx.getAttr('href') ?? '')} onChange={(v) => ctx.setAttr('href', v || null)} placeholder="https://" />
        </Field>
      </Group>
      <SpacingGroup ctx={ctx} />
    </>
  );
}

function ButtonPanel({ ctx }: { ctx: InspectorNodeContext }) {
  return (
    <>
      <Group title="Action">
        <Field label="URL du lien" stacked>
          <TextInput value={String(ctx.getAttr('href') ?? '')} onChange={(v) => ctx.setAttr('href', v)} placeholder="https://" />
        </Field>
      </Group>
      <Group title="Bouton">
        <Field label="Alignement">
          <AlignInput value={String(ctx.getAttr('alignment') ?? 'left')} onChange={(v) => ctx.setAttr('alignment', v)} />
        </Field>
        <Field label="Couleur de fond" stacked>
          <ColorInput value={ctx.getStyle(css('backgroundColor'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('backgroundColor'), v)} />
        </Field>
        <Field label="Couleur du texte" stacked>
          <ColorInput value={ctx.getStyle(css('color'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('color'), v)} />
        </Field>
        <Field label="Taille du texte">
          <NumberInput value={ctx.getStyle(css('fontSize'))} onChange={(v) => ctx.setStyle(css('fontSize'), v)} min={8} max={48} />
        </Field>
        <Field label="Arrondi">
          <NumberInput value={ctx.getStyle(css('borderRadius'))} onChange={(v) => ctx.setStyle(css('borderRadius'), v)} />
        </Field>
      </Group>
      <SpacingGroup ctx={ctx} title="Marges du bouton" />
    </>
  );
}

function SocialPanel({ ctx }: { ctx: InspectorNodeContext }) {
  const raw = ctx.getAttr('links');
  const links: SocialLink[] = Array.isArray(raw) ? (raw as SocialLink[]) : [];
  const save = (next: SocialLink[]) => ctx.setAttr('links', next);
  return (
    <>
      <Group title="Réseaux">
        <div className="social-list">
          {links.map((link, i) => (
            <div key={i} className="social-row">
              <Select
                value={link.network}
                onChange={(network) => save(links.map((l, j) => (j === i ? { ...l, network } : l)))}
                options={Object.entries(SOCIAL_NETWORKS).map(([id, meta]) => [id, meta.label])}
              />
              <TextInput value={link.url} onChange={(url) => save(links.map((l, j) => (j === i ? { ...l, url } : l)))} />
              <button type="button" className="icon-button" title="Retirer" onClick={() => save(links.filter((_, j) => j !== i))}>
                <XIcon size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="button-like" onClick={() => save([...links, { network: 'youtube', url: 'https://youtube.com/' }])}>
          + Ajouter un réseau
        </button>
      </Group>
      <Group title="Apparence">
        <Field label="Taille des icônes">
          <RangeInput value={ctx.getAttr('size')} min={16} max={64} onChange={(v) => ctx.setAttr('size', v)} />
        </Field>
        <Field label="Espacement">
          <RangeInput value={ctx.getAttr('gap')} min={0} max={40} onChange={(v) => ctx.setAttr('gap', v)} />
        </Field>
        <Field label="Alignement">
          <AlignInput value={String(ctx.getAttr('alignment') ?? 'center')} onChange={(v) => ctx.setAttr('alignment', v)} />
        </Field>
      </Group>
      <SpacingGroup ctx={ctx} />
    </>
  );
}

function ColumnsPanel({ ctx }: { ctx: InspectorNodeContext }) {
  const { editor } = useCurrentEditor();
  const count = { twoColumns: 2, threeColumns: 3, fourColumns: 4 }[ctx.nodeType] ?? 2;
  const presets: Array<[string, number[]]> =
    count === 2
      ? [
          ['50 / 50', [50, 50]],
          ['33 / 67', [33, 67]],
          ['67 / 33', [67, 33]],
          ['25 / 75', [25, 75]],
        ]
      : count === 3
        ? [
            ['Égales', [33.33, 33.33, 33.34]],
            ['25 / 50 / 25', [25, 50, 25]],
          ]
        : [['Égales', [25, 25, 25, 25]]];

  const applyWidths = (widths: number[]) => {
    if (!editor) return;
    const { state } = editor;
    const row = state.doc.nodeAt(ctx.nodePos.pos);
    if (!row) return;
    const tr = state.tr;
    row.forEach((col, offset, i) => {
      const pos = ctx.nodePos.pos + 1 + offset;
      const style = String(col.attrs.style ?? '')
        .split(';')
        .filter((d) => d.trim() && !d.trim().startsWith('width'))
        .join(';');
      tr.setNodeMarkup(pos, undefined, { ...col.attrs, style: `${style ? `${style};` : ''}width:${widths[i]}%` });
    });
    if (state.selection instanceof NodeSelection) tr.setSelection(NodeSelection.create(tr.doc, ctx.nodePos.pos));
    editor.view.dispatch(tr);
  };

  return (
    <>
      <Group title="Colonnes">
        <Field label="Répartition" stacked>
          <div className="ratio-grid">
            {presets.map(([label, widths]) => (
              <button key={label} type="button" className="ratio" onClick={() => applyWidths(widths)}>
                <span className="ratio-bars">
                  {widths.map((w, i) => (
                    <i key={i} style={{ flex: w }} />
                  ))}
                </span>
                {label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Espace entre colonnes">
          <NumberInput value={ctx.getAttr('cellspacing') ?? 0} onChange={(v) => ctx.setAttr('cellspacing', v === '' ? null : v)} />
        </Field>
        <p className="hint">Cliquez dans une colonne pour régler son fond et ses marges.</p>
      </Group>
    </>
  );
}

function NodePanel({ ctx }: { ctx: InspectorNodeContext }) {
  const alignment = String(ctx.getAttr('alignment') ?? 'left');
  const setAlignment = (v: string) => ctx.setAttr('alignment', v);

  switch (ctx.nodeType) {
    case 'image':
      return <ImagePanel ctx={ctx} />;
    case 'button':
      return <ButtonPanel ctx={ctx} />;
    case 'socialLinks':
      return <SocialPanel ctx={ctx} />;
    case 'spacer':
      return (
        <Group title="Espacement">
          <Field label="Hauteur">
            <RangeInput value={ctx.getAttr('height')} min={4} max={160} onChange={(v) => ctx.setAttr('height', v)} />
          </Field>
        </Group>
      );
    case 'htmlBlock':
      return (
        <Group title="Code HTML">
          <TextArea value={String(ctx.getAttr('html') ?? '')} onChange={(v) => ctx.setAttr('html', v)} rows={14} />
          <p className="hint">Le HTML est inséré tel quel dans l’email exporté.</p>
        </Group>
      );
    case 'horizontalRule':
      return (
        <Group title="Ligne">
          <Field label="Couleur" stacked>
            <ColorInput value={ctx.getStyle(css('borderTopColor'))} presets={ctx.presetColors} onChange={(v) => ctx.setStyle(css('borderTopColor'), v)} />
          </Field>
          <Field label="Épaisseur">
            <NumberInput
              value={ctx.getStyle(css('borderTopWidth')) ?? 1}
              onChange={(v) =>
                ctx.batchSetStyle([
                  { prop: css('borderTopWidth'), value: v },
                  { prop: css('borderTopStyle'), value: 'solid' },
                ])
              }
              min={1}
              max={12}
            />
          </Field>
          <Field label="Style">
            <Segmented
              value={String(ctx.getStyle(css('borderTopStyle')) ?? 'solid')}
              onChange={(v) => ctx.setStyle(css('borderTopStyle'), v)}
              options={[
                { value: 'solid', label: '———' },
                { value: 'dashed', label: '- - -' },
                { value: 'dotted', label: '· · ·' },
              ]}
            />
          </Field>
        </Group>
      );
    case 'twoColumns':
    case 'threeColumns':
    case 'fourColumns':
      return <ColumnsPanel ctx={ctx} />;
    case 'section':
    case 'columnsColumn':
      return (
        <>
          <BoxGroup ctx={ctx} />
          <SpacingGroup ctx={ctx} />
        </>
      );
    case 'heading':
      return (
        <>
          <Group title="Titre">
            <Field label="Niveau">
              <Segmented
                value={String(ctx.getAttr('level') ?? 1)}
                onChange={(v) => ctx.setAttr('level', Number(v))}
                options={[
                  { value: '1', label: 'H1' },
                  { value: '2', label: 'H2' },
                  { value: '3', label: 'H3' },
                ]}
              />
            </Field>
          </Group>
          <TypographyGroup ctx={ctx} alignment={alignment} setAlignment={setAlignment} />
          <SpacingGroup ctx={ctx} />
          <BoxGroup ctx={ctx} />
        </>
      );
    default:
      return (
        <>
          <TypographyGroup ctx={ctx} alignment={alignment} setAlignment={setAlignment} />
          <SpacingGroup ctx={ctx} />
          <BoxGroup ctx={ctx} />
        </>
      );
  }
}

function TextPanel({ ctx }: { ctx: InspectorTextContext }) {
  const marks = [
    { mark: 'bold', Icon: BoldIcon, title: 'Gras' },
    { mark: 'italic', Icon: ItalicIcon, title: 'Italique' },
    { mark: 'underline', Icon: UnderlineIcon, title: 'Souligné' },
    { mark: 'strike', Icon: StrikethroughIcon, title: 'Barré' },
  ];
  return (
    <>
      <Group title="Mise en forme">
        <div className="mark-row">
          {marks.map(({ mark, Icon, title }) => (
            <button
              key={mark}
              type="button"
              title={title}
              aria-pressed={!!ctx.marks[mark]}
              className={`mark ${ctx.marks[mark] ? 'active' : ''}`}
              onClick={() => ctx.toggleMark(mark)}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </Group>
      <TypographyGroup ctx={ctx} alignment={ctx.alignment} setAlignment={ctx.setAlignment} />
      {ctx.isLinkActive && (
        <Group title="Lien">
          <Field label="URL" stacked>
            <span className="readonly">{ctx.linkHref}</span>
          </Field>
          <Field label="Couleur du lien" stacked>
            <ColorInput value={ctx.linkColor} presets={ctx.presetColors} onChange={ctx.setLinkColor} />
          </Field>
        </Group>
      )}
    </>
  );
}

export function Sidebar() {
  return (
    <Inspector.Root className="sidebar" aria-label="Panneau latéral">
      <Inspector.Document>{(ctx) => <PalettePanel ctx={ctx} />}</Inspector.Document>
      <Inspector.Node>
        {(ctx) => (
          <PropertiesShell title={nodeLabel(ctx.nodeType)}>
            <NodePanel key={`${ctx.nodeType}-${ctx.nodePos.pos}`} ctx={ctx} />
          </PropertiesShell>
        )}
      </Inspector.Node>
      <Inspector.Text>
        {(ctx) => (
          <PropertiesShell title="Texte sélectionné">
            <TextPanel ctx={ctx} />
          </PropertiesShell>
        )}
      </Inspector.Text>
    </Inspector.Root>
  );
}
