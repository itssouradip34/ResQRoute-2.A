import * as Location from 'expo-location';

export interface GeocodedAddress {
  formattedAddress: string;
  shortName: string;
  street?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  source: 'google' | 'expo_native' | 'osm' | 'cache' | 'fallback';
}

class GeocodingServiceClass {
  private cache: Map<string, GeocodedAddress> = new Map();
  private inFlightRequests: Map<string, Promise<GeocodedAddress>> = new Map();

  private getCacheKey(lat: number, lng: number): string {
    // Round to 3 decimal places (~110m resolution)
    return `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  }

  /**
   * Reverse geocode coordinates to an accurate human-readable place name
   */
  public async reverseGeocode(
    latitude: number,
    longitude: number,
    customApiKey?: string
  ): Promise<GeocodedAddress> {
    const key = this.getCacheKey(latitude, longitude);

    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      return { ...cached, source: 'cache' };
    }

    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)!;
    }

    const requestPromise = this.performReverseGeocode(latitude, longitude, customApiKey)
      .then((res) => {
        this.cache.set(key, res);
        this.inFlightRequests.delete(key);
        return res;
      })
      .catch((err) => {
        this.inFlightRequests.delete(key);
        return {
          formattedAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          shortName: 'GPS Location',
          source: 'fallback' as const,
        };
      });

    this.inFlightRequests.set(key, requestPromise);
    return requestPromise;
  }

  private async performReverseGeocode(
    lat: number,
    lng: number,
    customApiKey?: string
  ): Promise<GeocodedAddress> {
    const googleApiKey =
      customApiKey ||
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY;

    // ----------------------------------------------------
    // 1. PRIMARY: Google Maps Platform Geocoding API
    // ----------------------------------------------------
    if (googleApiKey && googleApiKey.length > 5) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`;
        const resp = await fetch(url);
        const data = await resp.json();

        if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
          const first = data.results[0];
          const formatted = first.formatted_address || '';

          let street = '';
          let city = '';
          let state = '';
          let postalCode = '';

          first.address_components?.forEach((c: any) => {
            if (c.types.includes('route') || c.types.includes('sublocality')) {
              street = c.long_name;
            }
            if (c.types.includes('locality')) {
              city = c.long_name;
            }
            if (c.types.includes('administrative_area_level_1')) {
              state = c.long_name;
            }
            if (c.types.includes('postal_code')) {
              postalCode = c.long_name;
            }
          });

          const shortName = street || city || formatted.split(',')[0];

          return {
            formattedAddress: formatted,
            shortName,
            street,
            city,
            state,
            postalCode,
            source: 'google',
          };
        }
      } catch (err) {
        console.warn('Google Maps reverse geocoding request error:', err);
      }
    }

    // ----------------------------------------------------
    // 2. SECONDARY: Expo Location Native Reverse Geocoding
    // ----------------------------------------------------
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (results && results.length > 0) {
        const item = results[0];
        const parts = [
          item.name,
          item.street,
          item.district || item.subregion,
          item.city,
          item.region,
          item.postalCode,
        ].filter(Boolean);

        const formatted = parts.join(', ');
        const short = item.name || item.street || item.city || 'Detected Location';

        return {
          formattedAddress: formatted,
          shortName: short,
          street: item.street || undefined,
          district: item.district || item.subregion || undefined,
          city: item.city || undefined,
          state: item.region || undefined,
          postalCode: item.postalCode || undefined,
          source: 'expo_native',
        };
      }
    } catch (err) {
      // Native location geocode unavailable (e.g. web or permissions restricted)
    }

    // ----------------------------------------------------
    // 3. TERTIARY: OpenStreetMap Nominatim Fallback
    // ----------------------------------------------------
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const osmResp = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'ResQRoute-AI-Emergency-Navigator/2.0',
        },
      });
      const osmData = await osmResp.json();

      if (osmData && osmData.display_name) {
        const addr = osmData.address || {};
        const short = addr.road || addr.suburb || addr.city || osmData.name || 'Current Road';

        return {
          formattedAddress: osmData.display_name,
          shortName: short,
          street: addr.road,
          city: addr.city || addr.town || addr.village,
          state: addr.state,
          postalCode: addr.postcode,
          source: 'osm',
        };
      }
    } catch (err) {
      // OSM request failed
    }

    return {
      formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      shortName: 'GPS Coordinates',
      source: 'fallback',
    };
  }
}

export const GeocodingService = new GeocodingServiceClass();
