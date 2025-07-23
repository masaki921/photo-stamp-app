
export type ProcessingStatus = 'idle' | 'reading' | 'geocoding' | 'drawing' | 'ready' | 'error';

export interface ExifData {
  GPSLatitude?: number[];
  GPSLongitude?: number[];
  GPSLatitudeRef?: string;
  GPSLongitudeRef?: string;
  DateTimeOriginal?: string;
  Orientation?: number;
}

export interface GeoAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

export interface GeoResult {
    address_components: GeoAddressComponent[];
    formatted_address: string;
}

export interface GeoResponse {
    results: GeoResult[];
    status: string;
}

// For Google Places API
export interface Place {
    displayName: { text: string; languageCode?: string };
    types: string[];
    rating?: number;
    userRatingCount?: number;
    location: { latitude: number; longitude: number };
}
