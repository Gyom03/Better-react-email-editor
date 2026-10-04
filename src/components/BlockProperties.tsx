import type { InspectorNodeContext } from '@react-email/editor/ui';
import { useEmailEditor } from '../context';
import type { StyleProps } from '../core/cx';
import { DefaultInspector } from './inspectors/DefaultInspector';
import { PropertiesPanel } from './PropertiesPanel';

export interface BlockPropertiesProps extends StyleProps {
  ctx: InspectorNodeContext;
}

/** Properties of the selected block: picks the inspector registered for its node type. */
export function BlockProperties({ ctx, className, style }: BlockPropertiesProps) {
  const { nodes, nodeLabel } = useEmailEditor();
  const Inspector = nodes.get(ctx.nodeType)?.inspector ?? DefaultInspector;
  return (
    <PropertiesPanel title={nodeLabel(ctx.nodeType)} className={className} style={style}>
      {/* Keyed so local state (drafts, open groups) resets when the selection changes. */}
      <Inspector key={`${ctx.nodeType}-${ctx.nodePos.pos}`} ctx={ctx} />
    </PropertiesPanel>
  );
}
