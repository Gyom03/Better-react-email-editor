import type { JSONContent } from '@tiptap/core';
import {
  Columns2Icon,
  Columns3Icon,
  Columns4Icon,
  Heading1Icon,
  ImageIcon,
  LayoutIcon,
  ListIcon,
  MinusIcon,
  MousePointerClickIcon,
  PanelTopIcon,
  SquareCodeIcon,
  TextQuoteIcon,
  TypeIcon,
} from '@react-email/editor/ui';
import type { ReactNode } from 'react';

export interface PaletteItem {
  id: string;
  label: string;
  icon: ReactNode;
  content: () => JSONContent[];
}

export interface PrebuiltBlock {
  id: string;
  label: string;
  description: string;
  content: () => JSONContent[];
}

// ---------------------------------------------------------------------------
// Small JSON helpers
// ---------------------------------------------------------------------------

const text = (value: string, marks?: JSONContent['marks']): JSONContent => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});

export const p = (
  value: string | JSONContent[] = '',
  attrs: Record<string, unknown> = {},
): JSONContent => ({
  type: 'paragraph',
  attrs,
  content: typeof value === 'string' ? (value ? [text(value)] : []) : value,
});

const h = (level: 1 | 2 | 3, value: string, attrs: Record<string, unknown> = {}): JSONContent => ({
  type: 'heading',
  attrs: { level, ...attrs },
  content: [text(value)],
});

const button = (label: string, attrs: Record<string, unknown> = {}): JSONContent => ({
  type: 'button',
  attrs: { href: 'https://example.com', alignment: 'center', ...attrs },
  content: [text(label)],
});

const image = (src: string, attrs: Record<string, unknown> = {}): JSONContent => ({
  type: 'image',
  attrs: { src, alt: '', alignment: 'center', ...attrs },
});

const column = (...content: JSONContent[]): JSONContent => ({
  type: 'columnsColumn',
  content: content.length ? content : [p()],
});

const sized = (col: JSONContent, width: number): JSONContent => ({ ...col, attrs: { ...col.attrs, style: `width:${width}%` } });

const columns = (count: 2 | 3 | 4, cols?: JSONContent[], attrs?: Record<string, unknown>): JSONContent => ({
  type: ({ 2: 'twoColumns', 3: 'threeColumns', 4: 'fourColumns' } as const)[count],
  ...(attrs ? { attrs } : {}),
  content: cols ?? Array.from({ length: count }, () => column()),
});

const section = (style: string, ...content: JSONContent[]): JSONContent => ({
  type: 'section',
  attrs: { style },
  content,
});

/** Longhand paddings keep the inspector's per-side controls accurate. */
const pad = (y: number, x = y) =>
  `padding-top:${y}px;padding-right:${x}px;padding-bottom:${y}px;padding-left:${x}px`;

const link = (href: string) => [{ type: 'link', attrs: { href } }];

const menu = (alignment = 'center'): JSONContent =>
  p(
    [
      text('Accueil', link('https://example.com')),
      text('  ·  '),
      text('Boutique', link('https://example.com/shop')),
      text('  ·  '),
      text('Blog', link('https://example.com/blog')),
      text('  ·  '),
      text('Contact', link('https://example.com/contact')),
    ],
    { alignment },
  );

export const placeholderImage = (w: number, h: number, label = 'Image') =>
  `https://placehold.co/${w}x${h}/e2e8f0/64748b/png?text=${encodeURIComponent(label)}`;

// ---------------------------------------------------------------------------
// Content tiles (Unlayer's "Content" tab)
// ---------------------------------------------------------------------------

const SpacerIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 4h16M4 20h16M12 7v10M9 9.5 12 7l3 2.5M9 14.5l3 2.5 3-2.5" />
  </svg>
);

const SocialIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
  </svg>
);

const OneColumnIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

export const LAYOUT_ITEMS: PaletteItem[] = [
  {
    id: 'section',
    label: '1 colonne',
    icon: <OneColumnIcon />,
    content: () => [section(pad(16), p())],
  },
  { id: 'columns-2', label: '2 colonnes', icon: <Columns2Icon size={22} />, content: () => [columns(2)] },
  { id: 'columns-3', label: '3 colonnes', icon: <Columns3Icon size={22} />, content: () => [columns(3)] },
  { id: 'columns-4', label: '4 colonnes', icon: <Columns4Icon size={22} />, content: () => [columns(4)] },
];

export const CONTENT_ITEMS: PaletteItem[] = [
  { id: 'heading', label: 'Titre', icon: <Heading1Icon size={22} />, content: () => [h(2, 'Votre titre ici')] },
  {
    id: 'text',
    label: 'Texte',
    icon: <TypeIcon size={22} />,
    content: () => [
      p('Ceci est un nouveau bloc de texte. Cliquez dessus pour modifier le contenu, sélectionnez du texte pour le mettre en forme.'),
    ],
  },
  { id: 'button', label: 'Bouton', icon: <MousePointerClickIcon size={22} />, content: () => [button('Cliquez ici')] },
  { id: 'image', label: 'Image', icon: <ImageIcon size={22} />, content: () => [image(placeholderImage(600, 300))] },
  { id: 'divider', label: 'Séparateur', icon: <MinusIcon size={22} />, content: () => [{ type: 'horizontalRule' }] },
  { id: 'spacer', label: 'Espacement', icon: <SpacerIcon />, content: () => [{ type: 'spacer', attrs: { height: 32 } }] },
  { id: 'social', label: 'Réseaux', icon: <SocialIcon />, content: () => [{ type: 'socialLinks' }] },
  { id: 'menu', label: 'Menu', icon: <PanelTopIcon size={22} />, content: () => [menu()] },
  {
    id: 'list',
    label: 'Liste',
    icon: <ListIcon size={22} />,
    content: () => [
      {
        type: 'bulletList',
        content: ['Premier point', 'Deuxième point', 'Troisième point'].map((item) => ({
          type: 'listItem',
          content: [p(item)],
        })),
      },
    ],
  },
  {
    id: 'quote',
    label: 'Citation',
    icon: <TextQuoteIcon size={22} />,
    content: () => [{ type: 'blockquote', content: [p('« Une citation qui met en valeur votre message. »')] }],
  },
  { id: 'html', label: 'HTML', icon: <SquareCodeIcon size={22} />, content: () => [{ type: 'htmlBlock' }] },
  {
    id: 'card',
    label: 'Encadré',
    icon: <LayoutIcon size={22} />,
    content: () => [
      section(
        `${pad(24)};background-color:#f1f5f9;border-radius:12px`,
        h(3, 'Le saviez-vous ?'),
        p('Un encadré attire l’œil sur une information importante.'),
      ),
    ],
  },
];

// ---------------------------------------------------------------------------
// Prebuilt rows (Unlayer's "Blocks" tab)
// ---------------------------------------------------------------------------

export const PREBUILT_BLOCKS: PrebuiltBlock[] = [
  {
    id: 'header',
    label: 'En-tête',
    description: 'Logo à gauche, menu à droite',
    content: () => [
      columns(2, [
        sized(column(image(placeholderImage(140, 40, 'LOGO'), { alignment: 'left', width: '140' })), 33),
        sized(column(menu('right')), 67),
      ]),
    ],
  },
  {
    id: 'hero',
    label: 'Hero',
    description: 'Grand titre, accroche et bouton',
    content: () => [
      section(
        `${pad(40, 24)};background-color:#eef2ff;border-radius:12px`,
        h(1, 'Les nouveautés de la saison', { alignment: 'center' }),
        p('Découvrez notre sélection pensée pour vous, disponible dès aujourd’hui.', { alignment: 'center' }),
        button('Découvrir', { style: `background-color:#4f46e5;color:#ffffff;${pad(12, 24)};border-radius:8px` }),
      ),
    ],
  },
  {
    id: 'products',
    label: 'Produits',
    description: 'Deux cartes produit côte à côte',
    content: () => [
      columns(2, [
        column(
          image(placeholderImage(280, 200, 'Produit A')),
          h(3, 'Produit A', { alignment: 'center' }),
          p('Une courte description du produit.', { alignment: 'center' }),
          button('Acheter'),
        ),
        column(
          image(placeholderImage(280, 200, 'Produit B')),
          h(3, 'Produit B', { alignment: 'center' }),
          p('Une courte description du produit.', { alignment: 'center' }),
          button('Acheter'),
        ),
      ], { cellspacing: 16 }),
    ],
  },
  {
    id: 'features',
    label: 'Avantages',
    description: 'Trois colonnes titre + texte',
    content: () => [
      columns(
        3,
        ['Livraison offerte', 'Retours gratuits', 'Support 7j/7'].map((title) =>
          column(h(3, title, { alignment: 'center' }), p('Un argument clair et concis.', { alignment: 'center' })),
        ),
      ),
    ],
  },
  {
    id: 'testimonial',
    label: 'Témoignage',
    description: 'Citation client mise en avant',
    content: () => [
      section(
        `${pad(24)};background-color:#f8fafc;border-radius:12px`,
        { type: 'blockquote', content: [p('« Service impeccable, je recommande les yeux fermés. »')] },
        p('— Camille, cliente depuis 2021', { alignment: 'right', style: 'color:#64748b' }),
      ),
    ],
  },
  {
    id: 'footer',
    label: 'Pied de page',
    description: 'Réseaux sociaux, adresse et désinscription',
    content: () => [
      { type: 'horizontalRule' },
      { type: 'socialLinks' },
      p('Acme SAS · 10 rue de la Paix, 75002 Paris', { alignment: 'center', style: 'color:#94a3b8;font-size:12px' }),
      p([text('Se désinscrire', link('https://example.com/unsubscribe'))], {
        alignment: 'center',
        style: 'font-size:12px',
      }),
    ],
  },
];

/** Starter template shown on first load. */
export function starterTemplate(): JSONContent {
  return {
    type: 'doc',
    content: [
      ...PREBUILT_BLOCKS[0].content(),
      { type: 'spacer', attrs: { height: 16 } },
      ...PREBUILT_BLOCKS[1].content(),
      { type: 'spacer', attrs: { height: 16 } },
      h(2, 'Nos coups de cœur', { alignment: 'center' }),
      ...PREBUILT_BLOCKS[2].content(),
      { type: 'spacer', attrs: { height: 16 } },
      ...PREBUILT_BLOCKS[5].content(),
    ],
  };
}
