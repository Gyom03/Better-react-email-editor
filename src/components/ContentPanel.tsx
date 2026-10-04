import { useState, type ReactNode } from 'react';
import { useEmailEditor } from '../context';
import { cx, type StyleProps } from '../core/cx';
import { BlocksTab } from './BlocksTab';
import { BodyTab, type DocumentContext } from './BodyTab';
import { ContentTab } from './ContentTab';

export interface ContentPanelTab {
  id: string;
  label: string;
  render: (ctx: DocumentContext) => ReactNode;
}

export interface ContentPanelProps extends StyleProps {
  ctx: DocumentContext;
  /**
   * Tabs to show. Built-in ids: "content", "blocks", "body". Pass objects to
   * add your own tabs, e.g. `['content', { id: 'saved', label: 'Saved', render: () => <Saved /> }]`.
   */
  tabs?: Array<'content' | 'blocks' | 'body' | ContentPanelTab>;
  defaultTab?: string;
}

/** Sidebar screen shown when nothing is selected: tabs Content / Blocks / Body. */
export function ContentPanel({ ctx, tabs = ['content', 'blocks', 'body'], defaultTab, className, style }: ContentPanelProps) {
  const { t } = useEmailEditor();
  const builtIn: Record<string, ContentPanelTab> = {
    content: { id: 'content', label: t.sidebar.tabContent, render: () => <ContentTab /> },
    blocks: { id: 'blocks', label: t.sidebar.tabBlocks, render: () => <BlocksTab /> },
    body: { id: 'body', label: t.sidebar.tabBody, render: (doc) => <BodyTab ctx={doc} /> },
  };
  const resolved = tabs.map((tab) => (typeof tab === 'string' ? builtIn[tab] : tab));
  const [current, setCurrent] = useState(defaultTab ?? resolved[0]?.id);
  const active = resolved.find((tab) => tab.id === current) ?? resolved[0];

  return (
    <div className={cx('bree-content-panel', className)} style={style}>
      {resolved.length > 1 && (
        <nav className="bree-tabs" role="tablist">
          {resolved.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === active?.id}
              className={cx(tab.id === active?.id && 'bree-active')}
              onClick={() => setCurrent(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
      <div className="bree-panel-scroll">{active?.render(ctx)}</div>
    </div>
  );
}
