'use client';

import React, { useMemo } from 'react';
import styles from './GlobeFallback.module.css';

interface GlobeFallbackProps {
  region: string;
  onCountryClick: (countryName: string) => void;
  countryMetrics?: any[];
  selectedCountry?: string | null;
  onSwitchToSankey?: () => void;
}

function formatShortCad(val: number): string {
  if (val >= 1_000_000_000) {
    return `$${(val / 1_000_000_000).toFixed(1)}B`;
  }
  return `$${(val / 1_000_000).toFixed(0)}M`;
}

export default function GlobeFallback({
  region,
  onCountryClick,
  countryMetrics = [],
  selectedCountry,
  onSwitchToSankey,
}: GlobeFallbackProps) {
  // Select top partner countries in active region for the telemetry orbital display
  const partners = useMemo(() => {
    if (!countryMetrics || countryMetrics.length === 0) return [];
    return countryMetrics
      .filter(c => c && c.currentValue > 0)
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 8);
  }, [countryMetrics]);

  // Distribute partners along an elliptical orbit
  const orbitalNodes = useMemo(() => {
    const total = partners.length;
    if (total === 0) return [];

    const rx = 360; // Horizontal radius
    const ry = 190; // Vertical radius
    const centerX = 480;
    const centerY = 260;

    return partners.map((p, idx) => {
      // Angle distribution with offset so nodes don't overlap top/bottom HUD
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2 + 0.3;
      const x = centerX + rx * Math.cos(angle);
      const y = centerY + ry * Math.sin(angle);
      return {
        ...p,
        x,
        y,
        centerX,
        centerY,
      };
    });
  }, [partners]);

  return (
    <div className={styles.fallbackContainer}>
      {/* 2D Telemetry notification header */}
      <div className={styles.telemetryBanner}>
        <div className={styles.statusIndicator}>
          <span className={styles.statusPulse} />
          <span>2D MACRO TELEMETRY</span>
        </div>
        <div className={styles.bannerDivider} />
        <span className={styles.bannerText}>
          WebGL disabled — Interactive 2D flows active
        </span>
        {onSwitchToSankey && (
          <button
            type="button"
            className={styles.bannerActionBtn}
            onClick={onSwitchToSankey}
          >
            Open Sankey View →
          </button>
        )}
      </div>

      {/* Decorative cosmic orbital rings */}
      <div className={styles.orbitalGrid}>
        <div className={`${styles.orbitalRing} ${styles.ring1}`} />
        <div className={`${styles.orbitalRing} ${styles.ring2}`} />
        <div className={`${styles.orbitalRing} ${styles.ring3}`} />
      </div>

      {/* Interactive 2D Telemetry Corridor Area */}
      <div className={styles.telemetryArea}>
        <svg
          viewBox="0 0 960 520"
          className={styles.svgMapOverlay}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F03A47" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#00B4D8" stopOpacity={0.4} />
            </linearGradient>
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {orbitalNodes.map(node => {
            const isSelected = selectedCountry === node.country_name;
            const midX = (node.centerX + node.x) / 2;
            const midY = (node.centerY + node.y) / 2 - 35;
            const d = `M ${node.centerX} ${node.centerY} Q ${midX} ${midY} ${node.x} ${node.y}`;

            return (
              <g key={`corridor-${node.country_code}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={isSelected ? '#38BDF8' : 'url(#corridorGrad)'}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  strokeDasharray={isSelected ? 'none' : '4 4'}
                  opacity={isSelected ? 1 : 0.65}
                  filter={isSelected ? 'url(#laserGlow)' : undefined}
                />
              </g>
            );
          })}
        </svg>

        {/* Central Canada Origin Hub */}
        <div
          className={styles.canadaHub}
          onClick={() => onCountryClick('Canada')}
          title="Click to view Canada Macro Context"
        >
          <div className={styles.canadaBeacon}>
            <span style={{ fontSize: '18px' }}>🍁</span>
          </div>
          <span className={styles.canadaBeaconLabel}>Canada</span>
        </div>

        {/* Orbiting Destination Nodes */}
        {orbitalNodes.map(node => {
          const isSelected = selectedCountry === node.country_name;
          const leftPct = (node.x / 960) * 100;
          const topPct = (node.y / 520) * 100;

          return (
            <div
              key={`node-${node.country_code}`}
              className={`${styles.partnerNode} ${isSelected ? styles.partnerNodeSelected : ''}`}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              onClick={() => onCountryClick(node.country_name)}
              title={`View ${node.country_name} Trade Intelligence`}
            >
              <div className={styles.partnerDot}>
                {node.country_code}
              </div>
              <div className={styles.partnerLabel}>
                {node.country_name}
                <div className={styles.partnerValue}>
                  {formatShortCad(node.currentValue)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
