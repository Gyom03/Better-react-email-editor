# better-react-email-editor

A drag & drop email builder for React, in the spirit of [Unlayer](https://unlayer.com). It renders **inside your app** (no iframe) and is built on [`@react-email/editor`](https://www.npmjs.com/package/@react-email/editor) (Tiptap / ProseMirror, with React Email for the export).

Every screen and menu is a separate component. Use the all-in-one editor, or compose your own layout from the parts. Every component accepts `className` and `style`. The UI ships in **English** (default) and **French**.

[Lire en français](./README.fr.md)

![The editor](./docs/screenshot.png)

## Features

- **Drag & drop**: layouts of 1 to 4 columns and 12 content blocks (heading, text, button, image, divider, spacer, social links, menu, list, quote, HTML, card), plus prebuilt rows (header, hero, products, features, testimonial, footer).
- **Canvas**: hover and selection frames, a move handle, a toolbar (select parent, duplicate, delete) and keyboard shortcuts (`Esc` selects the parent, `Delete` removes the block).
- **Layers panel**: the email as a tree. You can select, reorder and nest blocks by drag & drop, with keyboard navigation.
- **Properties panel**: one panel per block type (typography, spacing, background, border, links, column widths, social networks, HTML…) and a breadcrumb of the hierarchy.
- **Inline text editing**: floating menu and `/` commands.
- **Copy / paste** of blocks and text, and undo / redo.
- **Preview and export**: desktop and mobile preview, HTML (copy or download), plain text and JSON.
- **Modular**: replace, restyle or rearrange any part, and add your own blocks, palette items, templates and properties panels.
- **i18n**: English and French are built in, and you can override any string.

## Installation

```bash
npm install better-react-email-editor @react-email/editor react-email \
  @tiptap/core @tiptap/pm @tiptap/react @tiptap/html @tiptap/extension-placeholder
```

`react` and `react-dom` (18 or 19), `@react-email/editor`, `react-email` and the `@tiptap/*` packages are peer dependencies. Your app and the editor must share one copy of each.

## Quick start

```tsx
import { BetterEmailEditor } from 'better-react-email-editor';
import '@react-email/editor/themes/default.css';
import 'better-react-email-editor/styles.css';

export function NewsletterEditor() {
  return (
    <div style={{ height: '100vh' }}>
      <BetterEmailEditor
        locale="en" // or "fr"
        onChange={(value) => save(value)} // { doc, settings }
        uploadImage={async (file) => ({ url: await uploadToS3(file) })}
      />
    </div>
  );
}
```

The editor fills its parent, so give the parent a height.

### Loading, saving and exporting

```tsx
const ref = useRef<EmailEditorHandle>(null);

<BetterEmailEditor ref={ref} defaultValue={savedValue} onChange={setDraft} />;

const value = ref.current.getValue(); // { doc, settings } — store it as JSON
ref.current.setValue(otherValue); // replace the content
const { html, text } = await ref.current.exportEmail(); // ready-to-send email
```

| `EmailEditorHandle` | Description |
| --- | --- |
| `editor` | The underlying Tiptap `Editor`. |
| `getValue()` / `setValue(value)` | Read or replace `{ doc, settings }`. `setValue` also accepts a bare Tiptap document. |
| `getJSON()` | The Tiptap document only. |
| `exportEmail()` | `Promise<{ html, text, unformattedHtml }>`, including the preview text. |
| `getHtml()` / `getText()` | Shortcuts for `exportEmail()`. |
| `insertBlocks(json[])` | Appends blocks at the end of the email. |

`defaultValue` is read on mount. The editor is uncontrolled, because re-applying a document on every keystroke would reset the cursor. Use `setValue` to replace the content later.

## Props

`BetterEmailEditor` accepts every `EditorRoot` prop, plus the layout props listed further down.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultValue` | `EmailValue \| JSONContent` | empty email | Initial content, read on mount. |
| `onChange` | `(value: EmailValue) => void` | | Called on every document or settings change. Debounce it yourself if you save to a server. |
| `onReady` | `(handle) => void` | | Called once the editor exists. |
| `locale` | `'en' \| 'fr' \| string` | `'en'` | UI language. |
| `messages` | `PartialMessages` | | Overrides any UI string, deep-merged over the locale. |
| `uploadImage` | `(file) => Promise<{ url }>` | inline data URL | Stores uploaded or pasted images. |
| `nodes` | `NodeDefinition[]` | `defaultNodes` | Block types: label, icon, properties panel, layers preview, extensions. |
| `palette` | `PaletteItem[]` | `defaultPalette` | Tiles of the **Content** tab. |
| `paletteGroups` | `PaletteGroup[]` | Layout, Content | Groups of tiles. |
| `templates` | `TemplateItem[]` | `defaultTemplates` | Prebuilt rows of the **Blocks** tab. |
| `starterDocument` | `(i18n) => JSONContent` | demo email | Loaded by the top bar's **Template** button. |
| `extensions` | `Extensions` | | Extra Tiptap extensions, read on mount. |
| `theme` | `EditorThemeInput` | `defaultTheme` | Email theme for new documents, read on mount. |
| `editable` | `boolean` | `true` | |
| `device` / `defaultDevice` / `onDeviceChange` | `'desktop' \| 'mobile'` | `'desktop'` | Canvas width, controlled or not. |
| `layersOpen` / `defaultLayersOpen` / `onLayersOpenChange` | `boolean` | `true` | Layers panel visibility, controlled or not. |
| `className` / `style` | | | Applied to the root element. |

Layout props, `BetterEmailEditor` only:

| Prop | Description |
| --- | --- |
| `showTopBar`, `showLayers`, `showSidebar` | Hide a part (all `true` by default). |
| `slotProps` | Props for each part, e.g. `{ sidebar: { className: 'my-sidebar' }, topBar: { actions: <MyButton /> } }`. |
| `components` | Replace a part entirely: `{ TopBar, LayersPanel, Canvas, Sidebar }`. |

## Components

Every component below accepts `className` and `style`, and must be rendered inside `EditorRoot` (or `BetterEmailEditor`).

| Component | What it is |
| --- | --- |
| `EditorRoot` | Provider: creates the editor and shares it. Renders a `div.bree`. |
| `Canvas` | The editable email, with its overlay (frames, handle, toolbar, drop indicator). Props: `overlay`, `bubbleMenu`, `slashCommands`. |
| `TopBar` | Top bar. Props: `brand`, `actions`, `showLayersToggle`, or `children` to replace its content. |
| `LayersToggle`, `UndoRedo`, `DeviceToggle`, `TemplateButton`, `ImportButton`, `ExportJsonButton`, `PreviewButton`, `ExportHtmlButton` | The top bar controls, usable on their own. |
| `LayersPanel` | Layers tree. Props: `title`, `onClose` (`null` hides the close button). |
| `Sidebar` | Right panel. Switches between three screens; override any of them with `renderDocument`, `renderNode` or `renderText`. |
| `ContentPanel` | Screen shown when nothing is selected: tabs. Prop `tabs` picks or reorders `'content' \| 'blocks' \| 'body'` and accepts your own tabs. |
| `ContentTab` / `PaletteTile` | Palette of draggable tiles. |
| `BlocksTab` / `TemplateCard` | Prebuilt rows. |
| `BodyTab` | Email-wide settings: background, width, default colors, preview text. |
| `PropertiesPanel` | Properties shell: header, close button, breadcrumb. |
| `BlockProperties` | Properties of the selected block, using the inspector registered for its type. |
| `TextProperties` | Properties of a text selection. |
| `PreviewDialog` | Preview and export modal. |
| `ImageInspector`, `ButtonInspector`, `HeadingInspector`, `SocialLinksInspector`, `ColumnsInspector`, `SpacerInspector`, `HtmlInspector`, `DividerInspector`, `ContainerInspector`, `DefaultInspector` | Properties panel of each block type. |
| `TypographyGroup`, `SpacingGroup`, `BoxGroup` | Reusable groups of controls. |
| `Group`, `Field`, `TextInput`, `TextArea`, `NumberInput`, `RangeInput`, `ColorInput`, `Select`, `Segmented`, `AlignInput`, `PaddingInput` | Form controls, to build your own panels. |

Hooks:

- `useEmailEditor()` gives the editor, `t` (messages), `locale`, registries, `device`, `layersOpen`, `settings`, `handle`…
- `useI18n()` gives `{ locale, t }`.
- `useDraggableBlock(label, content)` turns any element into a source of blocks: drag it onto the canvas or click it.
- `useDeselect()` clears the selection.

### Custom layout

```tsx
import { EditorRoot, Canvas, Sidebar, UndoRedo, DeviceToggle, ExportHtmlButton } from 'better-react-email-editor';

<EditorRoot locale="fr" defaultValue={value} onChange={save} className="my-editor">
  <div style={{ display: 'flex', height: '100%' }}>
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Canvas style={{ flex: 1 }} />
      <footer>
        <UndoRedo />
        <DeviceToggle />
        <ExportHtmlButton />
      </footer>
    </main>
    <Sidebar style={{ width: 320 }} />
  </div>
</EditorRoot>;
```

![A custom layout](./docs/custom-layout.png)

The playground contains this example: `npm run dev`, then open `/?example=custom`.

## Styling

All classes are prefixed with `bree-`, and the stylesheet never touches global elements. Restyle a part through its `className` or `style`, or theme the whole editor with CSS custom properties:

```css
.my-editor {
  --bree-accent: #7c3aed;
  --bree-accent-hover: #6d28d9;
  --bree-accent-soft: #f5f3ff;
  --bree-font: 'Inter', sans-serif;
  --bree-sidebar-width: 320px;
}
```

| Variable | Default |
| --- | --- |
| `--bree-bg`, `--bree-bg-subtle` | `#ffffff`, `#f8fafc` |
| `--bree-border`, `--bree-border-strong` | `#e5e7eb`, `#d1d5db` |
| `--bree-text`, `--bree-text-secondary`, `--bree-muted` | `#111827`, `#334155`, `#6b7280` |
| `--bree-accent`, `--bree-accent-hover`, `--bree-accent-soft` | `#2563eb`, `#1d4ed8`, `#eff6ff` |
| `--bree-danger` | `#dc2626` |
| `--bree-radius` | `8px` |
| `--bree-canvas-bg` | `#eef1f5` |
| `--bree-topbar-height`, `--bree-sidebar-width`, `--bree-layers-width` | `56px`, `360px`, `270px` |
| `--bree-font` | Inter, system-ui… |

The default layout is a CSS grid on `.bree-layout`. The color picker popover is rendered in a portal; it carries the `bree` class, so the variables apply to it too. Its `popoverClassName` prop adds your own class.

## Languages

```tsx
<BetterEmailEditor locale="fr" />

// Override a few strings
<BetterEmailEditor locale="en" messages={{ topBar: { brand: 'Acme Mailer' }, palette: { card: 'Callout' } }} />

// Add a language: provide every string, starting from `en`
import { en, type Messages } from 'better-react-email-editor';
const de: Messages = { ...en, topBar: { ...en.topBar, preview: 'Vorschau' /* … */ } };
<BetterEmailEditor locale="de" messages={de} />
```

`en` and `fr` are exported. `messages` covers the UI, the default content inserted by the palette and templates, the placeholders and the `/` commands.

## Extending

### A palette item

```tsx
import { content, defaultPalette, type PaletteItem } from 'better-react-email-editor';

const promo: PaletteItem = {
  id: 'promo',
  group: 'brand', // new group, or 'layout' / 'content'
  label: ({ locale }) => (locale === 'fr' ? 'Bandeau promo' : 'Promo banner'),
  icon: <PercentIcon />,
  content: () => [content.section('padding:20px;background-color:#fef3c7', content.heading(2, '20% off'))],
};

<BetterEmailEditor
  palette={[promo, ...defaultPalette]}
  paletteGroups={[{ id: 'brand', title: 'My brand' }, ...defaultPaletteGroups]}
/>;
```

`content` provides helpers to build the document JSON: `paragraph`, `heading`, `button`, `image`, `columns`, `column`, `sized`, `section`, `padding`, `link`, `text`, `doc` and `placeholderImage`.

### A template (prebuilt row)

```tsx
const signature: TemplateItem = {
  id: 'signature',
  label: 'Signature',
  description: 'Name, role and logo',
  content: () => [content.paragraph('Jane Doe — CEO')],
};

<BetterEmailEditor templates={[...defaultTemplates, signature]} />;
```

### A properties panel

Replace the panel of an existing block, or give one to a new block:

```tsx
import { defaultNodes, Group, Field, TextInput, SpacingGroup, type InspectorProps } from 'better-react-email-editor';

function MyButtonInspector({ ctx, className, style }: InspectorProps) {
  return (
    <div className={className} style={style}>
      <Group title="Link">
        <Field label="URL" stacked>
          <TextInput value={String(ctx.getAttr('href') ?? '')} onChange={(v) => ctx.setAttr('href', v)} />
        </Field>
      </Group>
      <SpacingGroup ctx={ctx} />
    </div>
  );
}

const nodes = defaultNodes.map((node) => (node.type === 'button' ? { ...node, inspector: MyButtonInspector } : node));

<BetterEmailEditor nodes={nodes} />;
```

`ctx` is the `@react-email/editor` inspector context: `getAttr`, `setAttr`, `getStyle`, `setStyle`, `batchSetStyle`, `presetColors`, `nodeType` and `nodePos`.

### A new block type

Create the node with `EmailNode.create` from `@react-email/editor/core`. It needs an editor rendering and an email rendering (`renderToReactEmail`). Then register it:

```tsx
const countdownNode: NodeDefinition = {
  type: 'countdown',
  label: ({ locale }) => (locale === 'fr' ? 'Compte à rebours' : 'Countdown'),
  icon: TimerIcon,
  inspector: CountdownInspector,
  preview: (node) => node.attrs.date,
  extensions: [Countdown], // your EmailNode
};

<BetterEmailEditor nodes={[...defaultNodes, countdownNode]} palette={[...defaultPalette, countdownTile]} />;
```

See `src/nodes/custom-nodes.tsx` for complete examples (spacer, social links, raw HTML).

### Removing things

```tsx
<BetterEmailEditor
  palette={defaultPalette.filter((item) => item.id !== 'html')}
  showLayers={false}
  slotProps={{ sidebar: { renderDocument: (ctx) => <ContentPanel ctx={ctx} tabs={['content', 'body']} /> } }}
/>
```

## Headless core

The drag & drop engine has no UI and can be reused: `findDropTarget`, `applyDrop`, `appendBlocks`, `unitAt`, `selectedUnit`, `selectUnit`, `duplicateUnit`, `deleteUnit`, `parentUnit`, `BLOCK_CONTAINERS` and `COLUMN_PARENTS`.

How it fits into ProseMirror:

- The model is the package's: `container` (the email) holds the blocks. The drop zones are `container`, `section` and `columnsColumn`. The rows `twoColumns`, `threeColumns` and `fourColumns` hold columns.
- `findDropTarget()` walks down from the container to the deepest zone under the pointer, then picks the gap between two children. The schema validates every drop (`node.canReplace`), so a block never lands somewhere invalid.
- `dragover` and `drop` are captured on the canvas before ProseMirror sees them. Native text drags stay with ProseMirror.
- Insertions and moves are plain transactions, so undo / redo work with no extra code.

## Development

```bash
npm install
npm run dev               # playground on http://localhost:5173 (?lang=fr, ?example=custom)
npm run build             # library → dist/ (ESM, CJS, types, styles.css)
npm run typecheck
npm run lint
```

```
src/
  index.ts                 public API
  context.tsx              EditorRoot, hooks, imperative handle
  components/              one file per screen: TopBar, LayersPanel, Canvas (+ CanvasOverlay),
                           Sidebar, ContentPanel, ContentTab, BlocksTab, BodyTab, PropertiesPanel,
                           BlockProperties, TextProperties, PreviewDialog, fields, inspectors/
  registry/                default nodes, palette, templates and starter email
  nodes/                   custom email nodes (spacer, social links, HTML)
  core/                    headless drag & drop engine, paste handling, JSON helpers
  i18n/                    en.ts, fr.ts
  styles.css
playground/                demo app consuming the library from its sources
scripts/                   Playwright scenarios
```

The scenarios in `scripts/` drive the playground in French with Playwright. They use the Edge installed locally, through `playwright-core`.

```bash
npx vite --port 5179 &
node scripts/e2e.mjs        # also e2e2 … e2e10, e2e-custom, check-padding; screenshots in ./screenshots
```

## Known limitations

These are workarounds for `@react-email/editor`:

- The package has no block drag & drop; this library adds it.
- The package's `Button.parseHTML` ignores the `data-href` and alignment it writes, so `EmailButton` (in `core/paste.ts`) reads them back. Without it, a copy-pasted button loses its link.
- Pasting with a block selected inserts **after** the block instead of replacing it.
- `Divider` rejects insertions while a divider is selected. The selection is released before a drop or a duplication.
- The package's floating menus for buttons and images duplicate the properties panel, so CSS hides them.
- `TrailingNode` leaves an empty paragraph after non-text blocks. It stays collapsed until the caret enters it.
- `EmailEditor` always places its editing area before its children. `EditorRoot` creates the editor itself, so `Canvas` can sit anywhere in your layout; it reproduces the package's paste sanitizer, which is not exported.

Further ideas: host PNG social icons (Gmail does not display SVG), add media queries to stack columns on mobile in the exported HTML, and add more blocks (video thumbnail, countdown).
