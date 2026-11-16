import React, { useMemo, useState } from 'react';
import type { SalesActivityMonthlySummary } from '../../lib/api/types';
import { activityTypes, activityTypeClasses, activityTypeColors, activityTypeLabels, type ActivityType } from './activityChartConfig';

type ActivityRange = 3 | 6 | 12;

type ActivityMonth = {
  key: string;
  label: string;
  counts: Record<ActivityType, number>;
  total: number;
};

const ranges: ActivityRange[] = [3, 6, 12];
const chart = { width: 840, height: 280, left: 48, right: 824, top: 20, bottom: 238 };

function createMonths(
  range: ActivityRange,
  summary: SalesActivityMonthlySummary[],
  offset = 0,
): ActivityMonth[] {
  const now = new Date();
  const currentMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const months: ActivityMonth[] = [];

  for (let monthOffset = range - 1 + offset; monthOffset >= offset; monthOffset -= 1) {
    const date = new Date(currentMonth);
    date.setUTCMonth(date.getUTCMonth() - monthOffset);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      counts: { Call: 0, Email: 0, Meeting: 0, 'LinkedIn outreach': 0, 'Follow-up': 0 },
      total: 0,
    });
  }

  const monthByKey = new Map(months.map(month => [month.key, month]));
  for (const item of summary) {
    const month = monthByKey.get(item.month);
    if (!month) continue;
    month.counts[item.type] += item.count;
    month.total += item.count;
  }
  return months;
}

export function SalesActivityOverviewChart({
  summary,
  isAdmin,
  loading,
  error,
  onRetry,
}: {
  summary: SalesActivityMonthlySummary[];
  isAdmin: boolean;
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const [range, setRange] = useState<ActivityRange>(6);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const months = useMemo(() => createMonths(range, summary), [range, summary]);
  const previousMonths = useMemo(() => createMonths(range, summary, range), [range, summary]);
  const total = months.reduce((sum, month) => sum + month.total, 0);
  const previousTotal = previousMonths.reduce((sum, month) => sum + month.total, 0);
  const totalByType = activityTypes.map(type => ({
    type,
    count: months.reduce((sum, month) => sum + month.counts[type], 0),
  }));
  const topType = totalByType.reduce<(typeof totalByType)[number] | null>(
    (top, item) => item.count > (top?.count ?? 0) ? item : top,
    null,
  );
  const maxMonthTotal = Math.max(0, ...months.map(month => month.total));
  const yMax = Math.max(4, Math.ceil(maxMonthTotal / 4) * 4);
  const yTicks = Array.from({ length: 5 }, (_, index) => (yMax * index) / 4);
  const plotHeight = chart.bottom - chart.top;
  const columnWidth = (chart.right - chart.left) / months.length;
  const barWidth = Math.min(48, columnWidth * 0.56);
  const xForMonth = (index: number) => chart.left + ((index + 0.5) * (chart.right - chart.left)) / months.length;
  const yForCount = (count: number) => chart.bottom - (count / yMax) * plotHeight;
  const hoveredMonthIndex = months.findIndex(month => month.key === hoveredMonth);
  const hoveredMonthData = months.find(month => month.key === hoveredMonth) ?? null;
  const tooltipLeft = hoveredMonthIndex >= 0
    ? Math.max(20, Math.min(80, (xForMonth(hoveredMonthIndex) / chart.width) * 100))
    : 50;
  const changePercentage = previousTotal > 0
    ? Math.round(((total - previousTotal) / previousTotal) * 100)
    : null;
  const comparisonLabel = previousTotal === 0
    ? total > 0 ? `New activity vs previous ${range} months` : `No activity in previous ${range} months`
    : changePercentage === null || changePercentage === 0
      ? `No change vs previous ${range} months`
      : `${changePercentage > 0 ? 'Up' : 'Down'} ${Math.abs(changePercentage)}% vs previous ${range} months`;
  const activityNoun = isAdmin ? 'team interactions' : 'your interactions';
  const title = isAdmin ? 'Team sales activity' : 'Your sales activity';
  const description = isAdmin
    ? 'Monthly calls, emails, meetings, LinkedIn outreach, and follow-ups across Sales accounts.'
    : 'Your logged calls, emails, meetings, LinkedIn outreach, and follow-ups across your accounts.';

  return (
    <section className="sales-lift-card sales-overview-activity-chart" aria-labelledby="sales-overview-activity-title">
      <header className="sales-overview-activity-header">
        <div>
          <h2 id="sales-overview-activity-title">{title}</h2>
          <p>{description} Current month is month-to-date.</p>
        </div>
        <div className="sales-overview-activity-period" role="group" aria-label="Activity chart period">
          <span>Period</span>
          <div className="sales-overview-activity-period-options">
            {ranges.map(option => (
              <button
                type="button"
                key={option}
                aria-pressed={range === option}
                className={range === option ? 'is-selected' : ''}
                onClick={() => {
                  setRange(option);
                  setHoveredMonth(null);
                }}
              >
                {option} mo
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="sales-overview-activity-summary">
        <div><strong>{total}</strong><span>{activityNoun} in the last {range} months</span></div>
        {topType && topType.count > 0 && (
          <span className="sales-overview-activity-top-type">
            <i className={`sales-profile-trend-dot ${activityTypeClasses[topType.type]}`} />
            Most logged: <strong>{activityTypeLabels[topType.type]}</strong>
          </span>
        )}
        <span className={`sales-profile-trend-comparison${changePercentage !== null && changePercentage > 0 ? ' is-up' : changePercentage !== null && changePercentage < 0 ? ' is-down' : ''}`}>
          {comparisonLabel}
        </span>
      </div>

      <div className="sales-overview-activity-scroll" onMouseLeave={() => setHoveredMonth(null)}>
        <div className="sales-overview-activity-chart-area">
          {loading ? <div className="sales-overview-activity-state" role="status">Loading activity trend…</div>
            : error ? <div className="sales-overview-activity-state" role="alert">
              <span>{error}</span>
              <button className="sales-text-link" type="button" onClick={onRetry}>Try again</button>
            </div>
              : total === 0 ? <div className="sales-overview-activity-state" role="status">
                {isAdmin ? 'No sales activities have been logged in this period yet.' : 'You have no logged sales activities in this period yet.'}
              </div>
                : <svg
                  className="sales-overview-activity-svg"
                  viewBox={`0 0 ${chart.width} ${chart.height}`}
                  role="img"
                  aria-label={`${title}: stacked monthly sales activities for the last ${range} months`}
                >
                  {hoveredMonthIndex >= 0 && (
                    <rect
                      x={chart.left + hoveredMonthIndex * columnWidth}
                      y={chart.top}
                      width={columnWidth}
                      height={plotHeight}
                      rx={8}
                      className="sales-overview-activity-hover-column"
                    />
                  )}
                  {yTicks.map(tick => {
                    const y = yForCount(tick);
                    return (
                      <g key={tick}>
                        <line x1={chart.left} y1={y} x2={chart.right} y2={y} className="sales-overview-activity-gridline" />
                        <text x={chart.left - 10} y={y + 4} textAnchor="end" className="sales-overview-activity-axis-label">{tick}</text>
                      </g>
                    );
                  })}
                  <line x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} className="sales-overview-activity-axis" />
                  <line x1={chart.left} y1={chart.bottom} x2={chart.right} y2={chart.bottom} className="sales-overview-activity-axis" />
                  <text x={chart.left} y={12} className="sales-overview-activity-axis-title">Activities logged per month</text>
                  {months.map((month, index) => {
                    let stackedCount = 0;
                    return (
                      <g key={month.key}>
                        {activityTypes.map(type => {
                          const count = month.counts[type];
                          if (count === 0) return null;
                          const height = (count / yMax) * plotHeight;
                          const y = chart.bottom - ((stackedCount + count) / yMax) * plotHeight;
                          stackedCount += count;
                          return (
                            <rect
                              key={type}
                              x={xForMonth(index) - barWidth / 2}
                              y={y}
                              width={barWidth}
                              height={height}
                              fill={activityTypeColors[type]}
                              className="sales-overview-activity-bar-segment"
                            >
                              <title>{`${month.label} · ${activityTypeLabels[type]}: ${count}`}</title>
                            </rect>
                          );
                        })}
                        <text
                          x={xForMonth(index)}
                          y={chart.bottom + 20}
                          textAnchor="middle"
                          className={`sales-overview-activity-x-label${hoveredMonthIndex === index ? ' is-selected' : ''}`}
                        >
                          {month.label}
                        </text>
                      </g>
                    );
                  })}
                  {months.map((month, index) => (
                    <rect
                      key={month.key}
                      x={chart.left + index * columnWidth}
                      y={chart.top}
                      width={columnWidth}
                      height={plotHeight}
                      fill="transparent"
                      aria-label={`${month.label}: ${month.total} ${month.total === 1 ? 'activity' : 'activities'}`}
                      onMouseEnter={() => setHoveredMonth(month.key)}
                    />
                  ))}
                </svg>}
          {hoveredMonthData && !loading && !error && total > 0 && (
            <div className="sales-profile-trend-tooltip sales-overview-activity-tooltip" style={{ left: `${tooltipLeft}%` }} role="tooltip">
              <div className="sales-profile-trend-tooltip-heading">
                <strong>{new Date(`${hoveredMonthData.key}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</strong>
                <strong>{hoveredMonthData.total}</strong>
              </div>
              {activityTypes.filter(type => hoveredMonthData.counts[type] > 0).map(type => (
                <div className="sales-profile-trend-tooltip-row" key={type}>
                  <span><i className={`sales-profile-trend-dot ${activityTypeClasses[type]}`} />{activityTypeLabels[type]}</span>
                  <strong>{hoveredMonthData.counts[type]}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="sales-overview-activity-legend">
        {activityTypes.map(type => (
          <span key={type}>
            <i className={`sales-profile-trend-dot ${activityTypeClasses[type]}`} />
            {activityTypeLabels[type]}
          </span>
        ))}
      </footer>
    </section>
  );
}
