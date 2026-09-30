'use client';

import React, { useMemo, useState } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './SankeyViz.module.css';

interface SankeyVizProps {
  countryMetrics: any[];
  region: string;
  selectedCountry?: string | null;
  onSelectCountry?: (country: string | null) => void;
}

const FRIENDLY_NAMES: Record<string, string> = {
  'United Kingdom': 'UK',
  'Rest of South America': 'Rest of SA',
  'South Korea': 'S. Korea',
  'New Zealand': 'N. Zealand',
};

function getShortName(name: string, maxLen = 13): string {
  if (FRIENDLY_NAMES[name]) return FRIENDLY_NAMES[name];
  if (name.length <= maxLen) return name;
  return `${name.substring(0, maxLen - 1)}…`;
}

function formatCad(val: number): string {
  if (val >= 1_000_000_000) {
    return `$${(val / 1_000_000_000).toFixed(2)}B`;
  }
  return `$${(val / 1_000_000).toFixed(1)}M`;
}

function getGrowthColor(growth: number | undefined): string {
  if (typeof growth !== 'number') return '#00B4D8';
  if (growth >= 5) return '#10B981'; // Emerald - strong expansion
  if (growth <= -5) return '#F59E0B'; // Amber - contraction (Red is strictly reserved for Canada)
  return '#00B4D8'; // Cyan - steady / modest
}

export default function SankeyViz({
  countryMetrics,
  region,
  selectedCountry,
  onSelectCountry,
}: SankeyVizProps) {
  const [density, setDensity] = useState<'8' | '15' | 'all'>('8');
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Compute aggregated total and structured nodes/links
  const { sankeyData, regionalTotal, nodePadding } = useMemo(() => {
    if (!countryMetrics || countryMetrics.length === 0) {
      return { sankeyData: { nodes: [], links: [] }, regionalTotal: 0, nodePadding: 6 };
    }

    const validMetrics = countryMetrics.filter(c => c && c.currentValue > 0);
    const sorted = [...validMetrics].sort((a, b) => b.currentValue - a.currentValue);
    const total = sorted.reduce((sum, c) => sum + c.currentValue, 0);

    const limit = density === '8' ? 8 : (density === '15' ? 15 : sorted.length);
    const topTargets = sorted.slice(0, limit);
    const rest = sorted.slice(limit);

    const nodes: any[] = [
      {
        name: 'Canada',
        isCanada: true,
        value: total,
        share: 100,
        color: '#F03A47',
      },
    ];

    const links: any[] = [];
    let otherTotal = 0;

    topTargets.forEach((c, index) => {
      const share = total > 0 ? (c.currentValue / total) * 100 : 0;
      const color = getGrowthColor(c.growthPercentage);
      nodes.push({
        name: c.country_name,
        code: c.country_code,
        value: c.currentValue,
        share,
        growth: c.growthPercentage,
        calculationType: c.calculationType,
        color,
      });
      links.push({
        source: 0,
        target: index + 1,
        value: c.currentValue,
        targetName: c.country_name,
        targetColor: color,
        calculationType: c.calculationType,
      });
    });

    rest.forEach(c => {
      otherTotal += c.currentValue;
    });

    if (otherTotal > 0) {
      const otherShare = total > 0 ? (otherTotal / total) * 100 : 0;
      const otherIdx = nodes.length;
      nodes.push({
        name: 'Other',
        isOther: true,
        value: otherTotal,
        share: otherShare,
        growth: undefined,
        color: '#94A3B8',
      });
      links.push({
        source: 0,
        target: otherIdx,
        value: otherTotal,
        targetName: 'Other',
        targetColor: '#94A3B8',
      });
    }

    const padding = density === '8' ? 6 : (density === '15' ? 3 : 2);

    return { sankeyData: { nodes, links }, regionalTotal: total, nodePadding: padding };
  }, [countryMetrics, density]);

  const activeFocusCountry = hoveredCountry || selectedCountry;

  // Custom link renderer with dynamic SVG linear gradients and hover/selection awareness
  const renderCustomLink = (props: any) => {
    const {
      sourceX,
      sourceY,
      sourceControlX,
      targetX,
      targetY,
      targetControlX,
      linkWidth,
      index,
      payload,
    } = props;

    if (!linkWidth || linkWidth <= 0) return <path d="" />;

    const targetNode = payload?.target;
    const targetName = targetNode?.name;
    const isOther = targetName === 'Other';
    const isSelected = selectedCountry && targetName === selectedCountry;
    const isHovered = hoveredCountry && targetName === hoveredCountry;
    const isAnyActive = !!activeFocusCountry;

    let linkOpacity = 0.38;
    if (isAnyActive) {
      if (isSelected || isHovered) {
        linkOpacity = 0.9;
      } else {
        linkOpacity = 0.08;
      }
    }

    const d = `M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`;
    const gradId = `sankey-grad-${region}-${index}`;

    return (
      <path
        key={`sankey-link-${index}`}
        className="recharts-sankey-link"
        d={d}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={Math.max(linkWidth, isSelected || isHovered ? 2.5 : 1.5)}
        strokeOpacity={linkOpacity}
        style={{
          cursor: isOther ? 'default' : 'pointer',
          transition: 'stroke-opacity 0.2s ease, stroke-width 0.2s ease',
        }}
        onClick={() => {
          if (!isOther && onSelectCountry) {
            onSelectCountry(targetName);
          }
        }}
        onMouseEnter={() => setHoveredCountry(targetName)}
        onMouseLeave={() => setHoveredCountry(null)}
      />
    );
  };

  // Custom node renderer with status coloring, smart labels and click selection
  const renderCustomNode = ({ x, y, width, height, payload }: any) => {
    const isCanada = payload.isCanada || payload.name === 'Canada';
    const isOther = payload.isOther || payload.name === 'Other';
    const targetName = payload.name;
    const isSelected = selectedCountry && targetName === selectedCountry;
    const isHovered = hoveredCountry && targetName === hoveredCountry;
    const isAnyActive = !!activeFocusCountry;

    let nodeOpacity = 1;
    if (isAnyActive && !isCanada) {
      if (isSelected || isHovered) {
        nodeOpacity = 1;
      } else {
        nodeOpacity = 0.28;
      }
    }

    const nodeColor = isCanada ? '#F03A47' : (payload.color || 'rgba(0, 180, 255, 0.8)');
    const displayName = isCanada ? 'Canada' : getShortName(targetName);
    const shareText = typeof payload.share === 'number' ? `${payload.share.toFixed(1)}%` : '';

    // Smart collision guard: show text if node height >= 12px or if node is hovered/selected
    const showLabel = isCanada || height >= 12 || isHovered || isSelected;

    return (
      <g
        style={{
          cursor: isOther ? 'default' : 'pointer',
          opacity: nodeOpacity,
          transition: 'opacity 0.2s ease',
        }}
        onClick={() => {
          if (!isOther && onSelectCountry) {
            onSelectCountry(targetName);
          }
        }}
        onMouseEnter={() => setHoveredCountry(targetName)}
        onMouseLeave={() => setHoveredCountry(null)}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={nodeColor}
          rx={3}
          stroke={isSelected ? '#FFFFFF' : (isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)')}
          strokeWidth={isSelected ? 2 : 0.8}
        />
        {showLabel && (
          <text
            x={isCanada ? x - 8 : x + width + 8}
            y={y + height / 2}
            textAnchor={isCanada ? 'end' : 'start'}
            alignmentBaseline="middle"
            fill={isSelected ? '#38BDF8' : '#F1F5F9'}
            fontSize={isCanada ? 12 : 11}
            fontWeight={isSelected ? 600 : 500}
            fontFamily="inherit"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {displayName}
            {!isCanada && shareText && (
              <tspan fill="rgba(148, 163, 184, 0.9)" fontSize={10} dx={4}>
                {shareText}
              </tspan>
            )}
          </text>
        )}
      </g>
    );
  };

  // Glassmorphic HUD Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const isLink = !!(data.source && data.target);
    const targetNode = isLink ? data.target : data;
    const countryName = targetNode.name;
    const isCanada = countryName === 'Canada';
    const value = isLink ? data.value : targetNode.value;
    const share = targetNode.share;
    const growth = targetNode.growth;

    let growthClass = styles.tooltipGrowthNeutral;
    if (typeof growth === 'number') {
      growthClass = growth >= 0 ? styles.tooltipGrowthPos : styles.tooltipGrowthNeg;
    }

    return (
      <div className={styles.tooltipCard}>
        <div className={styles.tooltipHeader}>
          {isCanada ? 'Canada Total Regional Outflow' : `Canada ➔ ${countryName}`}
        </div>
        <div className={styles.tooltipValue}>
          {formatCad(value)} CAD
        </div>
        {!isCanada && (
          <div className={styles.tooltipMetaRow}>
            {typeof share === 'number' && (
              <span className={styles.tooltipBadge}>
                {share.toFixed(1)}% of Regional
              </span>
            )}
            {typeof growth === 'number' && (
              <span className={`${styles.tooltipGrowth} ${growthClass}`}>
                {growth >= 0 ? `▲ +${growth.toFixed(1)}%` : `▼ ${growth.toFixed(1)}%`} {targetNode.calculationType || 'YoY'}
              </span>
            )}
          </div>
        )}
        {countryName !== 'Other' && !isCanada && (
          <div className={styles.tooltipHint}>
            ✦ Click to inspect on 3D Globe & open Card
          </div>
        )}
        {isCanada && (
          <div className={styles.tooltipHint}>
            ✦ Click to inspect Canada National Profile
          </div>
        )}
      </div>
    );
  };

  const hasData = sankeyData.nodes.length > 0 && sankeyData.links.length > 0;

  return (
    <div className={styles.container}>
      {/* Header with Title, Regional Total, and Adaptive Density Controls */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3 className={styles.title}>
            Export Flow ({region === 'EUD' ? 'European' : 'Indo-Pacific'})
          </h3>
          <div className={styles.subTitle}>
            {hasData ? `${formatCad(regionalTotal)} CAD Regional Outflow` : 'Aggregating metrics…'}
          </div>
        </div>
        <div className={styles.densityToggle}>
          {(['8', '15', 'all'] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`${styles.densityBtn} ${density === d ? styles.densityBtnActive : ''}`}
              onClick={() => setDensity(d)}
              title={d === 'all' ? 'Show all trade partners' : `Display top ${d} partners`}
            >
              {d === 'all' ? 'All' : `Top ${d}`}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Sankey Diagram Area */}
      <div className={styles.chartWrapper}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
            <Sankey
              data={sankeyData}
              node={renderCustomNode}
              link={renderCustomLink}
              nodePadding={nodePadding}
              margin={{ left: 55, right: 105, top: 10, bottom: 10 }}
            >
              <defs>
                {sankeyData.links.map((link: any, i: number) => {
                  const targetColor = link.targetColor || '#00B4D8';
                  return (
                    <linearGradient
                      key={`sankey-link-grad-${region}-${i}`}
                      id={`sankey-grad-${region}-${i}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#F03A47" />
                      <stop offset="100%" stopColor={targetColor} />
                    </linearGradient>
                  );
                })}
              </defs>
              <Tooltip content={<CustomTooltip />} />
            </Sankey>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '12px' }}>
            No export data for current parameters
          </div>
        )}
      </div>

      {/* Sleek Context Legend */}
      <div className={styles.legendBar}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#10B981' }} />
          <span>Growing (&gt;5%)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#00B4D8' }} />
          <span>Stable</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#F59E0B' }} />
          <span>Declining</span>
        </div>
        <div className={styles.legendItem} style={{ color: '#38BDF8' }}>
          <span>Click to select</span>
        </div>
      </div>
    </div>
  );
}
