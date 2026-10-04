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
import type { JSONContent } from '@tiptap/core';
import { OneColumnIcon, SocialIcon, SpacerTileIcon } from '../components/icons';
import { button, columns, heading, image, link, padding, paragraph, placeholderImage, section, text } from '../core/content';
import type { I18n } from '../i18n';
import type { PaletteGroup, PaletteItem } from './types';

/** A text menu (Home · Shop · Blog · Contact), shared by the palette and the header template. */
export const menuParagraph = ({ t }: I18n, alignment = 'center'): JSONContent =>
  paragraph(
    [
      text(t.content.menuHome, link('https://example.com')),
      text('  ·  '),
      text(t.content.menuShop, link('https://example.com/shop')),
      text('  ·  '),
      text(t.content.menuBlog, link('https://example.com/blog')),
      text('  ·  '),
      text(t.content.menuContact, link('https://example.com/contact')),
    ],
    { alignment },
  );

export const defaultPaletteGroups: PaletteGroup[] = [
  { id: 'layout', title: ({ t }) => t.sidebar.layoutTitle },
  { id: 'content', title: ({ t }) => t.sidebar.contentTitle },
];

export const defaultPalette: PaletteItem[] = [
  // Layout
  {
    id: 'section',
    group: 'layout',
    label: ({ t }) => t.palette.oneColumn,
    icon: <OneColumnIcon />,
    content: () => [section(padding(16), paragraph())],
  },
  { id: 'columns-2', group: 'layout', label: ({ t }) => t.palette.twoColumns, icon: <Columns2Icon size={22} />, content: () => [columns(2)] },
  { id: 'columns-3', group: 'layout', label: ({ t }) => t.palette.threeColumns, icon: <Columns3Icon size={22} />, content: () => [columns(3)] },
  { id: 'columns-4', group: 'layout', label: ({ t }) => t.palette.fourColumns, icon: <Columns4Icon size={22} />, content: () => [columns(4)] },
  // Content
  { id: 'heading', group: 'content', label: ({ t }) => t.palette.heading, icon: <Heading1Icon size={22} />, content: ({ t }) => [heading(2, t.content.heading)] },
  { id: 'text', group: 'content', label: ({ t }) => t.palette.text, icon: <TypeIcon size={22} />, content: ({ t }) => [paragraph(t.content.text)] },
  { id: 'button', group: 'content', label: ({ t }) => t.palette.button, icon: <MousePointerClickIcon size={22} />, content: ({ t }) => [button(t.content.button)] },
  {
    id: 'image',
    group: 'content',
    label: ({ t }) => t.palette.image,
    icon: <ImageIcon size={22} />,
    content: ({ t }) => [image(placeholderImage(600, 300, t.content.image))],
  },
  { id: 'divider', group: 'content', label: ({ t }) => t.palette.divider, icon: <MinusIcon size={22} />, content: () => [{ type: 'horizontalRule' }] },
  {
    id: 'spacer',
    group: 'content',
    label: ({ t }) => t.palette.spacer,
    icon: <SpacerTileIcon />,
    content: () => [{ type: 'spacer', attrs: { height: 32 } }],
  },
  { id: 'social', group: 'content', label: ({ t }) => t.palette.social, icon: <SocialIcon />, content: () => [{ type: 'socialLinks' }] },
  { id: 'menu', group: 'content', label: ({ t }) => t.palette.menu, icon: <PanelTopIcon size={22} />, content: (i18n) => [menuParagraph(i18n)] },
  {
    id: 'list',
    group: 'content',
    label: ({ t }) => t.palette.list,
    icon: <ListIcon size={22} />,
    content: ({ t }) => [
      {
        type: 'bulletList',
        content: t.content.listItems.map((item) => ({ type: 'listItem', content: [paragraph(item)] })),
      },
    ],
  },
  {
    id: 'quote',
    group: 'content',
    label: ({ t }) => t.palette.quote,
    icon: <TextQuoteIcon size={22} />,
    content: ({ t }) => [{ type: 'blockquote', content: [paragraph(t.content.quote)] }],
  },
  {
    id: 'html',
    group: 'content',
    label: ({ t }) => t.palette.html,
    icon: <SquareCodeIcon size={22} />,
    content: ({ t }) => [{ type: 'htmlBlock', attrs: { html: t.content.html } }],
  },
  {
    id: 'card',
    group: 'content',
    label: ({ t }) => t.palette.card,
    icon: <LayoutIcon size={22} />,
    content: ({ t }) => [
      section(`${padding(24)};background-color:#f1f5f9;border-radius:12px`, heading(3, t.content.cardTitle), paragraph(t.content.cardText)),
    ],
  },
];
