import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DashboardTour.css';

/* ─── Tour step definitions ─── */
const TOUR_STEPS = [
    {
        target: '[data-tour="welcome"]',
        title: 'Welcome to Aegis 👋',
        body: 'This is your home screen. It gives you a quick overview of your mental wellness journey — your mood, progress, and tools — all in one place.',
        position: 'bottom',
    },
    {
        target: '[data-tour="quick-access"]',
        title: 'Quick Access Tools 🧩',
        body: 'These shortcuts let you quickly jump to a risk assessment, guided breathing, coping habits, journaling, or crisis resources — whatever you need.',
        position: 'bottom',
    },
    {
        target: '[data-tour="mood-log"]',
        title: 'Daily Mood Check-in 😊',
        body: 'Log how you\'re feeling each day with a single tap. Over time, this builds a picture of your emotional trends so you can spot patterns.',
        position: 'right',
    },
    {
        target: '[data-tour="sidebar"]',
        title: 'Your Wellness Snapshot 📊',
        body: 'This sidebar shows your current risk level, wellness score, helpful tools, and personalised AI coping suggestions — all based on your data.',
        position: 'left',
    },
    {
        target: '[data-tour="nav-assess"]',
        title: 'Start an Assessment 🩺',
        body: 'Whenever you\'re ready, begin a mental health check-in here. It\'s a calm, guided process — one question at a time, at your own pace.',
        position: 'bottom',
    },
    {
        target: '[data-tour="nav-history"]',
        title: 'Assessment History 📂',
        body: 'Review your past assessments and track changes over time. This helps you and any professional you work with see how things are progressing.',
        position: 'bottom',
    },
    {
        target: '[data-tour="nav-profile"]',
        title: 'Profile & Settings ⚙️',
        body: 'Update your name, view your account details, and replay this tour anytime from your profile page.',
        position: 'bottom',
    },
];

const STORAGE_KEY = 'aegis_tour_completed';

/* ═══════════════════════════════════════════
   DashboardTour Component
   All positioning is viewport-relative (fixed)
   ═══════════════════════════════════════════ */
const DashboardTour = ({ active, onComplete }) => {
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState(null);      // viewport-relative bounding rect
    const [visible, setVisible] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const tooltipRef = useRef(null);

    const currentStep = TOUR_STEPS[step];
    const isFirst = step === 0;
    const isLast = step === TOUR_STEPS.length - 1;

    /* ── Measure target element (viewport coords) ── */
    const recalculate = useCallback(() => {
        if (!active) return;
        const el = document.querySelector(currentStep.target);
        if (!el) { setRect(null); return; }
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, [active, currentStep]);

    /* ── On step change: scroll into view → measure ── */
    useEffect(() => {
        if (!active) { setVisible(false); return; }

        const el = document.querySelector(currentStep.target);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }

        // Wait for scroll to settle, then measure
        const timer = setTimeout(() => {
            recalculate();
            setVisible(true);
            setTransitioning(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [active, step]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Re-measure on resize / scroll ── */
    useEffect(() => {
        if (!active || !visible) return;
        const handler = () => recalculate();
        window.addEventListener('resize', handler);
        window.addEventListener('scroll', handler);
        return () => {
            window.removeEventListener('resize', handler);
            window.removeEventListener('scroll', handler);
        };
    }, [active, visible, recalculate]);

    /* ── Actions ── */
    const finish = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setVisible(false);
        setStep(0);
        onComplete?.();
    };

    const skip = () => finish();

    const goToStep = (nextStep) => {
        setTransitioning(true);
        setVisible(false);
        // Brief delay to allow fade-out, then change step (which triggers scroll + measure)
        setTimeout(() => setStep(nextStep), 200);
    };

    const next = () => goToStep(Math.min(step + 1, TOUR_STEPS.length - 1));
    const back = () => goToStep(Math.max(step - 1, 0));

    if (!active) return null;

    /* ── Spotlight cutout (viewport coords) ── */
    const pad = 12;
    const spotlight = rect
        ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
        : null;

    /* ── Tooltip position (viewport coords, clamped to screen) ── */
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipW = 360;
    let tooltipStyle = { opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' };

    if (rect && visible) {
        const pos = currentStep.position || 'bottom';
        let top, left;

        if (pos === 'bottom') {
            top = rect.top + rect.height + pad + 12;
            left = rect.left + rect.width / 2 - tooltipW / 2;
        } else if (pos === 'top') {
            top = rect.top - pad - 12;
            left = rect.left + rect.width / 2 - tooltipW / 2;
        } else if (pos === 'left') {
            top = rect.top + rect.height / 2 - 90;
            left = rect.left - pad - tooltipW - 12;
        } else if (pos === 'right') {
            top = rect.top + rect.height / 2 - 90;
            left = rect.left + rect.width + pad + 12;
        }

        // Clamp so tooltip stays on screen
        left = Math.max(12, Math.min(left, vw - tooltipW - 12));
        top = Math.max(12, Math.min(top, vh - 280));

        // If tooltip would overlap the spotlight on top position, flip to bottom
        if (pos === 'top' && top + 260 > rect.top) {
            top = rect.top + rect.height + pad + 12;
        }

        tooltipStyle = { ...tooltipStyle, top, left };
    }

    return (
        <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Dashboard guided tour">
            {/* Fixed SVG covering the viewport with a cut-out for the spotlight */}
            <svg className="tour-svg-mask" viewBox={`0 0 ${vw} ${vh}`} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <mask id="tour-spotlight-mask">
                        <rect x="0" y="0" width={vw} height={vh} fill="white" />
                        {spotlight && (
                            <rect
                                x={spotlight.left}
                                y={spotlight.top}
                                width={spotlight.width}
                                height={spotlight.height}
                                rx="14"
                                ry="14"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>

                {/* Dimmed backdrop */}
                <rect
                    x="0" y="0"
                    width={vw} height={vh}
                    fill="rgba(0, 0, 0, 0.72)"
                    mask="url(#tour-spotlight-mask)"
                />

                {/* Glowing border around the spotlight */}
                {spotlight && (
                    <rect
                        x={spotlight.left}
                        y={spotlight.top}
                        width={spotlight.width}
                        height={spotlight.height}
                        rx="14"
                        ry="14"
                        fill="none"
                        stroke="var(--accent-secondary)"
                        strokeWidth="2"
                        className="tour-spotlight-glow"
                    />
                )}
            </svg>

            {/* Tooltip card (fixed, viewport-relative) */}
            {visible && !transitioning && (
                <div
                    className="tour-tooltip glass-card"
                    style={tooltipStyle}
                    ref={tooltipRef}
                >
                    {/* Step indicator dots */}
                    <div className="tour-dots">
                        {TOUR_STEPS.map((_, i) => (
                            <span key={i} className={`tour-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
                        ))}
                    </div>

                    <h3 className="tour-title">{currentStep.title}</h3>
                    <p className="tour-body">{currentStep.body}</p>

                    {/* Navigation controls */}
                    <div className="tour-controls">
                        <button className="tour-skip-btn" onClick={skip} type="button">
                            Skip tour
                        </button>
                        <div className="tour-nav-btns">
                            {!isFirst && (
                                <button className="tour-back-btn" onClick={back} type="button">
                                    ← Back
                                </button>
                            )}
                            {isLast ? (
                                <button className="tour-next-btn tour-finish-btn" onClick={finish} type="button">
                                    Finish ✓
                                </button>
                            ) : (
                                <button className="tour-next-btn" onClick={next} type="button">
                                    Next →
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="tour-step-counter">
                        {step + 1} of {TOUR_STEPS.length}
                    </p>
                </div>
            )}
        </div>
    );
};

export { STORAGE_KEY };
export default DashboardTour;
