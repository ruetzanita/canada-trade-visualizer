'use client';

import React, { useMemo } from 'react';

interface HeaderMacroChartProps {
  data: { month: string | number; value: number }[];
  year: number;
}

export default function HeaderMacroChart({ data, year }: HeaderMacroChartProps) {
  const chartGeometry = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value);
    const maxVal = Math.max(...values) * 1.05;
    const minVal = Math.min(...values) * 0.95;
    const range = maxVal - minVal || 1;

    const width = 1000;
    const height = 45;
    const paddingY = 4;
    const usableHeight = height - paddingY * 2;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const normalizedY = (d.value - minVal) / range;
      const y = height - paddingY - normalizedY * usableHeight;
      return { x, y, month: String(d.month) };
    });

    // Step area path construction
    let stepLine = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      stepLine += ` L ${curr.x},${prev.y} L ${curr.x},${curr.y}`;
    }

    const areaPath = `${stepLine} L ${width},${height} L 0,${height} Z`;

    // Calculate active year reference highlight box
    const yearStr = String(year);
    const yearIndices = points
      .map((p, idx) => (p.month.startsWith(yearStr) ? idx : -1))
      .filter(idx => idx !== -1);

    let highlightRect = null;
    if (yearIndices.length > 0) {
      const firstIdx = yearIndices[0];
      const lastIdx = yearIndices[yearIndices.length - 1];
      const startX = points[firstIdx].x;
      const endX = lastIdx < points.length - 1 ? points[lastIdx + 1].x : width;
      highlightRect = {
        x: startX,
        width: Math.max(endX - startX, 8),
      };
    }

    return { areaPath, stepLine, highlightRect, width, height };
  }, [data, year]);

  if (!chartGeometry) {
    return null;
  }

  return (
    <svg
      viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="headerMacroGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
      </defs>

      {chartGeometry.highlightRect && (
        <rect
          x={chartGeometry.highlightRect.x}
          y={0}
          width={chartGeometry.highlightRect.width}
          height={chartGeometry.height}
          fill="rgba(240, 58, 71, 0.3)"
        />
      )}

      <path
        d={chartGeometry.areaPath}
        fill="url(#headerMacroGradient)"
        style={{ pointerEvents: 'none' }}
      />
      <path
        d={chartGeometry.stepLine}
        fill="none"
        stroke="rgba(255, 255, 255, 0.8)"
        strokeWidth={1.5}
        style={{ pointerEvents: 'none' }}
      />
    </svg>
  );
}
