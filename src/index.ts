// All-in-one
export { BetterEmailEditor, type BetterEmailEditorProps, type BetterEmailEditorComponents } from './components/BetterEmailEditor';

// Provider and hooks
export {
  EditorRoot,
  useEmailEditor,
  useOptionalEmailEditor,
  useI18n,
  useMessages,
  defaultTheme,
  readFileAsDataUrl,
  type EditorRootProps,
  type EmailEditorHandle,
  type EmailEditorContextValue,
  type EmailValue,
  type EmailSettings,
  type EmailExport,
  type Device,
} from './context';

// Screens
export { Canvas, type CanvasProps } from './components/Canvas';
export { CanvasOverlay } from './components/CanvasOverlay';
export {
  TopBar,
  LayersToggle,
  UndoRedo,
  DeviceToggle,
  TemplateButton,
  ImportButton,
  ExportJsonButton,
  PreviewButton,
  ExportHtmlButton,
  type TopBarProps,
  type PreviewButtonProps,
} from './components/TopBar';
export { LayersPanel, type LayersPanelProps } from './components/LayersPanel';
export { Sidebar, type SidebarProps } from './components/Sidebar';
export { ContentPanel, type ContentPanelProps, type ContentPanelTab } from './components/ContentPanel';
export { ContentTab, PaletteTile, type ContentTabProps, type PaletteTileProps } from './components/ContentTab';
export { BlocksTab, TemplateCard, type BlocksTabProps, type TemplateCardProps } from './components/BlocksTab';
export { BodyTab, type BodyTabProps, type DocumentContext } from './components/BodyTab';
export { PropertiesPanel, useDeselect, type PropertiesPanelProps } from './components/PropertiesPanel';
export { BlockProperties, type BlockPropertiesProps } from './components/BlockProperties';
export { TextProperties, type TextPropertiesProps } from './components/TextProperties';
export { PreviewDialog, download, type PreviewDialogProps, type PreviewView } from './components/PreviewDialog';
export { useDraggableBlock } from './components/useDraggableBlock';

// Inspectors (properties of each block type)
export { DefaultInspector } from './components/inspectors/DefaultInspector';
export { HeadingInspector } from './components/inspectors/HeadingInspector';
export { ImageInspector } from './components/inspectors/ImageInspector';
export { ButtonInspector } from './components/inspectors/ButtonInspector';
export { SocialLinksInspector } from './components/inspectors/SocialLinksInspector';
export { ColumnsInspector } from './components/inspectors/ColumnsInspector';
export { SpacerInspector, HtmlInspector, DividerInspector, ContainerInspector } from './components/inspectors/SimpleInspectors';
export {
  TypographyGroup,
  SpacingGroup,
  BoxGroup,
  css,
  type TypographyGroupProps,
  type SpacingGroupProps,
  type BoxGroupProps,
} from './components/inspectors/groups';

// Form controls
export {
  Group,
  Field,
  TextInput,
  TextArea,
  NumberInput,
  RangeInput,
  ColorInput,
  Select,
  Segmented,
  AlignInput,
  PaddingInput,
  toHex,
  DEFAULT_SWATCHES,
  type GroupProps,
  type FieldProps,
  type TextInputProps,
  type TextAreaProps,
  type NumberInputProps,
  type RangeInputProps,
  type ColorInputProps,
  type SelectProps,
  type SegmentedProps,
  type AlignInputProps,
  type PaddingInputProps,
  type Side,
} from './components/fields';
export * as icons from './components/icons';

// Registry: nodes, palette, templates
export { defaultNodes, textPreview, truncate } from './registry/default-nodes';
export { defaultPalette, defaultPaletteGroups, menuParagraph } from './registry/default-palette';
export { defaultTemplates, createStarterDocument, TemplateThumbnail } from './registry/default-templates';
export type { NodeDefinition, PaletteItem, PaletteGroup, TemplateItem, InspectorProps, IconComponent } from './registry/types';

// Custom email nodes
export { Spacer, SocialLinks, HtmlBlock, SOCIAL_NETWORKS, iconUrl, type SocialLink } from './nodes/custom-nodes';

// i18n
export { en, fr, locales, resolveMessages, resolveLabel, type Messages, type PartialMessages, type I18n, type Label, type BuiltInLocale } from './i18n';

// Headless core: document helpers and drag & drop engine
export * as content from './core/content';
export {
  BLOCK_CONTAINERS,
  COLUMN_PARENTS,
  appendBlocks,
  applyDrop,
  findDropTarget,
  selectedUnit,
  selectUnit,
  duplicateUnit,
  deleteUnit,
  parentUnit,
  unitAt,
  type BlockUnit,
  type DragPayload,
  type DropTarget,
} from './core/dnd';
export { EmailButton } from './core/paste';
export { inlineStyleToObject } from './core/style-utils';
export { cx, type StyleProps } from './core/cx';
