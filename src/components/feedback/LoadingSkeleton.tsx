import React from 'react';

type TableSkeletonRowsProps = {
  columns: number;
  rows?: number;
};

export const SkeletonLine: React.FC<{ width?: string; height?: number }> = ({
  width = '100%',
  height = 12,
}) => (
  <span
    aria-hidden="true"
    className="loading-skeleton"
    style={{ display: 'block', width, height, borderRadius: '5px' }}
  />
);

export const TableSkeletonRows: React.FC<TableSkeletonRowsProps> = ({ columns, rows = 5 }) => (
  <>
    {Array.from({ length: rows }, (_, row) => (
      <tr key={row} aria-hidden="true" className="loading-skeleton-row">
        {Array.from({ length: columns }, (_, column) => (
          <td key={column}>
            <SkeletonLine
              width={column === 0 ? '78%' : `${48 + ((row + column) % 4) * 10}%`}
              height={column === 0 ? 14 : 12}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const CardGridSkeleton: React.FC<{ count?: number; minHeight?: number }> = ({
  count = 3,
  minHeight = 150,
}) => (
  <div
    role="status"
    aria-label="Loading content"
    aria-busy="true"
    className="loading-card-grid"
    style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 220px), 1fr))` }}
  >
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="loading-card" style={{ minHeight }}>
        <SkeletonLine width="40%" height={14} />
        <SkeletonLine width="58%" height={28} />
        <SkeletonLine width="72%" height={12} />
      </div>
    ))}
  </div>
);

export const SectionSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div role="status" aria-label="Loading content" aria-busy="true" className="loading-section">
    <SkeletonLine width="28%" height={15} />
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="loading-section-row">
        <SkeletonLine width={index % 2 ? '72%' : '84%'} />
        <SkeletonLine width="42%" />
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="dashboard-loading" role="status" aria-label="Loading dashboard" aria-busy="true">
    <div className="dashboard-loading-metrics">
      {[0, 1, 2, 3].map(item => (
        <div className="card dashboard-loading-metric" key={item}>
          <SkeletonLine width="72px" />
          <SkeletonLine width="108px" height={21} />
          <SkeletonLine width="90px" />
        </div>
      ))}
    </div>
    <div className="card dashboard-loading-table">
      <SkeletonLine width="180px" height={14} />
      <div className="dashboard-loading-rows">
        {Array.from({ length: 5 }, (_, row) => (
          <div className="dashboard-loading-row" key={row}>
            {[0, 1, 2, 3, 4].map(column => (
              <SkeletonLine
                key={column}
                width={column === 0 ? '100%' : '90px'}
                height={column === 0 ? 14 : 12}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AppLoadingSkeleton: React.FC = () => (
  <div className="app-loading-shell" role="status" aria-label="Loading your workspace" aria-busy="true">
    <aside className="app-loading-sidebar">
      <SkeletonLine width="120px" height={30} />
      <div className="app-loading-nav">
        {Array.from({ length: 7 }, (_, index) => (
          <SkeletonLine key={index} width={`${58 + (index % 3) * 10}%`} height={13} />
        ))}
      </div>
      <SkeletonLine width="100%" height={42} />
    </aside>
    <div className="app-loading-main">
      <div className="app-loading-header">
        <SkeletonLine width="160px" height={20} />
        <SkeletonLine width="100px" height={32} />
      </div>
      <DashboardSkeleton />
    </div>
  </div>
);
