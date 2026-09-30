'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import {
  CANADA_COORDINATE,
  getRegionConfig,
  getRegionCountries,
  getCountryCoordinates,
  resolveCountryDisplayName,
} from '../../db/geo_metadata';

export default function GlobeViz({ 
  region, 
  onCountryClick,
  countryMetrics = [],
  selectedCountry,
}: { 
  region: string; 
  onCountryClick: (country: any) => void;
  countryMetrics?: any[];
  selectedCountry?: string | null;
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

  // Update camera when region changes
  useEffect(() => {
    if (globeEl.current && !selectedCountry) {
      const regionConfig = getRegionConfig(region);
      globeEl.current.pointOfView(regionConfig.cameraPOV, 1000);
    }
  }, [region, selectedCountry]);

  // Smoothly fly camera to selected country when selected from Sankey or Country Card
  useEffect(() => {
    if (globeEl.current && selectedCountry) {
      if (selectedCountry === 'Canada') {
        globeEl.current.pointOfView({ lat: CANADA_COORDINATE.lat, lng: CANADA_COORDINATE.lng, altitude: 2 }, 1000);
      } else {
        const coords = getCountryCoordinates(selectedCountry);
        if (coords) {
          globeEl.current.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 1.8 }, 1000);
        }
      }
    }
  }, [selectedCountry]);

  const targetCountries = useMemo(() => {
    if (countryMetrics && countryMetrics.length > 0) {
      return countryMetrics.map(c => c.country_name);
    }
    return getRegionCountries(region);
  }, [region, countryMetrics]);

  const getPolygonColor = (feat: any) => {
    const name = feat.properties.NAME || feat.properties.ADMIN;
    if (name === 'Canada') return '#F03A47';
    const resolved = resolveCountryDisplayName(name);
    if (selectedCountry && (name === selectedCountry || resolved === selectedCountry)) {
      return 'rgba(56, 189, 248, 0.6)';
    }
    if (targetCountries.includes(name) || targetCountries.includes(resolved)) {
      return 'rgba(0, 180, 255, 0.2)';
    }
    return 'rgba(255, 255, 255, 0.05)';
  };

  const arcsData = useMemo(() => {
    if (countryMetrics && countryMetrics.length > 0) {
      const topTargets = countryMetrics
        .filter(c => c.currentValue > 0)
        .map(c => ({
          name: c.country_name,
          value: c.currentValue,
          coords: getCountryCoordinates(c.country_name),
        }))
        .filter(item => item.coords !== null)
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      if (topTargets.length > 0) {
        return topTargets.map(t => ({
          startLat: CANADA_COORDINATE.lat,
          startLng: CANADA_COORDINATE.lng,
          endLat: t.coords!.lat,
          endLng: t.coords!.lng,
          color: '#F03A47',
        }));
      }
    }

    // Default fallback arcs derived from top regional metadata countries
    const fallbackCountryNames = getRegionCountries(region).slice(0, 3);
    return fallbackCountryNames
      .map(name => getCountryCoordinates(name))
      .filter((coords): coords is { lat: number; lng: number } => coords !== null)
      .map(coords => ({
        startLat: CANADA_COORDINATE.lat,
        startLng: CANADA_COORDINATE.lng,
        endLat: coords.lat,
        endLng: coords.lng,
        color: '#F03A47',
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
        const name = polygon.properties.NAME || polygon.properties.ADMIN;
        onCountryClick(resolveCountryDisplayName(name));
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
