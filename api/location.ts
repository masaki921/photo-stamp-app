// This is a serverless function that acts as a secure backend.
// It should be placed in the /api directory of your project.

interface GeoAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

interface GeoResult {
    address_components: GeoAddressComponent[];
    formatted_address: string;
}

interface GeoResponse {
    results: GeoResult[];
    status: string;
}

interface Place {
    displayName: { text: string; languageCode?: string };
    types: string[];
    userRatingCount?: number;
    location: { latitude: number; longitude: number };
}

interface LocationParts {
    country?: string;
    prefecture?: string;
    city?: string;
    specificPlace?: string;
}

const API_KEY = process.env.API_KEY; // Securely read API key from environment variables
const GEOCODE_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchNearby';


const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in metres
    const toRad = (value: number) => (value * Math.PI) / 180;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in metres
};

const fetchTouristAttraction = async (lat: number, lng: number): Promise<string | null> => {
    try {
        const response = await fetch(PLACES_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY!,
                'X-Goog-FieldMask': 'places.displayName,places.types,places.userRatingCount,places.location',
            },
            body: JSON.stringify({
                includedTypes: ["tourist_attraction"],
                maxResultCount: 3,
                languageCode: "ja",
                rankPreference: "DISTANCE",
                locationRestriction: {
                    circle: {
                        center: { latitude: lat, longitude: lng },
                        radius: 500.0,
                    },
                },
            }),
        });
        
        if (!response.ok) return null;

        const data: { places?: Place[] } = await response.json();
        if (!data.places || data.places.length === 0) return null;

        const validPlace = data.places.find(place => {
            const distance = haversineDistance(lat, lng, place.location.latitude, place.location.longitude);
            const reviewCount = place.userRatingCount ?? 0;
            
            return distance <= 100 &&
                   (place.types.includes("tourist_attraction")) &&
                   reviewCount >= 50;
        });
        
        return validPlace ? validPlace.displayName.text : null;
    } catch (error) {
        console.error("Places API fetch error on backend:", error);
        return null;
    }
};

const fetchAddressParts = async (lat: number, lng: number): Promise<LocationParts> => {
    const response = await fetch(`${GEOCODE_API_URL}?latlng=${lat},${lng}&key=${API_KEY}&language=ja`);
    if (!response.ok) throw new Error('Geocoding API request failed');
    
    const data: GeoResponse = await response.json();
    if (data.status !== 'OK' || !data.results.length) throw new Error(`Geocoding failed: ${data.status}`);

    const components = data.results[0].address_components;
    const findComponent = (type: string) => components.find(c => c.types.includes(type))?.long_name;
    
    const country = findComponent('country');
    const prefecture = findComponent('administrative_area_level_1');
    const city = findComponent('locality') || findComponent('administrative_area_level_2');
    
    const priorities = ['point_of_interest', 'establishment', 'natural_feature', 'park', 'premise', 'sublocality_level_1'];
    const specificPlace = priorities.map(p => findComponent(p)).find(name => name && name !== city && name !== prefecture);

    return { country, prefecture, city, specificPlace };
};


export default async function handler(request: Request) {
    if (!API_KEY) {
        return new Response(JSON.stringify({ error: 'APIキーがサーバーに設定されていません。' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (!lat || !lng) {
        return new Response(JSON.stringify({ error: '緯度または経度が無効です。' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const touristAttractionName = await fetchTouristAttraction(lat, lng);
        const addressParts = await fetchAddressParts(lat, lng);
        const { country, prefecture, city, specificPlace } = addressParts;
        
        const prefix = (country === '日本' && prefecture) ? prefecture : country;
        const finalSpecificName = touristAttractionName || specificPlace;

        const locationParts = [prefix, city, finalSpecificName];
        const finalLocation = [...new Set(locationParts.filter(Boolean))].join(' ');

        if (!finalLocation) {
             return new Response(JSON.stringify({ error: '場所を特定できませんでした。' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        return new Response(JSON.stringify({ location: finalLocation }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "サーバーで不明なエラーが発生しました。";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// This config is for Vercel to allow longer execution times for API calls.
export const config = {
  runtime: 'edge',
};
