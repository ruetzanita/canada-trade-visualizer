'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { X, Play, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import styles from './page.module.css';

// Dynamically import components so they only render on client
const GlobeViz = dynamic(() => import('./components/GlobeViz'), { 
  ssr: false,
  loading: () => <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#555', zIndex: 0 }}>Loading Globe Visualization...</div>
});
const SankeyViz = dynamic(() => import('./components/SankeyViz'), { ssr: false });

export default function Dashboard() {
  const [region, setRegion] = useState('EUD');
  const [year, setYear] = useState(2026);
  const [fetchYear, setFetchYear] = useState(2026);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryData, setCountryData] = useState<any>(null);
  const [macroValue, setMacroValue] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [globalChartData, setGlobalChartData] = useState<any[]>([]);
  const [allCountryMetrics, setAllCountryMetrics] = useState<any[]>([]);
  const [isCardCollapsed, setIsCardCollapsed] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'globe' | 'sankey'>('globe');

  // Fetch API data when fetchYear or region changes
  useEffect(() => {
    // Calling the backend API implemented earlier
    fetch(`/api/country-metrics?year=${fetchYear}&region=${region}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          // Calculate macro value (Total for target market vs Canada absolute)
          // Simplified for now based on API response
          const total = data.data.reduce((acc: number, curr: any) => acc + curr.currentValue, 0);
          setMacroValue(total);
          setAllCountryMetrics(data.data);
          
          if (data.chartData) {
            setChartData(data.chartData);
          }
          if (data.globalChartData) {
            setGlobalChartData(data.globalChartData);
          }
        }
      })
      .catch(err => console.error("Error fetching metrics:", err));
  }, [fetchYear, region]);

  // Dynamically update countryData without a database re-fetch
  useEffect(() => {
    if (selectedCountry) {
      const found = allCountryMetrics.find((d: any) => d.country_name === selectedCountry);
      setCountryData(found || null);
    } else {
      setCountryData(null);
    }
  }, [selectedCountry, allCountryMetrics]);

  // Specific 200 word context for Canada Card exception
  const canadaContextParagraphs = [
    "Canada's global export dynamics are experiencing a profound structural shift as we navigate post-pandemic supply chain realignment and an accelerating clean energy transition.",
    "While traditional commodity exports like mineral fuels and agricultural products remain foundational, there is a strategic pivot towards high-value advanced manufacturing, critical minerals, and green technologies. This diversification strategy is central to mitigating risks associated with geopolitical volatility.",
    "By strengthening trade infrastructure and forging deeper economic partnerships through modernized FTAs—such as CETA in Europe and the CPTPP in the Indo-Pacific—Canada is cementing its role as a reliable, tier-one supplier of the resources and technologies critical to the 21st-century economy.",
    "As the global economy fragments into regional blocs, our export strategy balances maintaining baseline commodity flows with aggressive expansion into emerging sectors. The focus on 'friend-shoring' and resilient supply chains directly benefits Canadian exporters, driving job creation and robust macroeconomic growth.",
    "Moving forward, sustained investment in innovation and trade capacity will be vital to capitalizing on these evolving global market opportunities and securing long-term economic prosperity for all Canadians across every sector and region."
  ];

  const validGlobalChartData = React.useMemo(() => {
    const validData = [];
    for (let i = 0; i < globalChartData.length; i++) {
      if (i > 0) {
        const prevValue = globalChartData[i - 1].value;
        const currValue = globalChartData[i].value;
        if (prevValue > 0 && currValue < prevValue * 0.2) {
          // Drops by > 80% compared to the previous month, indicating dummy data
          break;
        }
      }
      validData.push(globalChartData[i]);
    }
    return validData;
  }, [globalChartData]);

  return (
    <div className={styles.container}>
      {showSplash && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(11, 13, 23, 0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <h1 className="title" style={{ fontSize: '48px', marginBottom: '20px' }}>Canada Macro Trade</h1>
          <p style={{ fontSize: '18px', maxWidth: '600px', textAlign: 'center', color: '#ccc', lineHeight: 1.6, marginBottom: '40px' }}>
            Welcome to the interactive visualization of Canada's global export dynamics. Use the timeline scrubber to explore macroeconomic trade shifts across the European and Indo-Pacific markets.
          </p>
          <button 
            style={{ background: '#F03A47', color: 'white', border: 'none', padding: '16px 32px', fontSize: '18px', fontWeight: 'bold', borderRadius: '30px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            onClick={() => setShowSplash(false)}
          >
            Enter Dashboard
          </button>
        </div>
      )}

      {/* 3D Globe Background */}
      <div className={`${activeMobileView === 'sankey' ? styles.hideOnMobile : ''}`}>
        <GlobeViz region={region} onCountryClick={setSelectedCountry} countryMetrics={allCountryMetrics} />
      </div>

      {/* Header Chart & HUD */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          MACRO DYNAMICS
        </div>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={validGlobalChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" hide />
              <ReferenceArea 
                x1={`${year}01`} 
                x2={
                  validGlobalChartData
                    .filter(d => String(d.month).startsWith(String(year)))
                    .map(d => String(d.month))
                    .sort()
                    .pop() || `${year}12`
                } 
                fill="rgba(240, 58, 71, 0.3)" 
              />
              <Area type="step" dataKey="value" stroke="rgba(255,255,255,0.8)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorValue)" activeDot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.headerYear}>
          {year}
        </div>
      </header>

      {/* Timeline Slider */}
      <div className={`${styles.timeline} ${styles.glassPanel}`}>
        <div className={styles.timelineRow} style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', fontSize: '14px', color: '#aaa', marginBottom: '8px' }}>
          {[2021, 2022, 2023, 2024, 2025, 2026].map(y => (
            <span key={y} style={{ color: year === y ? '#F03A47' : '#aaa', fontWeight: year === y ? 'bold' : 'normal' }}>{y}</span>
          ))}
        </div>
        <input 
          type="range" 
          min="2021" 
          max="2026" 
          step="1" 
          value={year} 
          onChange={(e) => setYear(parseInt(e.target.value))}
          onMouseUp={(e) => setFetchYear(parseInt((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => setFetchYear(parseInt((e.target as HTMLInputElement).value))}
          className={styles.timelineInput}
        />
      </div>

      {/* HUD Side Panel - Top Left */}
      <div className={`${styles.sidePanel} ${styles.glassPanel} ${activeMobileView === 'sankey' ? styles.hideOnMobile : ''}`}>
        <div className={styles.panelTitle}>Target Market Portion</div>
        <div>
          <p className={styles.macroValue} style={{ marginBottom: '4px' }}>
            ${(validGlobalChartData.filter(d => String(d.month).startsWith(year.toString())).reduce((acc, curr) => acc + curr.value, 0) / 1000000000).toFixed(2)}B
            <span style={{ fontSize: '14px', color: '#aaa', fontWeight: 'normal', display: 'block', textTransform: 'uppercase', marginTop: '2px' }}>Total Global Exports</span>
          </p>
          <p className={styles.macroValue} style={{ fontSize: '24px', color: '#00b4ff', marginTop: '12px' }}>
            ${(macroValue / 1000000000).toFixed(2)}B
            <span style={{ fontSize: '12px', color: '#aaa', fontWeight: 'normal', display: 'block', textTransform: 'uppercase', marginTop: '2px' }}>{region === 'EUD' ? 'European' : 'Indo-Pacific'} Target Market</span>
          </p>
        </div>
      </div>

      {/* Country Card (Center Bottom) */}
      {selectedCountry && (
        <div className={`${styles.countryCard} ${styles.glassPanel} ${selectedCountry === 'Canada' ? styles.canadaCard : ''} ${styles['animate-fade-in']} ${activeMobileView === 'sankey' ? styles.hideOnMobile : ''}`}>
          <div className={styles.cardHeaderButtons}>
            <button className={styles.collapseBtn} onClick={() => setIsCardCollapsed(!isCardCollapsed)}>
              {isCardCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
            <button className={styles.closeBtn} onClick={() => setSelectedCountry(null)}>
              <X size={20} />
            </button>
          </div>
          
          <h2 className={`title ${styles.countryTitle}`}>{selectedCountry}</h2>
          
          <div className={`${styles.cardBody} ${isCardCollapsed ? styles.cardBodyHidden : ''}`}>
            <div className={styles.cardBodyInner}>
              {selectedCountry === 'Canada' ? (
                <div className={styles.countryCopyScrollable}>
                  {canadaContextParagraphs.map((paragraph, idx) => {
                    const splitIndex = paragraph.indexOf('. ');
                    if (splitIndex !== -1) {
                      const firstSentence = paragraph.substring(0, splitIndex + 1);
                      const restOfParagraph = paragraph.substring(splitIndex + 1);
                      return (
                        <p key={idx} className={styles.canadaParagraph}>
                          <strong>{firstSentence}</strong> {restOfParagraph}
                        </p>
                      );
                    }
                    return <p key={idx} className={styles.canadaParagraph}><strong>{paragraph}</strong></p>;
                  })}
                </div>
              ) : (
                <>
                  {countryData && (
                    <>
                      <div className={styles.metricRow}>
                        <span style={{ color: '#aaa', fontSize: '13px', textTransform: 'uppercase' }}>Total {year} Value</span>
                        <span className={styles.metricValue}>${(countryData.currentValue / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className={styles.metricRow}>
                        <span style={{ color: '#aaa', fontSize: '13px', textTransform: 'uppercase' }}>{countryData.calculationType} Growth</span>
                        <span className={`${styles.metricValue} ${countryData.growthPercentage >= 0 ? styles.growthPositive : styles.growthNegative}`}>
                          {countryData.growthPercentage >= 0 ? '+' : ''}{countryData.growthPercentage.toFixed(2)}%
                        </span>
                      </div>
                      
                      {countryData.context && (
                        <>
                          <div className={styles.countryCopy}>
                            {countryData.context.historical_background}
                          </div>
                          <div className={styles.tradeFocus}>
                            <h4>Deals and Disruptions</h4>
                            <p>{countryData.context.deals_and_disruptions?.[year] || "No major deals or disruptions recorded for this year."}</p>
                          </div>
                          <div className={styles.topImports}>
                            <h4>Top 5 Major Imports from Canada</h4>
                            <ul>
                              {countryData.context.top_5_commodities?.map((c: string, i: number) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                          {countryData.context.source_link && (
                            <div className={styles.sourceLinkContainer}>
                              <a href={countryData.context.source_link} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                                <span>View Official Source</span>
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {!countryData && (
                    <div style={{ color: '#aaa', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                      Loading metrics...
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sankey Diagram (Bottom Right) */}
      <div className={`${styles.sankeyContainer} ${styles.glassPanel} ${activeMobileView === 'sankey' ? styles.sankeyMobileVisible : styles.hideOnMobile}`}>
        <SankeyViz countryMetrics={allCountryMetrics} region={region} />
      </div>

      {/* Bottom Title Bar */}
      <div className={`${styles.bottomBar} ${styles.glassPanel}`}>
        <div className={styles.bottomBarText}>
          <h3 className={`title ${styles.mainTitle}`}>Canada Global Export Dynamics - {region === 'EUD' ? 'European' : 'Indo Pacific'}</h3>
          <p className={styles.explainerText}>
            This is an overview of the current and recent historic trade market as Canada pushes into the {region === 'EUD' ? 'European Union and surrounding allied nations' : 'dynamic, high-growth Indo-Pacific basin'}.
          </p>
        </div>
        <div className={styles.bottomControls}>
          <div className={styles.regionToggle}>
            <button 
              className={`${styles.toggleBtn} ${region === 'EUD' ? styles.active : ''}`}
              onClick={() => setRegion('EUD')}
            >
              European
            </button>
            <button 
              className={`${styles.toggleBtn} ${region === 'IPD' ? styles.active : ''}`}
              onClick={() => setRegion('IPD')}
            >
              Indo-Pacific
            </button>
          </div>
          
          <div className={styles.mobileViewToggleInline}>
            <button 
              className={`${styles.toggleBtn} ${activeMobileView === 'globe' ? styles.active : ''}`}
              onClick={() => setActiveMobileView('globe')}
            >
              Globe
            </button>
            <button 
              className={`${styles.toggleBtn} ${activeMobileView === 'sankey' ? styles.active : ''}`}
              onClick={() => setActiveMobileView('sankey')}
            >
              Sankey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
