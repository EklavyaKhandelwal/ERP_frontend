import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

type CalendarPosition = { top: number; left: number; width: number };

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
    ? date
    : null;
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  const date = parseDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function sameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const EmployeeJoinDateField: React.FC<Props> = ({ value, onChange }) => {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [today] = useState(() => new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseDate(value) ?? new Date();
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });
  const [position, setPosition] = useState<CalendarPosition | null>(null);
  const selectedDate = parseDate(value);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(visibleMonth);
  const firstDayOffset = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const daysInPreviousMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 0).getDate();
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    if (day < 1) {
      return {
        date: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, daysInPreviousMonth + day),
        inMonth: false,
      };
    }
    if (day > daysInMonth) {
      return {
        date: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, day - daysInMonth),
        inMonth: false,
      };
    }
    return { date: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day), inMonth: true };
  });

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (wrapperRef.current?.contains(target) || calendarRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const bounds = triggerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const width = Math.min(320, window.innerWidth - 16);
      const height = 330;
      const below = window.innerHeight - bounds.bottom - 8;
      const above = bounds.top - 8;
      const top = below < height && above > below
        ? Math.max(8, bounds.top - Math.min(height, above) - 4)
        : bounds.bottom + 4;
      setPosition({
        top,
        left: Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8)),
        width,
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const openCalendar = () => {
    const selected = parseDate(value) ?? new Date();
    setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setIsOpen(true);
  };

  const chooseDate = (date: Date) => {
    onChange(toDateValue(date));
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setIsOpen(false);
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={`${id}-trigger`}>Join Date *</label>
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <button
          ref={triggerRef}
          id={`${id}-trigger`}
          type="button"
          className="form-control"
          aria-required="true"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? `${id}-calendar` : undefined}
          aria-label={`Join date${value ? `, ${formatDate(value)}` : ''}`}
          onClick={openCalendar}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left',
            background: '#FFFFFF',
            cursor: 'pointer',
            color: value ? 'var(--text-main)' : 'var(--text-muted)',
          }}
        >
          <span>{formatDate(value) || 'Select join date'}</span>
          <CalendarDays size={16} color="var(--text-muted)" aria-hidden="true" />
        </button>
      </div>
      {isOpen && position && createPortal(
        <div
          ref={calendarRef}
          id={`${id}-calendar`}
          role="dialog"
          aria-label="Choose join date"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: position.width,
            padding: '16px',
            border: '1px solid var(--border-light)',
            borderRadius: '14px',
            background: '#FFFFFF',
            boxShadow: 'var(--shadow-modal)',
            zIndex: 2200,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{monthLabel}</strong>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                aria-label="Previous month"
                className="btn btn-secondary btn-sm"
                onClick={() => setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                style={{ padding: '6px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next month"
                className="btn btn-secondary btn-sm"
                onClick={() => setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                style={{ padding: '6px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px', textAlign: 'center' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
              <span key={day} aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]} style={{ padding: '5px 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}>
                {day}
              </span>
            ))}
            {days.map(({ date, inMonth }) => {
              const isSelected = selectedDate ? sameDay(date, selectedDate) : false;
              const isToday = sameDay(date, today);
              return (
                <button
                  key={toDateValue(date)}
                  type="button"
                  aria-label={new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(date)}
                  aria-pressed={isSelected}
                  onClick={() => chooseDate(date)}
                  style={{
                    height: '34px',
                    border: isToday && !isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                    borderRadius: '9px',
                    background: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : inMonth ? 'var(--text-main)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: isSelected || isToday ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {selectedDate ? `Selected: ${formatDate(value)}` : 'Choose the employee start date'}
            </span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => chooseDate(today)} style={{ color: 'var(--primary)' }}>
              Today
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
