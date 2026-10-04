import { forwardRef, type ComponentType } from 'react';
import { EditorRoot, useEmailEditor, type EditorRootProps, type EmailEditorHandle } from '../context';
import { cx } from '../core/cx';
import { Canvas, type CanvasProps } from './Canvas';
import { LayersPanel, type LayersPanelProps } from './LayersPanel';
import { Sidebar, type SidebarProps } from './Sidebar';
import { TopBar, type TopBarProps } from './TopBar';

export interface BetterEmailEditorComponents {
  TopBar?: ComponentType<TopBarProps>;
  LayersPanel?: ComponentType<LayersPanelProps>;
  Canvas?: ComponentType<CanvasProps>;
  Sidebar?: ComponentType<SidebarProps>;
}

export interface BetterEmailEditorProps extends Omit<EditorRootProps, 'children'> {
  /** Show the top bar. Default: true. */
  showTopBar?: boolean;
  /** Show the layers panel. Default: true. */
  showLayers?: boolean;
  /** Show the right sidebar. Default: true. */
  showSidebar?: boolean;
  /** Replace any part with your own component. */
  components?: BetterEmailEditorComponents;
  /** Props (className, style…) forwarded to each part. */
  slotProps?: {
    topBar?: TopBarProps;
    layersPanel?: LayersPanelProps;
    canvas?: CanvasProps;
    sidebar?: SidebarProps;
  };
}

function DefaultLayout({
  showTopBar = true,
  showLayers = true,
  showSidebar = true,
  components = {},
  slotProps = {},
}: Pick<BetterEmailEditorProps, 'showTopBar' | 'showLayers' | 'showSidebar' | 'components' | 'slotProps'>) {
  const { layersOpen } = useEmailEditor();
  const { TopBar: Top = TopBar, LayersPanel: Layers = LayersPanel, Canvas: Main = Canvas, Sidebar: Side = Sidebar } = components;
  const withLayers = showLayers && layersOpen;
  return (
    <div
      className={cx(
        'bree-layout',
        showTopBar && 'bree-with-topbar',
        withLayers && 'bree-with-layers',
        showSidebar && 'bree-with-sidebar',
      )}
    >
      {showTopBar && <Top {...slotProps.topBar} />}
      {withLayers && <Layers {...slotProps.layersPanel} />}
      <Main {...slotProps.canvas} />
      {showSidebar && <Side {...slotProps.sidebar} />}
    </div>
  );
}

/**
 * The complete editor in one component: top bar, layers, canvas and sidebar.
 * For a custom layout, use `EditorRoot` with the individual components instead.
 */
export const BetterEmailEditor = forwardRef<EmailEditorHandle, BetterEmailEditorProps>(function BetterEmailEditor(
  { showTopBar, showLayers, showSidebar, components, slotProps, ...rootProps },
  ref,
) {
  return (
    <EditorRoot ref={ref} {...rootProps}>
      <DefaultLayout showTopBar={showTopBar} showLayers={showLayers} showSidebar={showSidebar} components={components} slotProps={slotProps} />
    </EditorRoot>
  );
});
