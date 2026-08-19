'use client';

import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

export default function SankeyViz({ countryMetrics, region }: { countryMetrics: any[], region: string }) {
  const sankeyData = useMemo(() => {
    if (!countryMetrics || countryMetrics.length === 0) return { nodes: [], links: [] };

    // Filter out zero and negative values which crash the Sankey, and sort descending
    const validMetrics = countryMetrics.filter(c => c.currentValue > 0);
    const sorted = [...validMetrics].sort((a, b) => b.currentValue - a.currentValue);

    const nodes = [{ name: 'Canada' }];
    const links = [];

    // Top 20 logic
    const top20 = sorted.slice(0, 20);
    const rest = sorted.slice(20);

    let otherTotal = 0;

    top20.forEach((c, index) => {
      nodes.push({ name: c.country_name });
      links.push({
        source: 0,
        target: index + 1,
        value: c.currentValue
      });
    });

    rest.forEach(c => {
      otherTotal += c.currentValue;
    });

    if (otherTotal > 0) {
      nodes.push({ name: 'Other' });
      links.push({
        source: 0,
        target: top20.length + 1,
        value: otherTotal
      });
    }

    return { nodes, links };
  }, [countryMetrics]);

  if (!sankeyData.nodes.length || !sankeyData.links.length) return null;

  // Custom node rendering for aesthetic
  const renderCustomNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
    const isCanada = payload.name === 'Canada';
    
    // Stagger text on the right side to prevent vertical overlap
    let textX = isCanada ? x - 6 : x + width + 6;
    if (!isCanada && index % 2 === 0) {
      textX += 30; // Push alternating labels slightly out
    }

    const displayName = payload.name && payload.name.length > 20 
      ? `${payload.name.substring(0, 18)}…` 
      : payload.name;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={isCanada ? '#F03A47' : 'rgba(0, 180, 255, 0.6)'}
          fillOpacity="1"
        />
        <text
          x={textX}
          y={y + height / 2}
          textAnchor={isCanada ? 'end' : 'start'}
          alignmentBaseline="middle"
          fill="#E2E8F0"
          fontSize="12"
          fontFamily="var(--font-sans)"
        >
          {displayName}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#0B0D17', padding: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', borderRadius: '4px' }}>
          <strong>{data.source?.name} → {data.target?.name}</strong>
          <br/>
          ${(data.value / 1000000).toFixed(2)}M
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#aaa', marginBottom: '10px', marginTop: 0, letterSpacing: '1px' }}>
        Export Flow: {region === 'EUD' ? 'European' : 'Indo-Pacific'} Market
      </h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            node={renderCustomNode}
            nodePadding={4}
            margin={{ left: 80, right: 140, top: 10, bottom: 10 }}
            link={{ stroke: 'rgba(255,255,255,0.1)' }}
          >
            <Tooltip content={<CustomTooltip />} />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
