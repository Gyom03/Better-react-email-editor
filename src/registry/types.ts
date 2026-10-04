import type { AnyExtension, JSONContent } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import type { InspectorNodeContext } from '@react-email/editor/ui';
import type { ComponentType, ReactNode } from 'react';
import type { StyleProps } from '../core/cx';
import type { I18n, Label } from '../i18n';

export type IconComponent = ComponentType<{ size?: number }>;

/** Props given to a block's properties panel. */
export interface InspectorProps extends StyleProps {
  /** The package's inspector context: getStyle / setStyle / getAttr / setAttr… */
  ctx: InspectorNodeContext;
}

/**
 * Describes one node type (block) of the email: how it is named, shown in
 * the layers panel and edited in the properties panel. Custom nodes also
 * bring their Tiptap extension.
 */
export interface NodeDefinition {
  /** ProseMirror node type name, e.g. "image" or "spacer". */
  type: string;
  /** Display name. Defaults to `messages.nodes[type]`, then to `type`. */
  label?: Label;
  /** Icon in the layers panel. */
  icon?: IconComponent;
  /** Properties panel shown when the block is selected. Defaults to `DefaultInspector`. */
  inspector?: ComponentType<InspectorProps>;
  /** Short content hint shown next to the label in the layers panel. */
  preview?: (node: PMNode, i18n: I18n) => string;
  /** Tiptap extensions the node needs (custom nodes created with `EmailNode.create`). */
  extensions?: AnyExtension[];
}

/** A draggable tile of the "Content" tab. */
export interface PaletteItem {
  id: string;
  /** Group id: "layout" and "content" are built in, any other id creates a new group. */
  group: string;
  label: Label;
  icon: ReactNode;
  /** Blocks inserted on drop or click. Called on every insertion. */
  content: (i18n: I18n) => JSONContent[];
}

export interface PaletteGroup {
  id: string;
  title: Label;
}

/** A prebuilt row of the "Blocks" tab. */
export interface TemplateItem {
  id: string;
  label: Label;
  description?: Label;
  /** Small preview drawn in the card. */
  thumbnail?: ReactNode;
  content: (i18n: I18n) => JSONContent[];
}
