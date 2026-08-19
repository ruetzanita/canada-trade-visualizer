'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';

export default function GlobeViz({ 
  region, 
  onCountryClick,
  countryMetrics = []
}: { 
  region: string; 
  onCountryClick: (country: any) => void;
  countryMetrics?: any[];
}) {
  const globeEl = useRef<any>(null);
  const [countries, setCountries] = useState({ features: [] });

  useEffect(() => {
    fetch('/assets/globe/ne_110m_admin_0_countries.geojson')
      .then(res => {
        if (!res.ok) throw new Error('Local asset missing');
        return res.json();
      })
      .catch(() => {
        return fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson').then(r => r.json());
      })
      .then(setCountries)
      .catch(err => console.error('Failed to load GeoJSON data:', err));
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      // Rotate camera based on region
      if (region === 'EUD') {
        globeEl.current.pointOfView({ lat: 50, lng: 10, altitude: 1.5 }, 1000);
      } else {
        globeEl.current.pointOfView({ lat: 15, lng: 105, altitude: 1.8 }, 1000);
      }
    }
  }, [region]);

  const targetCountries = useMemo(() => {
    if (region === 'EUD') {
      return [
        'Germany', 'United Kingdom', 'France', 'Italy', 'Ukraine', 'Austria',
        'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark',
        'Estonia', 'Finland', 'Greece', 'Hungary', 'Ireland', 'Latvia',
        'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal',
        'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
        'Norway', 'Iceland', 'Liechtenstein'
      ];
    }
    return [
      'China', 'India', 'South Korea', 'Indonesia', 'Philippines', 'Thailand',
      'Taiwan', 'Hong Kong', 'Bangladesh', 'Australia', 'Brunei', 'Japan',
      'Malaysia', 'Mexico', 'New Zealand', 'Peru', 'Singapore', 'Vietnam',
      'Chile', 'Brazil',
      'Argentina', 'Bolivia', 'Colombia', 'Ecuador', 'Paraguay', 'Uruguay', 'Venezuela'
    ];
  }, [region]);

  const getPolygonColor = (feat: any) => {
    const name = feat.properties.NAME || feat.properties.ADMIN;
    if (name === 'Canada') return '#F03A47';
    if (targetCountries.includes(name)) return 'rgba(0, 180, 255, 0.2)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  const arcsData = useMemo(() => {
    const canadaCoord = { lat: 56.13, lng: -106.34 };
    const countryCoords: Record<string, { lat: number; lng: number }> = {
      'Germany': { lat: 51.16, lng: 10.45 },
      'United Kingdom': { lat: 55.37, lng: -3.43 },
      'France': { lat: 46.22, lng: 2.21 },
      'Italy': { lat: 41.87, lng: 12.56 },
      'Netherlands': { lat: 52.13, lng: 5.29 },
      'Spain': { lat: 40.46, lng: -3.75 },
      'Switzerland': { lat: 46.81, lng: 8.22 },
      'Norway': { lat: 60.47, lng: 8.46 },
      'Ukraine': { lat: 48.37, lng: 31.16 },
      'Belgium': { lat: 50.50, lng: 4.46 },
      'Poland': { lat: 51.91, lng: 19.14 },
      'Sweden': { lat: 60.12, lng: 18.64 },

      'China': { lat: 35.86, lng: 104.19 },
      'Japan': { lat: 36.20, lng: 138.25 },
      'South Korea': { lat: 35.90, lng: 127.76 },
      'India': { lat: 20.59, lng: 78.96 },
      'Australia': { lat: -25.27, lng: 133.77 },
      'Indonesia': { lat: -0.78, lng: 113.92 },
      'Vietnam': { lat: 14.05, lng: 108.27 },
      'Philippines': { lat: 12.87, lng: 121.77 },
      'Thailand': { lat: 15.87, lng: 100.99 },
      'Taiwan': { lat: 23.69, lng: 120.96 },
      'Singapore': { lat: 1.35, lng: 103.81 },
      'Malaysia': { lat: 4.21, lng: 101.97 },
      'Rest of South America': { lat: -14.23, lng: -51.92 },
      'Brazil': { lat: -14.23, lng: -51.92 }
    };

    if (countryMetrics && countryMetrics.length > 0) {
      const topTargets = countryMetrics
        .filter(c => c.currentValue > 0 && countryCoords[c.country_name])
        .sort((a, b) => b.currentValue - a.currentValue)
        .slice(0, 6);

      if (topTargets.length > 0) {
        return topTargets.map(t => ({
          startLat: canadaCoord.lat,
          startLng: canadaCoord.lng,
          endLat: countryCoords[t.country_name].lat,
          endLng: countryCoords[t.country_name].lng,
          color: '#F03A47'
        }));
      }
    }

    // Default static fallback arcs if no metrics available yet
    const fallbackTargets = region === 'EUD' 
      ? [{ lat: 51.16, lng: 10.45 }, { lat: 55.37, lng: -3.43 }, { lat: 46.22, lng: 2.21 }]
      : [{ lat: 35.86, lng: 104.19 }, { lat: 20.59, lng: 78.96 }, { lat: -25.27, lng: 133.77 }];
      
    return fallbackTargets.map(t => ({
      startLat: canadaCoord.lat,
      startLng: canadaCoord.lng,
      endLat: t.lat,
      endLng: t.lng,
      color: '#F03A47'
    }));
  }, [region, countryMetrics]);

  return (
    <Globe
      ref={globeEl}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      polygonsData={countries.features}
      polygonAltitude={0.01}
      polygonCapColor={getPolygonColor}
      polygonSideColor={() => 'rgba(0, 100, 200, 0.05)'}
      polygonStrokeColor={() => '#111'}
      onPolygonClick={(polygon: any) => {
        let name = polygon.properties.NAME || polygon.properties.ADMIN;
        const ROSA = ['Argentina', 'Bolivia', 'Colombia', 'Ecuador', 'Paraguay', 'Uruguay', 'Venezuela'];
        if (ROSA.includes(name)) {
          name = 'Rest of South America';
        }
        onCountryClick(name);
      }}
      arcsData={arcsData}
      arcColor="color"
      arcDashLength={0.4}
      arcDashGap={4}
      arcDashInitialGap={() => Math.random() * 5}
      arcDashAnimateTime={2000}
      backgroundColor="#0B0D17"
    />
  );
}
