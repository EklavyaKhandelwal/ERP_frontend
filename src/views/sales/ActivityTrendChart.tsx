import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { SalesActivity, SalesActivityMonthlySummary } from '../../lib/api/types';
import { activityTypes, activityTypeClasses, activityTypeColors, activityTypeLabels, type ActivityType } from './activityChartConfig';

type ActivityRange = 3 | 6 | 12;

type MonthBucket = {
  key: string;
  label: string;
  counts: Record<ActivityType, number>;
  total: number;
};

type ChartPoint = { x: number; y: number };

const activityRanges: { value: ActivityRange; label: string }[] = [
  { value: 3, label: 'Last 3 months' },
  { value: 6, label: 'Last 6 months' },
  { value: 12, label: 'Last 12 months' },
];

const chart = {
  width: 840,
  height: 260,
  left: 48,
  right: 824,
  top: 18,
  bottom: 220,
};

function createSmoothPath(points: ChartPoint[]): string {
  if (!points.length) return '';
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const midpoint = (previous.x + point.x) / 2;
    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function createMonthBuckets(
  range: ActivityRange,
  activities: SalesActivity[],
  offset = 0,
  monthlySummary?: SalesActivityMonthlySummary[],
): MonthBucket[] {
  const now = new Date();
  const currentMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const buckets: MonthBucket[] = [];

  for (let monthOffset = range - 1 + offset; monthOffset >= offset; monthOffset -= 1) {
    const date = new Date(currentMonth);
    date.setUTCMonth(date.getUTCMonth() - monthOffset);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      counts: { Call: 0, Email: 0, Meeting: 0, 'LinkedIn outreach': 0, 'Follow-up': 0 },
      total: 0,
    });
  }

  const bucketByMonth = new Map(buckets.map(bucket => [bucket.key, bucket]));
  if (monthlySummary) {
    for (const summary of monthlySummary) {
      const bucket = bucketByMonth.get(summary.month);
      if (!bucket) continue;
      bucket.counts[summary.type] += summary.count;
      bucket.total += summary.count;
    }
  } else {
    for (const activity of activities) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(activity.activityDate)) continue;
      const bucket = bucketByMonth.get(activity.activityDate.slice(0, 7));
      if (!bucket) continue;
      bucket.counts[activity.type] += 1;
      bucket.total += 1;
    }
  }

  return buckets;
}

export function ActivityTrendChart({
  activities = [],
  monthlySummary,
  selectedMonth = null,
  onSelectMonth,
  showMonthSelector = true,
  title = 'Account engagement trend',
  description = 'Compare monthly calls, emails, meetings, LinkedIn outreach, and follow-ups. Current month is month-to-date; select a month to view its breakdown.',
  activityLabel = 'interactions',
  loading = false,
  error = '',
  onRetry,
  emptyMessage = 'No activities recorded in this period yet.',
}: {
  activities?: SalesActivity[];
  monthlySummary?: SalesActivityMonthlySummary[];
  selectedMonth?: string | null;
  onSelectMonth?: (month: string | null) => void;
  showMonthSelector?: boolean;
  title?: string;
  description?: string;
  activityLabel?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyMessage?: string;
}) {
  const [range, setRange] = useState<ActivityRange>(6);
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const chartId = useId().replace(/:/g, '');
  const rangeRef = useRef<HTMLDivElement>(null);
  const rangeButtonRef = useRef<HTMLButtonElement>(null);
  const rangeOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const months = useMemo(
    () => createMonthBuckets(range, activities, 0, monthlySummary),
    [range, activities, monthlySummary],
  );
  const previousMonths = useMemo(
    () => createMonthBuckets(range, activities, range, monthlySummary),
    [range, activities, monthlySummary],
  );
  const totalActivities = months.reduce((total, month) => total + month.total, 0);
  const previousTotal = previousMonths.reduce((total, month) => total + month.total, 0);
  const maxTypeCount = Math.max(0, ...months.flatMap(month => activityTypes.map(type => month.counts[type])));
  const yMax = Math.max(4, Math.ceil(maxTypeCount / 4) * 4);
  const yTicks = Array.from({ length: 5 }, (_, index) => yMax - (index * yMax) / 4);
  const selectedMonthBucket = months.find(month => month.key === selectedMonth) ?? null;
  const selectedMonthMaxTypeCount = Math.max(
    1,
    ...(selectedMonthBucket ? activityTypes.map(type => selectedMonthBucket.counts[type]) : []),
  );
  const totalByType = activityTypes.map(type => ({
    type,
    count: months.reduce((total, month) => total + month.counts[type], 0),
  }));
  const topType = totalByType.reduce<(typeof totalByType)[number] | null>(
    (top, item) => item.count > (top?.count ?? 0) ? item : top,
    null,
  );
  const rangeLabel = `${range} months`;
  const changePercentage = previousTotal > 0
    ? Math.round(((totalActivities - previousTotal) / previousTotal) * 100)
    : null;
  const comparisonLabel = previousTotal === 0
    ? totalActivities > 0 ? `New activity vs previous ${rangeLabel}` : `No activity in previous ${rangeLabel}`
    : changePercentage === null || changePercentage === 0
      ? `No change vs previous ${rangeLabel}`
      : `${changePercentage > 0 ? 'Up' : 'Down'} ${Math.abs(changePercentage)}% vs previous ${rangeLabel}`;
  const xForMonth = (index: number) => chart.left + ((index + 0.5) * (chart.right - chart.left)) / months.length;
  const yForCount = (count: number) => chart.bottom - (count / yMax) * (chart.bottom - chart.top);
  const selectedMonthIndex = months.findIndex(month => month.key === selectedMonth);
  const hoveredMonthIndex = months.findIndex(month => month.key === hoveredMonth);
  const highlightedMonthIndex = hoveredMonthIndex >= 0 ? hoveredMonthIndex : selectedMonthIndex;
  const hoveredMonthBucket = months.find(month => month.key === hoveredMonth) ?? null;
  const selectedRangeIndex = activityRanges.findIndex(option => option.value === range);
  const titleId = `${chartId}-title`;
  const periodLabelId = `${chartId}-period-label`;
  const periodValueId = `${chartId}-period-value`;
  const periodMenuId = `${chartId}-period-menu`;
  const columnWidth = (chart.right - chart.left) / months.length;
  const tooltipLeft = hoveredMonthIndex >= 0
    ? Math.max(20, Math.min(80, (xForMonth(hoveredMonthIndex) / chart.width) * 100))
    : 50;

  useEffect(() => {
    if (!isRangeOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rangeRef.current?.contains(event.target as Node)) setIsRangeOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isRangeOpen]);

  useEffect(() => {
    if (isRangeOpen) rangeOptionRefs.current[selectedRangeIndex]?.focus();
  }, [isRangeOpen, selectedRangeIndex]);

  const selectRange = (nextRange: ActivityRange) => {
    setRange(nextRange);
    setIsRangeOpen(false);
    setHoveredMonth(null);
    onSelectMonth?.(null);
    rangeButtonRef.current?.focus();
  };

  const moveRangeFocus = (index: number) => {
    const nextIndex = (index + activityRanges.length) % activityRanges.length;
    rangeOptionRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="sales-lift-card sales-profile-trend-card" aria-labelledby={titleId}>
      <div className="sales-profile-trend-header">
        <div>
          <h3 id={titleId}>{title}</h3>
          <p>{description}</p>
        </div>
        <div
          className="sales-profile-trend-range"
          ref={rangeRef}
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsRangeOpen(false);
          }}
        >
          <span id={periodLabelId}>Period</span>
          <button
            ref={rangeButtonRef}
            className="sales-profile-trend-range-trigger"
            type="button"
            aria-labelledby={`${periodLabelId} ${periodValueId}`}
            aria-haspopup="menu"
            aria-expanded={isRangeOpen}
            aria-controls={periodMenuId}
            onClick={() => setIsRangeOpen(open => !open)}
            onKeyDown={event => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setIsRangeOpen(true);
              }
            }}
          >
            <span id={periodValueId}>{activityRanges[selectedRangeIndex].label}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </button>
          {isRangeOpen && (
            <div className="sales-profile-trend-range-menu" id={periodMenuId} role="menu" aria-label="Activity chart period">
              <span className="sales-profile-trend-range-menu-heading">Choose period</span>
              {activityRanges.map((option, index) => (
                <button
                  key={option.value}
                  ref={element => { rangeOptionRefs.current[index] = element; }}
                  className={`sales-profile-trend-range-option${option.value === range ? ' is-selected' : ''}`}
                  type="button"
                  role="menuitemradio"
                  aria-checked={option.value === range}
                  onClick={() => selectRange(option.value)}
                  onKeyDown={event => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      moveRangeFocus(index + 1);
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      moveRangeFocus(index - 1);
                    } else if (event.key === 'Home') {
                      event.preventDefault();
                      moveRangeFocus(0);
                    } else if (event.key === 'End') {
                      event.preventDefault();
                      moveRangeFocus(activityRanges.length - 1);
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      setIsRangeOpen(false);
                      rangeButtonRef.current?.focus();
                    }
                  }}
                >
                  <span>{option.label}</span>
                  {option.value === range && (
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="m4.5 10 3.5 3.5 7.5-7.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sales-profile-trend-summary">
        <div>
          <strong>{totalActivities}</strong>
          <span>{activityLabel} in the last {rangeLabel}</span>
        </div>
        {topType && topType.count > 0 && (
          <div className="sales-profile-trend-top-type">
            <span className={`sales-profile-trend-dot ${activityTypeClasses[topType.type]}`} />
            <span>Most logged: <strong>{activityTypeLabels[topType.type]}</strong></span>
          </div>
        )}
        <div className={`sales-profile-trend-comparison${changePercentage !== null && changePercentage > 0 ? ' is-up' : changePercentage !== null && changePercentage < 0 ? ' is-down' : ''}`}>
          {comparisonLabel}
        </div>
      </div>

      <div className="sales-profile-trend-scroll" onMouseLeave={() => setHoveredMonth(null)}>
        <div className="sales-profile-trend-chart-area">
          {loading ? <div className="sales-profile-trend-empty" role="status">Loading activity trend…</div>
            : error ? <div className="sales-profile-trend-empty" role="alert">
              <span>{error}</span>
              {onRetry && <button className="sales-text-link" type="button" onClick={onRetry}>Try again</button>}
            </div>
              : totalActivities === 0 ? <div className="sales-profile-trend-empty" role="status">{emptyMessage}</div>
                : <svg
                  className="sales-profile-trend-svg"
                  viewBox={`0 0 ${chart.width} ${chart.height}`}
                  role="img"
                  aria-label={`${title}: monthly counts of calls, emails, meetings, LinkedIn outreach, and follow-ups over the last ${rangeLabel}`}
                >
            {highlightedMonthIndex >= 0 && (
              <rect
                x={chart.left + highlightedMonthIndex * columnWidth}
                y={chart.top}
                width={columnWidth}
                height={chart.bottom - chart.top}
                rx={8}
                className={hoveredMonthIndex >= 0 ? 'sales-profile-trend-hover-column' : 'sales-profile-trend-selected-column'}
              />
            )}
            {yTicks.map(tick => {
              const y = yForCount(tick);
              return (
                <g key={tick}>
                  <line x1={chart.left} y1={y} x2={chart.right} y2={y} className="sales-profile-trend-gridline" />
                  <text x={chart.left - 10} y={y + 4} textAnchor="end" className="sales-profile-trend-axis-label">{tick}</text>
                </g>
              );
            })}
            <line x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} className="sales-profile-trend-axis" />
            <line x1={chart.left} y1={chart.bottom} x2={chart.right} y2={chart.bottom} className="sales-profile-trend-axis" />
            <text x={chart.left} y={12} className="sales-profile-trend-axis-title">Activities logged per month</text>
            {highlightedMonthIndex >= 0 && (
              <line
                x1={xForMonth(highlightedMonthIndex)}
                y1={chart.top}
                x2={xForMonth(highlightedMonthIndex)}
                y2={chart.bottom}
                className="sales-profile-trend-crosshair"
              />
            )}
            {months.map((month, index) => (
              <text
                key={month.key}
                x={xForMonth(index)}
                y={chart.bottom + 20}
                textAnchor="middle"
                className={`sales-profile-trend-x-label${highlightedMonthIndex === index ? ' is-selected' : ''}`}
              >
                {month.label}
              </text>
            ))}
            {activityTypes.map(type => {
              const points = months.map((month, index) => ({ x: xForMonth(index), y: yForCount(month.counts[type]) }));
              const linePath = createSmoothPath(points);
              const areaPath = points.length
                ? `${linePath} L ${points[points.length - 1].x} ${chart.bottom} L ${points[0].x} ${chart.bottom} Z`
                : '';
              const gradientId = `${chartId}-fill-${activityTypeClasses[type]}`;
              return (
                <g key={type}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activityTypeColors[type]} stopOpacity="0.12" />
                      <stop offset="100%" stopColor={activityTypeColors[type]} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill={`url(#${gradientId})`} />
                  <path
                    d={linePath}
                    className={`sales-profile-trend-line ${activityTypeClasses[type]}`}
                  />
                  {months.map((month, index) => {
                    const isEmphasized = highlightedMonthIndex === index
                      || (index === months.length - 1 && month.counts[type] > 0);
                    return (
                      <circle
                        key={month.key}
                        cx={xForMonth(index)}
                        cy={yForCount(month.counts[type])}
                        r={isEmphasized ? 4.5 : 3.5}
                        className={`sales-profile-trend-point ${activityTypeClasses[type]}${isEmphasized ? ' is-emphasized' : ''}`}
                      >
                        <title>{`${month.label} · ${activityTypeLabels[type]}: ${month.counts[type]}`}</title>
                      </circle>
                    );
                  })}
                </g>
              );
            })}
            {months.map((month, index) => (
              <rect
                key={month.key}
                x={chart.left + index * columnWidth}
                y={chart.top}
                width={columnWidth}
                height={chart.bottom - chart.top}
                fill="transparent"
                onMouseEnter={() => setHoveredMonth(month.key)}
              />
            ))}
                </svg>}
          {hoveredMonthBucket && (
            <div className="sales-profile-trend-tooltip" style={{ left: `${tooltipLeft}%` }} role="tooltip">
              <div className="sales-profile-trend-tooltip-heading">
                <strong>{new Date(`${hoveredMonthBucket.key}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</strong>
                <strong>{hoveredMonthBucket.total}</strong>
              </div>
              {activityTypes.filter(type => hoveredMonthBucket.counts[type] > 0).map(type => (
                <div className="sales-profile-trend-tooltip-row" key={type}>
                  <span><span className={`sales-profile-trend-dot ${activityTypeClasses[type]}`} />{activityTypeLabels[type]}</span>
                  <strong>{hoveredMonthBucket.counts[type]}</strong>
                </div>
              ))}
              {hoveredMonthBucket.total === 0 && <span className="sales-profile-trend-tooltip-empty">No activities recorded</span>}
            </div>
          )}
        </div>
      </div>

      {showMonthSelector && <div className="sales-profile-trend-months-scroll">
        <div
          className="sales-profile-trend-months"
          role="group"
          aria-label="Filter activities by month"
          style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`, minWidth: `${months.length * 96}px` }}
        >
          {months.map(month => {
            const breakdown = activityTypes
              .filter(type => month.counts[type] > 0)
              .map(type => `${activityTypeLabels[type]}: ${month.counts[type]}`)
              .join(', ');
            return (
              <button
                key={month.key}
                type="button"
                className={`sales-profile-trend-month${selectedMonth === month.key ? ' is-selected' : ''}`}
                aria-pressed={selectedMonth === month.key}
                aria-label={`${month.label}: ${month.total} ${month.total === 1 ? 'activity' : 'activities'}. ${breakdown || 'No activities'}. Select to filter the activity list.`}
                title={`${month.label}: ${month.total} ${month.total === 1 ? 'activity' : 'activities'}${breakdown ? ` (${breakdown})` : ''}`}
                onClick={() => onSelectMonth?.(selectedMonth === month.key ? null : month.key)}
              >
                <span className="sales-profile-trend-month-label">{month.label}</span>
                <span className="sales-profile-trend-total">{month.total}</span>
              </button>
            );
          })}
        </div>
      </div>}

      {selectedMonthBucket && (
        <div className="sales-profile-trend-breakdown">
          <div className="sales-profile-trend-breakdown-heading">
            <strong>{new Date(`${selectedMonthBucket.key}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</strong>
            <span>{selectedMonthBucket.total} {selectedMonthBucket.total === 1 ? 'activity' : 'activities'}</span>
          </div>
          {activityTypes.map(type => (
            <div className="sales-profile-trend-breakdown-row" key={type}>
              <span>{activityTypeLabels[type]}</span>
              <span className="sales-profile-trend-breakdown-track">
                <span
                  className={`sales-profile-trend-breakdown-fill ${activityTypeClasses[type]}`}
                  style={{ width: `${(selectedMonthBucket.counts[type] / selectedMonthMaxTypeCount) * 100}%` }}
                />
              </span>
              <strong>{selectedMonthBucket.counts[type]}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="sales-profile-trend-footer">
        <div className="sales-profile-trend-legend" aria-label="Activity types">
          {activityTypes.map(type => (
            <span key={type}>
              <span className={`sales-profile-trend-dot ${activityTypeClasses[type]}`} />
              {activityTypeLabels[type]}
            </span>
          ))}
        </div>
        {selectedMonth && (
          <button type="button" className="sales-text-link" onClick={() => onSelectMonth?.(null)}>
            Clear month filter
          </button>
        )}
      </div>
    </section>
  );
}
