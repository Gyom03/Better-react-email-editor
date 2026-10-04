import {
  CodeIcon,
  Columns2Icon,
  Columns3Icon,
  Columns4Icon,
  Heading1Icon,
  ImageIcon,
  LayoutIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  MousePointerClickIcon,
  PanelLeftIcon,
  SquareCodeIcon,
  TableIcon,
  TextQuoteIcon,
  TypeIcon,
} from '@react-email/editor/ui';
import type { Node as PMNode } from '@tiptap/pm/model';
import { SpacerIcon } from '../components/icons';
import { ButtonInspector } from '../components/inspectors/ButtonInspector';
import { ColumnsInspector } from '../components/inspectors/ColumnsInspector';
import { HeadingInspector } from '../components/inspectors/HeadingInspector';
import { ImageInspector } from '../components/inspectors/ImageInspector';
import { ContainerInspector, DividerInspector, HtmlInspector, SpacerInspector } from '../components/inspectors/SimpleInspectors';
import { SocialLinksInspector } from '../components/inspectors/SocialLinksInspector';
import { HtmlBlock, SocialLinks, Spacer } from '../nodes/custom-nodes';
import type { I18n } from '../i18n';
import type { NodeDefinition } from './types';

export function truncate(text: string, max = 36) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** Text content, or "empty". The default preview of text-like nodes. */
export const textPreview = (node: PMNode, { t }: I18n) => truncate(node.textContent) || t.layers.empty;

const noPreview = () => '';

const imagePreview = (node: PMNode, { t }: I18n) => {
  const { attrs } = node;
  if (attrs.alt) return truncate(attrs.alt);
  const src = String(attrs.src ?? '');
  if (src.startsWith('data:')) return t.layers.uploadedImage;
  try {
    const url = new URL(src);
    // Placeholder services carry the label in ?text=
    return truncate(url.searchParams.get('text') ?? decodeURIComponent(url.pathname.split('/').pop() ?? ''));
  } catch {
    return '';
  }
};

export const defaultNodes: NodeDefinition[] = [
  { type: 'paragraph', icon: TypeIcon },
  { type: 'heading', icon: Heading1Icon, inspector: HeadingInspector },
  { type: 'image', icon: ImageIcon, inspector: ImageInspector, preview: imagePreview },
  { type: 'button', icon: MousePointerClickIcon, inspector: ButtonInspector },
  { type: 'horizontalRule', icon: MinusIcon, inspector: DividerInspector, preview: noPreview },
  {
    type: 'spacer',
    icon: SpacerIcon,
    inspector: SpacerInspector,
    preview: (node) => `${node.attrs.height}px`,
    extensions: [Spacer],
  },
  {
    type: 'socialLinks',
    icon: LinkIcon,
    inspector: SocialLinksInspector,
    preview: (node) => (Array.isArray(node.attrs.links) ? node.attrs.links.map((l: { network: string }) => l.network).join(', ') : ''),
    extensions: [SocialLinks],
  },
  {
    type: 'htmlBlock',
    icon: SquareCodeIcon,
    inspector: HtmlInspector,
    preview: (node) => truncate(String(node.attrs.html ?? '').replace(/<[^>]+>/g, ' ')),
    extensions: [HtmlBlock],
  },
  { type: 'section', icon: LayoutIcon, inspector: ContainerInspector, preview: noPreview },
  { type: 'columnsColumn', icon: PanelLeftIcon, inspector: ContainerInspector, preview: noPreview },
  { type: 'twoColumns', icon: Columns2Icon, inspector: ColumnsInspector, preview: noPreview },
  { type: 'threeColumns', icon: Columns3Icon, inspector: ColumnsInspector, preview: noPreview },
  { type: 'fourColumns', icon: Columns4Icon, inspector: ColumnsInspector, preview: noPreview },
  { type: 'bulletList', icon: ListIcon },
  { type: 'orderedList', icon: ListOrderedIcon },
  { type: 'blockquote', icon: TextQuoteIcon },
  { type: 'codeBlock', icon: CodeIcon },
  { type: 'table', icon: TableIcon },
];
