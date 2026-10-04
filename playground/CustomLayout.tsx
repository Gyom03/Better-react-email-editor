import {
  Canvas,
  DeviceToggle,
  EditorRoot,
  ExportHtmlButton,
  Sidebar,
  UndoRedo,
  content,
  defaultPalette,
  useDraggableBlock,
  type PaletteItem,
} from 'better-react-email-editor';

/** A custom block for the palette, with labels in both languages. */
const promoBanner: PaletteItem = {
  id: 'promo',
  group: 'brand',
  label: ({ locale }) => (locale === 'fr' ? 'Bandeau promo' : 'Promo banner'),
  icon: <span style={{ fontSize: 20 }}>%</span>,
  content: ({ locale }) => [
    content.section(
      `${content.padding(20)};background-color:#fef3c7;border-radius:12px`,
      content.heading(2, locale === 'fr' ? '-20 % ce week-end' : '20% off this weekend', { alignment: 'center' }),
    ),
  ],
};

function QuickInsert() {
  const drag = useDraggableBlock('Signature', () => [content.paragraph('— The Acme team')]);
  return (
    <button type="button" className="bree-btn" {...drag}>
      + Signature
    </button>
  );
}

/** Same editor, laid out by hand: no layers panel, toolbar under the canvas, custom palette group. */
export default function CustomLayout({ locale }: { locale: string }) {
  return (
    <EditorRoot
      locale={locale}
      defaultValue={content.doc(content.heading(1, 'Custom layout'), content.paragraph('Built with <EditorRoot> and individual components.'))}
      paletteGroups={[
        { id: 'brand', title: ({ locale: l }) => (l === 'fr' ? 'Ma marque' : 'My brand') },
        { id: 'layout', title: ({ t }) => t.sidebar.layoutTitle },
        { id: 'content', title: ({ t }) => t.sidebar.contentTitle },
      ]}
      palette={[promoBanner, ...defaultPalette]}
      className="custom-root"
    >
      <div className="custom-layout">
        <main className="custom-main">
          <Canvas className="custom-canvas" />
          <footer className="custom-toolbar">
            <UndoRedo />
            <DeviceToggle />
            <QuickInsert />
            <ExportHtmlButton />
          </footer>
        </main>
        <Sidebar style={{ width: 320, borderLeft: '1px solid var(--bree-border)' }} />
      </div>
    </EditorRoot>
  );
}
