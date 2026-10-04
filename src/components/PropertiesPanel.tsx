import { Inspector, XIcon } from '@react-email/editor/ui';
import type { ReactNode } from 'react';
import { useEmailEditor } from '../context';
import { cx, type StyleProps } from '../core/cx';

export interface PropertiesPanelProps extends StyleProps {
  title: string;
  children: ReactNode;
  /** Shows the hierarchy (Email / Row / Column / Text…) under the header. Default: true. */
  breadcrumb?: boolean;
}

/** Deselects everything: the sidebar goes back to the content panel. */
export function useDeselect() {
  const { editor } = useEmailEditor();
  return () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    editor.commands.blur();
  };
}

/** Sidebar screen shown when something is selected: header, breadcrumb and the inspector below. */
export function PropertiesPanel({ title, children, breadcrumb = true, className, style }: PropertiesPanelProps) {
  const { t, nodeLabel } = useEmailEditor();
  const deselect = useDeselect();
  return (
    <div className={cx('bree-properties', className)} style={style}>
      <header className="bree-properties-header">
        <div>
          <span className="bree-eyebrow">{t.sidebar.propertiesEyebrow}</span>
          <h2>{title}</h2>
        </div>
        <button type="button" className="bree-icon-button" title={t.sidebar.closeProperties} onClick={deselect}>
          <XIcon size={16} />
        </button>
      </header>
      {breadcrumb && (
        <Inspector.Breadcrumb>
          {(segments) =>
            segments.length > 1 && (
              <nav className="bree-breadcrumb" aria-label={t.sidebar.breadcrumb}>
                {segments.map((segment, i) => (
                  <span key={`${segment.node.nodeType}-${segment.node.nodePos.pos}`} className="bree-crumb">
                    {i > 0 && <span className="bree-crumb-sep">/</span>}
                    <button type="button" disabled={i === segments.length - 1} onClick={segment.focus}>
                      {nodeLabel(segment.node.nodeType)}
                    </button>
                  </span>
                ))}
              </nav>
            )
          }
        </Inspector.Breadcrumb>
      )}
      <div className="bree-panel-scroll">{children}</div>
    </div>
  );
}
