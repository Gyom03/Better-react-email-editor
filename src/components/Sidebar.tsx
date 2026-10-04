import { Inspector, type InspectorNodeContext, type InspectorTextContext } from '@react-email/editor/ui';
import type { ReactNode } from 'react';
import { useEmailEditor } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { BlockProperties } from './BlockProperties';
import type { DocumentContext } from './BodyTab';
import { ContentPanel } from './ContentPanel';
import { TextProperties } from './TextProperties';

export interface SidebarProps extends StyleProps {
  /** Screen when nothing is selected. Default: `<ContentPanel />`. */
  renderDocument?: (ctx: DocumentContext) => ReactNode;
  /** Screen when a block is selected. Default: `<BlockProperties />`. */
  renderNode?: (ctx: InspectorNodeContext) => ReactNode;
  /** Screen when text is selected. Default: `<TextProperties />`. */
  renderText?: (ctx: InspectorTextContext) => ReactNode;
}

/** Right panel: switches between the content panel and the properties of the selection. */
export function Sidebar({
  renderDocument = (ctx) => <ContentPanel ctx={ctx} />,
  renderNode = (ctx) => <BlockProperties ctx={ctx} />,
  renderText = (ctx) => <TextProperties ctx={ctx} />,
  className,
  style,
}: SidebarProps) {
  const { t } = useEmailEditor();
  return (
    <Inspector.Root className={cx('bree-sidebar', className)} style={style} aria-label={t.sidebar.label}>
      <Inspector.Document>{renderDocument}</Inspector.Document>
      <Inspector.Node>{renderNode}</Inspector.Node>
      <Inspector.Text>{renderText}</Inspector.Text>
    </Inspector.Root>
  );
}
