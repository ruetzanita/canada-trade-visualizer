export interface RegionConfig {
  code: string;
  label: string;
  marketName: string;
  fullTitle: string;
  description: string;
  cameraPOV: {
    lat: number;
    lng: number;
    altitude: number;
  };
}

export interface CountryCoordinate {
  lat: number;
  lng: number;
  iso: string;
  region: 'EUD' | 'IPD' | 'NAFTA' | 'OTHER';
}

export const CANADA_COORDINATE: { lat: number; lng: number } = {
  lat: 56.13,
  lng: -106.34,
};

export const REST_OF_SOUTH_AMERICA = [
  'Argentina',
  'Bolivia',
  'Colombia',
  'Ecuador',
  'Paraguay',
  'Uruguay',
  'Venezuela',
];

export function isRestOfSouthAmerica(name: string): boolean {
  return REST_OF_SOUTH_AMERICA.includes(name);
}

export function resolveCountryDisplayName(name: string): string {
  if (isRestOfSouthAmerica(name)) {
    return 'Rest of South America';
  }
  return name;
}

export const REGION_CONFIGS: Record<string, RegionConfig> = {
  EUD: {
    code: 'EUD',
    label: 'European',
    marketName: 'European Target Market',
    fullTitle: 'Canada Global Export Dynamics - European',
    description:
      'This is an overview of the current and recent historic trade market as Canada pushes into the European Union and surrounding allied nations under CETA and bilateral agreements.',
    cameraPOV: { lat: 50, lng: 10, altitude: 1.5 },
  },
  IPD: {
    code: 'IPD',
    label: 'Indo-Pacific',
    marketName: 'Indo-Pacific Target Market',
    fullTitle: 'Canada Global Export Dynamics - Indo-Pacific',
    description:
      'This is an overview of the current and recent historic trade market as Canada pushes into the dynamic, high-growth Indo-Pacific basin and associated strategic partner markets.',
    cameraPOV: { lat: 15, lng: 105, altitude: 1.8 },
  },
  NAFTA: {
    code: 'NAFTA',
    label: 'North America',
    marketName: 'North American Market',
    fullTitle: 'Canada Global Export Dynamics - North American Corridors',
    description:
      'Foundational cross-border integration and supply-chain flows across the continental CUSMA/USMCA trade corridor.',
    cameraPOV: { lat: 40, lng: -98, altitude: 1.6 },
  },
};

export const COUNTRY_COORDINATES: Record<string, CountryCoordinate> = {
  // --- North America / Canada ---
  'Canada': { lat: 56.13, lng: -106.34, iso: 'CA', region: 'NAFTA' },
  'United States': { lat: 37.09, lng: -95.71, iso: 'US', region: 'NAFTA' },
  'Mexico': { lat: 23.63, lng: -102.55, iso: 'MX', region: 'IPD' },

  // --- European Union & EFTA (EUD) ---
  'Austria': { lat: 47.51, lng: 14.55, iso: 'AT', region: 'EUD' },
  'Belgium': { lat: 50.50, lng: 4.46, iso: 'BE', region: 'EUD' },
  'Bulgaria': { lat: 42.73, lng: 25.48, iso: 'BG', region: 'EUD' },
  'Croatia': { lat: 45.10, lng: 15.20, iso: 'HR', region: 'EUD' },
  'Cyprus': { lat: 35.12, lng: 33.42, iso: 'CY', region: 'EUD' },
  'Czechia': { lat: 49.81, lng: 15.47, iso: 'CZ', region: 'EUD' },
  'Denmark': { lat: 56.26, lng: 9.50, iso: 'DK', region: 'EUD' },
  'Estonia': { lat: 58.59, lng: 25.01, iso: 'EE', region: 'EUD' },
  'Finland': { lat: 61.92, lng: 25.74, iso: 'FI', region: 'EUD' },
  'France': { lat: 46.22, lng: 2.21, iso: 'FR', region: 'EUD' },
  'Germany': { lat: 51.16, lng: 10.45, iso: 'DE', region: 'EUD' },
  'Greece': { lat: 39.07, lng: 21.82, iso: 'GR', region: 'EUD' },
  'Hungary': { lat: 47.16, lng: 19.50, iso: 'HU', region: 'EUD' },
  'Iceland': { lat: 64.96, lng: -19.02, iso: 'IS', region: 'EUD' },
  'Ireland': { lat: 53.14, lng: -7.69, iso: 'IE', region: 'EUD' },
  'Italy': { lat: 41.87, lng: 12.56, iso: 'IT', region: 'EUD' },
  'Latvia': { lat: 56.87, lng: 24.60, iso: 'LV', region: 'EUD' },
  'Liechtenstein': { lat: 47.16, lng: 9.55, iso: 'LI', region: 'EUD' },
  'Lithuania': { lat: 55.16, lng: 23.88, iso: 'LT', region: 'EUD' },
  'Luxembourg': { lat: 49.81, lng: 6.12, iso: 'LU', region: 'EUD' },
  'Malta': { lat: 35.93, lng: 14.37, iso: 'MT', region: 'EUD' },
  'Netherlands': { lat: 52.13, lng: 5.29, iso: 'NL', region: 'EUD' },
  'Norway': { lat: 60.47, lng: 8.46, iso: 'NO', region: 'EUD' },
  'Poland': { lat: 51.91, lng: 19.14, iso: 'PL', region: 'EUD' },
  'Portugal': { lat: 39.39, lng: -8.22, iso: 'PT', region: 'EUD' },
  'Romania': { lat: 45.94, lng: 24.96, iso: 'RO', region: 'EUD' },
  'Slovakia': { lat: 48.66, lng: 19.69, iso: 'SK', region: 'EUD' },
  'Slovenia': { lat: 46.15, lng: 14.99, iso: 'SI', region: 'EUD' },
  'Spain': { lat: 40.46, lng: -3.75, iso: 'ES', region: 'EUD' },
  'Sweden': { lat: 60.12, lng: 18.64, iso: 'SE', region: 'EUD' },
  'Switzerland': { lat: 46.81, lng: 8.22, iso: 'CH', region: 'EUD' },
  'Ukraine': { lat: 48.37, lng: 31.16, iso: 'UA', region: 'EUD' },
  'United Kingdom': { lat: 55.37, lng: -3.43, iso: 'GB', region: 'EUD' },

  // --- Indo-Pacific & Trans-Pacific (IPD) ---
  'Australia': { lat: -25.27, lng: 133.77, iso: 'AU', region: 'IPD' },
  'Bangladesh': { lat: 23.68, lng: 90.35, iso: 'BD', region: 'IPD' },
  'Brunei': { lat: 4.53, lng: 114.72, iso: 'BN', region: 'IPD' },
  'China': { lat: 35.86, lng: 104.19, iso: 'CN', region: 'IPD' },
  'Hong Kong': { lat: 22.31, lng: 114.16, iso: 'HK', region: 'IPD' },
  'India': { lat: 20.59, lng: 78.96, iso: 'IN', region: 'IPD' },
  'Indonesia': { lat: -0.78, lng: 113.92, iso: 'ID', region: 'IPD' },
  'Japan': { lat: 36.20, lng: 138.25, iso: 'JP', region: 'IPD' },
  'Malaysia': { lat: 4.21, lng: 101.97, iso: 'MY', region: 'IPD' },
  'New Zealand': { lat: -40.90, lng: 174.88, iso: 'NZ', region: 'IPD' },
  'Philippines': { lat: 12.87, lng: 121.77, iso: 'PH', region: 'IPD' },
  'Singapore': { lat: 1.35, lng: 103.81, iso: 'SG', region: 'IPD' },
  'South Korea': { lat: 35.90, lng: 127.76, iso: 'KR', region: 'IPD' },
  'Taiwan': { lat: 23.69, lng: 120.96, iso: 'TW', region: 'IPD' },
  'Thailand': { lat: 15.87, lng: 100.99, iso: 'TH', region: 'IPD' },
  'Vietnam': { lat: 14.05, lng: 108.27, iso: 'VN', region: 'IPD' },

  // --- Latin America / Indo-Pacific Basin (IPD) ---
  'Brazil': { lat: -14.23, lng: -51.92, iso: 'BR', region: 'IPD' },
  'Chile': { lat: -35.67, lng: -71.54, iso: 'CL', region: 'IPD' },
  'Peru': { lat: -9.19, lng: -75.01, iso: 'PE', region: 'IPD' },
  'Rest of South America': { lat: -14.23, lng: -51.92, iso: 'ROSA', region: 'IPD' },
  'Argentina': { lat: -38.41, lng: -63.61, iso: 'AR', region: 'IPD' },
  'Bolivia': { lat: -16.29, lng: -63.58, iso: 'BO', region: 'IPD' },
  'Colombia': { lat: 4.57, lng: -74.29, iso: 'CO', region: 'IPD' },
  'Ecuador': { lat: -1.83, lng: -78.18, iso: 'EC', region: 'IPD' },
  'Paraguay': { lat: -23.44, lng: -58.44, iso: 'PY', region: 'IPD' },
  'Uruguay': { lat: -32.52, lng: -55.76, iso: 'UY', region: 'IPD' },
  'Venezuela': { lat: 6.42, lng: -66.58, iso: 'VE', region: 'IPD' },
};

export function getCountryCoordinates(countryName: string): { lat: number; lng: number } | null {
  const resolved = resolveCountryDisplayName(countryName);
  if (COUNTRY_COORDINATES[resolved]) {
    return {
      lat: COUNTRY_COORDINATES[resolved].lat,
      lng: COUNTRY_COORDINATES[resolved].lng,
    };
  }
  return null;
}

export function getCountryRegion(countryName: string): 'EUD' | 'IPD' | 'NAFTA' | 'OTHER' | null {
  const resolved = resolveCountryDisplayName(countryName);
  return COUNTRY_COORDINATES[resolved]?.region || null;
}

export function getRegionConfig(regionCode: string): RegionConfig {
  return (
    REGION_CONFIGS[regionCode] || {
      code: regionCode,
      label: regionCode,
      marketName: `${regionCode} Market`,
      fullTitle: `Canada Global Export Dynamics - ${regionCode}`,
      description: `Macroeconomic trade visualization for ${regionCode} region.`,
      cameraPOV: { lat: 30, lng: 0, altitude: 2.0 },
    }
  );
}

export function getRegionCountries(regionCode: string): string[] {
  return Object.entries(COUNTRY_COORDINATES)
    .filter(([name, data]) => name !== 'Canada' && data.region === regionCode)
    .map(([name]) => name);
}

