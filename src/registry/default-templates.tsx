import type { JSONContent } from '@tiptap/core';
import { button, column, columns, heading, image, link, padding, paragraph, placeholderImage, section, sized, text } from '../core/content';
import type { I18n } from '../i18n';
import { menuParagraph } from './default-palette';
import type { TemplateItem } from './types';

/** Abstract wireframe used as the card preview of the built-in templates. */
export function TemplateThumbnail({ variant }: { variant: string }) {
  return (
    <span className={`bree-block-thumb bree-thumb-${variant}`} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

export const defaultTemplates: TemplateItem[] = [
  {
    id: 'header',
    label: ({ t }) => t.templates.header,
    description: ({ t }) => t.templates.headerDescription,
    thumbnail: <TemplateThumbnail variant="header" />,
    content: (i18n) => [
      columns(2, [
        sized(column(image(placeholderImage(140, 40, i18n.t.content.logo), { alignment: 'left', width: '140' })), 33),
        sized(column(menuParagraph(i18n, 'right')), 67),
      ]),
    ],
  },
  {
    id: 'hero',
    label: ({ t }) => t.templates.hero,
    description: ({ t }) => t.templates.heroDescription,
    thumbnail: <TemplateThumbnail variant="hero" />,
    content: ({ t }) => [
      section(
        `${padding(40, 24)};background-color:#eef2ff;border-radius:12px`,
        heading(1, t.content.heroTitle, { alignment: 'center' }),
        paragraph(t.content.heroText, { alignment: 'center' }),
        button(t.content.heroButton, { style: `background-color:#4f46e5;color:#ffffff;${padding(12, 24)};border-radius:8px` }),
      ),
    ],
  },
  {
    id: 'products',
    label: ({ t }) => t.templates.products,
    description: ({ t }) => t.templates.productsDescription,
    thumbnail: <TemplateThumbnail variant="products" />,
    content: ({ t }) => [
      columns(
        2,
        [t.content.productA, t.content.productB].map((name) =>
          column(
            image(placeholderImage(280, 200, name)),
            heading(3, name, { alignment: 'center' }),
            paragraph(t.content.productText, { alignment: 'center' }),
            button(t.content.productButton),
          ),
        ),
        { cellspacing: 16 },
      ),
    ],
  },
  {
    id: 'features',
    label: ({ t }) => t.templates.features,
    description: ({ t }) => t.templates.featuresDescription,
    thumbnail: <TemplateThumbnail variant="features" />,
    content: ({ t }) => [
      columns(
        3,
        t.content.features.map((title) =>
          column(heading(3, title, { alignment: 'center' }), paragraph(t.content.featureText, { alignment: 'center' })),
        ),
      ),
    ],
  },
  {
    id: 'testimonial',
    label: ({ t }) => t.templates.testimonial,
    description: ({ t }) => t.templates.testimonialDescription,
    thumbnail: <TemplateThumbnail variant="testimonial" />,
    content: ({ t }) => [
      section(
        `${padding(24)};background-color:#f8fafc;border-radius:12px`,
        { type: 'blockquote', content: [paragraph(t.content.testimonialQuote)] },
        paragraph(t.content.testimonialAuthor, { alignment: 'right', style: 'color:#64748b' }),
      ),
    ],
  },
  {
    id: 'footer',
    label: ({ t }) => t.templates.footer,
    description: ({ t }) => t.templates.footerDescription,
    thumbnail: <TemplateThumbnail variant="footer" />,
    content: ({ t }) => [
      { type: 'horizontalRule' },
      { type: 'socialLinks' },
      paragraph(t.content.footerAddress, { alignment: 'center', style: 'color:#94a3b8;font-size:12px' }),
      paragraph([text(t.content.unsubscribe, link('https://example.com/unsubscribe'))], {
        alignment: 'center',
        style: 'font-size:12px',
      }),
    ],
  },
];

const template = (id: string, i18n: I18n) => defaultTemplates.find((item) => item.id === id)?.content(i18n) ?? [];

/** The demo email: header, hero, products and footer. */
export function createStarterDocument(i18n: I18n): JSONContent {
  const spacer = { type: 'spacer', attrs: { height: 16 } };
  return {
    type: 'doc',
    content: [
      ...template('header', i18n),
      spacer,
      ...template('hero', i18n),
      spacer,
      heading(2, i18n.t.content.starterTitle, { alignment: 'center' }),
      ...template('products', i18n),
      spacer,
      ...template('footer', i18n),
    ],
  };
}
