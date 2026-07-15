import React, { useState, useRef, useEffect, useMemo } from 'react';
import './DatePicker.css';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DatePicker = ({ value, onChange, disabled, id, placeholder = 'Select date of birth' }) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Parse initial value
    const parsedInit = value ? new Date(value + 'T00:00:00') : null;
    const [viewMonth, setViewMonth] = useState(parsedInit ? parsedInit.getMonth() : today.getMonth());
    const [viewYear, setViewYear] = useState(parsedInit ? parsedInit.getFullYear() : today.getFullYear() - 20);
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('day'); // 'day' | 'month' | 'year'
    const [yearRangeStart, setYearRangeStart] = useState(Math.floor((parsedInit ? parsedInit.getFullYear() : today.getFullYear() - 20) / 12) * 12);

    const wrapperRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
                setMode('day');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Sync view when value changes externally
    useEffect(() => {
        if (value) {
            const d = new Date(value + 'T00:00:00');
            setViewMonth(d.getMonth());
            setViewYear(d.getFullYear());
        }
    }, [value]);

    /* ── Day grid ── */
    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

        const cells = [];

        // Previous month trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            cells.push({ day: daysInPrev - i, current: false, dateStr: null });
        }

        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            const mm = String(viewMonth + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            cells.push({ day: d, current: true, dateStr: `${viewYear}-${mm}-${dd}` });
        }

        // Next month leading days
        const remaining = 42 - cells.length; // 6 rows × 7
        for (let d = 1; d <= remaining; d++) {
            cells.push({ day: d, current: false, dateStr: null });
        }

        return cells;
    }, [viewMonth, viewYear]);

    /* ── Navigation ── */
    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const selectDay = (dateStr) => {
        if (!dateStr) return;
        // Don't allow future dates
        if (dateStr > todayStr) return;
        onChange(dateStr);
        setOpen(false);
        setMode('day');
    };

    const selectMonth = (monthIdx) => {
        setViewMonth(monthIdx);
        setMode('day');
    };

    const selectYear = (year) => {
        setViewYear(year);
        setMode('month');
    };

    /* ── Display value ── */
    const displayValue = value
        ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    return (
        <div className="dp-wrapper" ref={wrapperRef}>
            {/* Trigger input */}
            <div
                className={`form-input dp-trigger ${open ? 'dp-trigger-active' : ''} ${disabled ? 'dp-disabled' : ''}`}
                onClick={() => { if (!disabled) setOpen(o => !o); }}
                id={id}
                tabIndex={0}
                role="button"
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <span className={displayValue ? 'dp-value' : 'dp-placeholder'}>
                    {displayValue || placeholder}
                </span>
                <svg className="dp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>

            {/* Calendar dropdown */}
            {open && (
                <div className="dp-dropdown glass-card">
                    {/* ── HEADER ── */}
                    <div className="dp-header">
                        <button type="button" className="dp-nav-btn" onClick={() => {
                            if (mode === 'year') setYearRangeStart(s => s - 12);
                            else if (mode === 'month') setViewYear(y => y - 1);
                            else prevMonth();
                        }}>‹</button>

                        <button
                            type="button"
                            className="dp-header-label"
                            onClick={() => {
                                if (mode === 'day') setMode('month');
                                else if (mode === 'month') { setMode('year'); setYearRangeStart(Math.floor(viewYear / 12) * 12); }
                            }}
                        >
                            {mode === 'day' && `${MONTHS[viewMonth]} ${viewYear}`}
                            {mode === 'month' && `${viewYear}`}
                            {mode === 'year' && `${yearRangeStart} – ${yearRangeStart + 11}`}
                        </button>

                        <button type="button" className="dp-nav-btn" onClick={() => {
                            if (mode === 'year') setYearRangeStart(s => s + 12);
                            else if (mode === 'month') setViewYear(y => y + 1);
                            else nextMonth();
                        }}>›</button>
                    </div>

                    {/* ── DAY VIEW ── */}
                    {mode === 'day' && (
                        <>
                            <div className="dp-day-names">
                                {DAYS.map(d => <span key={d}>{d}</span>)}
                            </div>
                            <div className="dp-grid dp-day-grid">
                                {calendarDays.map((cell, i) => {
                                    const isSelected = cell.dateStr && cell.dateStr === value;
                                    const isToday = cell.dateStr === todayStr;
                                    const isFuture = cell.dateStr && cell.dateStr > todayStr;
                                    return (
                                        <button
                                            type="button"
                                            key={i}
                                            disabled={!cell.current || isFuture}
                                            className={`dp-cell ${!cell.current ? 'dp-cell-outside' : ''} ${isSelected ? 'dp-cell-selected' : ''} ${isToday ? 'dp-cell-today' : ''} ${isFuture ? 'dp-cell-disabled' : ''}`}
                                            onClick={() => selectDay(cell.dateStr)}
                                        >
                                            {cell.day}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ── MONTH VIEW ── */}
                    {mode === 'month' && (
                        <div className="dp-grid dp-month-grid">
                            {MONTHS.map((m, i) => (
                                <button
                                    type="button"
                                    key={m}
                                    className={`dp-cell dp-cell-lg ${i === viewMonth ? 'dp-cell-selected' : ''}`}
                                    onClick={() => selectMonth(i)}
                                >
                                    {m.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── YEAR VIEW ── */}
                    {mode === 'year' && (
                        <div className="dp-grid dp-year-grid">
                            {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(y => (
                                <button
                                    type="button"
                                    key={y}
                                    disabled={y > today.getFullYear()}
                                    className={`dp-cell dp-cell-lg ${y === viewYear ? 'dp-cell-selected' : ''} ${y > today.getFullYear() ? 'dp-cell-disabled' : ''}`}
                                    onClick={() => selectYear(y)}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Quick jump to Today ── */}
                    <div className="dp-footer">
                        <button
                            type="button"
                            className="dp-today-btn"
                            onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); setMode('day'); }}
                        >
                            Today
                        </button>
                        {value && (
                            <button type="button" className="dp-clear-btn" onClick={() => { onChange(''); setOpen(false); }}>
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
