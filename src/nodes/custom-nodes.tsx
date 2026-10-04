import { mergeAttributes } from '@tiptap/core';
import { EmailNode } from '@react-email/editor/core';
import { Column, Img, Link, Row, Section } from 'react-email';
import { inlineStyleToObject } from '../core/style-utils';

/**
 * Custom email blocks built on the public `EmailNode` API: each node defines
 * how it renders in the editor (renderHTML / node view) AND how it renders in
 * the final email (renderToReactEmail). That second half is what makes the
 * export work with zero extra glue.
 */

const styleAttribute = {
  style: {
    default: null as string | null,
    parseHTML: (el: HTMLElement) => el.getAttribute('style'),
    renderHTML: (attrs: Record<string, unknown>) =>
      attrs.style ? { style: attrs.style } : {},
  },
};

// ---------------------------------------------------------------------------
// Spacer
// ---------------------------------------------------------------------------

export const Spacer = EmailNode.create({
  name: 'spacer',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      ...styleAttribute,
      height: {
        default: 32,
        parseHTML: (el: HTMLElement) => Number(el.dataset.height) || 32,
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-height': attrs.height,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="spacer"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'spacer',
        class: 'node-spacer',
        style: `height:${Number(node.attrs.height)}px`,
      }),
    ];
  },

  renderToReactEmail({ node }) {
    const height = Number(node.attrs?.height ?? 32);
    return (
      <Section
        style={{
          height,
          lineHeight: `${height}px`,
          fontSize: '1px',
          ...inlineStyleToObject(node.attrs?.style),
        }}
      >
        {' '}
      </Section>
    );
  },
});

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export interface SocialLink {
  network: string;
  url: string;
}

/**
 * Icons come from the Simple Icons CDN. For maximum client support (Gmail
 * does not render SVG) host PNG versions and swap `iconUrl`.
 */
export const SOCIAL_NETWORKS: Record<
  string,
  { label: string; slug: string; color: string }
> = {
  facebook: { label: 'Facebook', slug: 'facebook', color: '1877F2' },
  instagram: { label: 'Instagram', slug: 'instagram', color: 'E4405F' },
  x: { label: 'X', slug: 'x', color: '000000' },
  linkedin: { label: 'LinkedIn', slug: 'linkedin', color: '0A66C2' },
  youtube: { label: 'YouTube', slug: 'youtube', color: 'FF0000' },
  tiktok: { label: 'TikTok', slug: 'tiktok', color: '000000' },
  github: { label: 'GitHub', slug: 'github', color: '181717' },
};

// LinkedIn was removed from recent Simple Icons releases; pin an older one.
const ICON_OVERRIDES: Record<string, string> = {
  linkedin: 'https://cdn.jsdelivr.net/npm/simple-icons@9.21.0/icons/linkedin.svg',
};

export function iconUrl(network: string) {
  if (ICON_OVERRIDES[network]) return ICON_OVERRIDES[network];
  const meta = SOCIAL_NETWORKS[network] ?? SOCIAL_NETWORKS.facebook;
  return `https://cdn.simpleicons.org/${meta.slug}/${meta.color}`;
}

function parseLinks(value: unknown): SocialLink[] {
  if (Array.isArray(value)) return value as SocialLink[];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as SocialLink[];
    } catch {
      return [];
    }
  }
  return [];
}

export const SocialLinks = EmailNode.create({
  name: 'socialLinks',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      ...styleAttribute,
      links: {
        default: [
          { network: 'facebook', url: 'https://facebook.com/' },
          { network: 'instagram', url: 'https://instagram.com/' },
          { network: 'x', url: 'https://x.com/' },
          { network: 'linkedin', url: 'https://linkedin.com/' },
        ] as SocialLink[],
        parseHTML: (el: HTMLElement) => parseLinks(el.dataset.links),
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-links': JSON.stringify(attrs.links ?? []),
        }),
      },
      size: { default: 28 },
      gap: { default: 12 },
      alignment: { default: 'center' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="social-links"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const size = Number(node.attrs.size);
    const gap = Number(node.attrs.gap);
    const links = parseLinks(node.attrs.links);
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'social-links',
        class: 'node-socialLinks',
        alignment: node.attrs.alignment,
      }),
      ...links.map((link, i) => [
        'span',
        {
          class: 'node-socialLinks-item',
          style: `margin-left:${i === 0 ? 0 : gap}px`,
        },
        [
          'img',
          {
            src: iconUrl(link.network),
            width: String(size),
            height: String(size),
            alt: SOCIAL_NETWORKS[link.network]?.label ?? link.network,
          },
        ],
      ]),
    ];
  },

  renderToReactEmail({ node }) {
    const size = Number(node.attrs?.size ?? 28);
    const gap = Number(node.attrs?.gap ?? 12);
    const links = parseLinks(node.attrs?.links);
    const align = (node.attrs?.alignment ?? 'center') as
      | 'left'
      | 'center'
      | 'right';
    return (
      <Section style={inlineStyleToObject(node.attrs?.style)}>
        <Row>
          <Column align={align}>
            {links.map((link, i) => (
              <Link
                key={`${link.network}-${i}`}
                href={link.url}
                style={{
                  display: 'inline-block',
                  marginLeft: i === 0 ? 0 : gap,
                }}
              >
                <Img
                  src={iconUrl(link.network)}
                  width={size}
                  height={size}
                  alt={SOCIAL_NETWORKS[link.network]?.label ?? link.network}
                />
              </Link>
            ))}
          </Column>
        </Row>
      </Section>
    );
  },
});

// ---------------------------------------------------------------------------
// Raw HTML
// ---------------------------------------------------------------------------

export const HtmlBlock = EmailNode.create({
  name: 'htmlBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      html: {
        default:
          '<p style="margin:0;text-align:center;font-family:sans-serif">Your custom <strong>HTML</strong></p>',
        parseHTML: (el: HTMLElement) => el.dataset.html ?? el.innerHTML,
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="html-block"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'html-block',
        class: 'node-htmlBlock',
        'data-html': node.attrs.html,
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'node-htmlBlock';
      dom.dataset.type = 'html-block';
      dom.innerHTML = node.attrs.html;
      return {
        dom,
        update(updated) {
          if (updated.type !== node.type) return false;
          dom.innerHTML = updated.attrs.html;
          return true;
        },
        ignoreMutation: () => true,
      };
    };
  },

  renderToReactEmail({ node }) {
    return <div dangerouslySetInnerHTML={{ __html: node.attrs?.html ?? '' }} />;
  },
});

export const customNodes = [Spacer, SocialLinks, HtmlBlock];
