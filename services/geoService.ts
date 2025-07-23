import { GeoResponse, Place } from '../types';

interface CacheEntry {
    location: string;
    timestamp: number;
}

const getCache = (key: string): CacheEntry | null => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const entry: CacheEntry = JSON.parse(item);
        if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
            return null;
        }
        return entry;
    } catch (error) {
        return null;
    }
};

const setCache = (key: string, location: string) => {
    try {
        const entry: CacheEntry = { location, timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
        console.error("Failed to write to cache", error);
    }
};

export const fetchSmartLocationName = async (lat: number, lng: number): Promise<string> => {
    const cacheKey = `loc_v6_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    const cached = getCache(cacheKey);
    if (cached) {
        return cached.location;
    }

    try {
        // Call our own backend endpoint instead of Google's directly
        const response = await fetch(`/api/location?lat=${lat}&lng=${lng}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `サーバーからの応答エラー: ${response.status}`);
        }
        
        const data: { location: string } = await response.json();
        
        if (!data.location) {
            throw new Error("場所を特定できませんでした。");
        }
        
        setCache(cacheKey, data.location);
        return data.location;

    } catch (error) {
        console.error("Error fetching smart location name:", error);
        if (error instanceof Error) {
           throw new Error(`場所の取得に失敗: ${error.message}`);
        }
        throw new Error("場所の名前を取得できませんでした。");
    }
};
