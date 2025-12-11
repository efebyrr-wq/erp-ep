import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly configService?: ConfigService) {}

  /**
   * Geocode an address to coordinates using multiple providers in order of preference
   * Also supports reverse geocoding if coordinates are provided
   * @param address The address string to geocode, or coordinates in format "lat,lng" or "latitude,longitude"
   * @returns Promise with latitude and longitude, or null if geocoding fails
   */
  async geocodeAddress(address: string): Promise<{ latitude: string; longitude: string } | null> {
    if (!address || address.trim().length === 0) {
      return null;
    }

    // Check if input is coordinates (e.g., "36.8585143,30.9095004" or "36.8585143, 30.9095004")
    const coordinateMatch = address.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (coordinateMatch) {
      const [, lat, lng] = coordinateMatch;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Validate coordinate ranges
      if (!isNaN(latitude) && !isNaN(longitude) && 
          latitude >= -90 && latitude <= 90 && 
          longitude >= -180 && longitude <= 180) {
        this.logger.log(`Input detected as coordinates: ${latitude}, ${longitude}`);
        return {
          latitude: latitude.toFixed(7),
          longitude: longitude.toFixed(7),
        };
      }
    }

    // Normalize address for better results
    const normalizedAddress = this.normalizeAddress(address);

    // Try providers in order of preference:
    // 1. Google Maps (if API key available)
    // 2. Here Maps (if API key available)
    // 3. Mapbox (if API key available)
    // 4. OpenStreetMap Nominatim (fallback, no key required)

    if (this.configService) {
      // Try Google Maps first
      const googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
      if (googleApiKey) {
        const googleResult = await this.geocodeWithGoogle(normalizedAddress, googleApiKey);
        if (googleResult) {
          this.logger.log(`Successfully geocoded with Google Maps: ${normalizedAddress}`);
          return googleResult;
        }
      }

      // Try Here Maps
      const hereApiKey = this.configService.get<string>('HERE_MAPS_API_KEY');
      if (hereApiKey) {
        const hereResult = await this.geocodeWithHere(normalizedAddress, hereApiKey);
        if (hereResult) {
          this.logger.log(`Successfully geocoded with Here Maps: ${normalizedAddress}`);
          return hereResult;
        }
      }

      // Try Mapbox
      const mapboxApiKey = this.configService.get<string>('MAPBOX_API_KEY');
      if (mapboxApiKey) {
        const mapboxResult = await this.geocodeWithMapbox(normalizedAddress, mapboxApiKey);
        if (mapboxResult) {
          this.logger.log(`Successfully geocoded with Mapbox: ${normalizedAddress}`);
          return mapboxResult;
        }
      }
    }

    // Fallback to OpenStreetMap Nominatim (no API key required)
    this.logger.log(`Trying OpenStreetMap for: ${normalizedAddress}`);
    return this.geocodeWithOpenStreetMap(normalizedAddress);
  }

  /**
   * Normalize address string for better geocoding results
   */
  private normalizeAddress(address: string): string {
    return address
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/,/g, ', ') // Ensure proper comma spacing
      .replace(/\s*,\s*/g, ', '); // Normalize comma spacing
  }

  /**
   * Geocode using Google Maps Geocoding API
   */
  private async geocodeWithGoogle(
    address: string,
    apiKey: string,
  ): Promise<{ latitude: string; longitude: string } | null> {
    try {
      const encodedAddress = encodeURIComponent(address.trim());
      // Add region bias for Turkey to improve results
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=tr&key=${apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`Google Geocoding API failed for address: ${address}, status: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Get the first result (most relevant match)
        const result = data.results[0];
        const location = result.geometry.location;
        this.logger.log(
          `Google Geocoded "${address}" to: ${location.lat}, ${location.lng} (${result.formatted_address})`,
        );
        return {
          latitude: location.lat.toFixed(7),
          longitude: location.lng.toFixed(7),
        };
      }

      this.logger.warn(`Google Geocoding: No results found for address: ${address}, status: ${data.status}`);
      return null;
    } catch (error) {
      this.logger.error(`Error geocoding with Google Maps API for "${address}":`, error);
      return null;
    }
  }

  /**
   * Geocode using Here Maps Geocoding API
   */
  private async geocodeWithHere(
    address: string,
    apiKey: string,
  ): Promise<{ latitude: string; longitude: string } | null> {
    try {
      const encodedAddress = encodeURIComponent(address.trim());
      const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodedAddress}&apiKey=${apiKey}&in=countryCode:TUR&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`Here Maps Geocoding API failed for address: ${address}, status: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const result = data.items[0];
        const position = result.position;
        this.logger.log(
          `Here Maps geocoded "${address}" to: ${position.lat}, ${position.lng} (${result.title})`,
        );
        return {
          latitude: position.lat.toFixed(7),
          longitude: position.lng.toFixed(7),
        };
      }

      this.logger.warn(`Here Maps Geocoding: No results found for address: ${address}`);
      return null;
    } catch (error) {
      this.logger.error(`Error geocoding with Here Maps API for "${address}":`, error);
      return null;
    }
  }

  /**
   * Geocode using Mapbox Geocoding API
   */
  private async geocodeWithMapbox(
    address: string,
    apiKey: string,
  ): Promise<{ latitude: string; longitude: string } | null> {
    try {
      const encodedAddress = encodeURIComponent(address.trim());
      // Mapbox uses country code 'tr' for Turkey
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?country=tr&limit=1&access_token=${apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`Mapbox Geocoding API failed for address: ${address}, status: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const result = data.features[0];
        const coordinates = result.center; // [longitude, latitude] - Mapbox uses lon,lat order
        this.logger.log(
          `Mapbox geocoded "${address}" to: ${coordinates[1]}, ${coordinates[0]} (${result.place_name})`,
        );
        return {
          latitude: coordinates[1].toFixed(7), // latitude is second
          longitude: coordinates[0].toFixed(7), // longitude is first
        };
      }

      this.logger.warn(`Mapbox Geocoding: No results found for address: ${address}`);
      return null;
    } catch (error) {
      this.logger.error(`Error geocoding with Mapbox API for "${address}":`, error);
      return null;
    }
  }

  /**
   * Generate multiple address variations for better geocoding success
   */
  private generateAddressVariations(address: string): string[] {
    const variations: string[] = [];
    const normalized = address.trim();
    
    // Original address
    variations.push(normalized);
    
    // Remove common prefixes/suffixes and try variations
    const withoutNo = normalized.replace(/No[:\s]*\d+/gi, '').trim().replace(/\s+/g, ' ');
    if (withoutNo !== normalized) {
      variations.push(withoutNo);
    }
    
    // Split by comma and try different combinations
    const parts = normalized.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length > 1) {
      // Try without postal code
      const withoutPostal = parts.filter(p => !/^\d{5}/.test(p)).join(', ');
      if (withoutPostal !== normalized && withoutPostal.length > 0) {
        variations.push(withoutPostal);
      }
      
      // Try first 2 parts (usually street and district)
      if (parts.length >= 2) {
        variations.push(parts.slice(0, 2).join(', '));
      }
      
      // Try first 3 parts
      if (parts.length >= 3) {
        variations.push(parts.slice(0, 3).join(', '));
      }
      
      // Try last 2 parts (usually district and city)
      if (parts.length >= 2) {
        variations.push(parts.slice(-2).join(', '));
      }
      
      // Try last 3 parts
      if (parts.length >= 3) {
        variations.push(parts.slice(-3).join(', '));
      }
      
      // Try just the first part (street/place name)
      if (parts[0]) {
        variations.push(parts[0]);
      }
      
      // Try with "Antalya" appended if not present
      if (!normalized.toLowerCase().includes('antalya')) {
        variations.push(normalized + ', Antalya');
        variations.push(parts[0] + ', Antalya');
      }
      
      // Try with "Turkey" appended
      if (!normalized.toLowerCase().includes('turkey') && !normalized.toLowerCase().includes('türkiye')) {
        variations.push(normalized + ', Turkey');
      }
    } else {
      // Single part address - try with city/country
      variations.push(normalized + ', Antalya');
      variations.push(normalized + ', Antalya, Turkey');
    }
    
    // Remove duplicates while preserving order
    return Array.from(new Set(variations));
  }

  /**
   * Geocode using OpenStreetMap Nominatim API (fallback)
   */
  private async geocodeWithOpenStreetMap(
    address: string,
  ): Promise<{ latitude: string; longitude: string } | null> {
    try {
      // Generate address variations
      const addressVariations = this.generateAddressVariations(address);
      
      // Try multiple search strategies for each variation
      const searchStrategies = [
        // Strategy 1: With Turkey country code
        {
          countrycodes: 'tr',
          description: 'with Turkey filter',
        },
        // Strategy 2: Without country restriction
        {
          countrycodes: null,
          description: 'without country filter',
        },
      ];
      
      // Try each address variation with each strategy
      for (const variation of addressVariations) {
        for (const strategy of searchStrategies) {
          try {
            const encodedQuery = encodeURIComponent(variation);
            const countryParam = strategy.countrycodes ? `&countrycodes=${strategy.countrycodes}` : '';
            const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}${countryParam}&format=json&limit=1&addressdetails=1&extratags=1`;

            const response = await fetch(url, {
              headers: {
                'User-Agent': 'ERP-2025/1.0', // Required by Nominatim
              },
            });

            if (response.ok) {
              const data = await response.json();

              if (Array.isArray(data) && data.length > 0) {
                // Get the first result (highest relevance/importance)
                const result = data[0];
                this.logger.log(
                  `OpenStreetMap geocoded "${address}" using variation "${variation}" ${strategy.description} to: ${result.lat}, ${result.lon} (${result.display_name})`,
                );
                return {
                  latitude: parseFloat(result.lat).toFixed(7),
                  longitude: parseFloat(result.lon).toFixed(7),
                };
              }
            }
          } catch (strategyError) {
            this.logger.warn(`OpenStreetMap variation "${variation}" ${strategy.description} failed: ${strategyError}`);
            continue; // Try next strategy
          }
        }
      }

      this.logger.warn(`OpenStreetMap Geocoding: No results found for address: ${address}`);
      return null;
    } catch (error) {
      this.logger.error(`Error geocoding with OpenStreetMap API for "${address}":`, error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to an address using multiple providers
   * @param latitude The latitude coordinate
   * @param longitude The longitude coordinate
   * @returns Promise with formatted address string, or null if reverse geocoding fails
   */
  async reverseGeocode(
    latitude: string | number,
    longitude: string | number,
  ): Promise<string | null> {
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      this.logger.warn(`Invalid coordinates for reverse geocoding: ${lat}, ${lng}`);
      return null;
    }

    // Try providers in order of preference
    if (this.configService) {
      // Try Google Maps first
      const googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
      if (googleApiKey) {
        const googleResult = await this.reverseGeocodeWithGoogle(lat, lng, googleApiKey);
        if (googleResult) {
          this.logger.log(`Successfully reverse geocoded with Google Maps: ${lat}, ${lng}`);
          return googleResult;
        }
      }

      // Try Here Maps
      const hereApiKey = this.configService.get<string>('HERE_MAPS_API_KEY');
      if (hereApiKey) {
        const hereResult = await this.reverseGeocodeWithHere(lat, lng, hereApiKey);
        if (hereResult) {
          this.logger.log(`Successfully reverse geocoded with Here Maps: ${lat}, ${lng}`);
          return hereResult;
        }
      }

      // Try Mapbox
      const mapboxApiKey = this.configService.get<string>('MAPBOX_API_KEY');
      if (mapboxApiKey) {
        const mapboxResult = await this.reverseGeocodeWithMapbox(lat, lng, mapboxApiKey);
        if (mapboxResult) {
          this.logger.log(`Successfully reverse geocoded with Mapbox: ${lat}, ${lng}`);
          return mapboxResult;
        }
      }
    }

    // Fallback to OpenStreetMap Nominatim (no API key required)
    this.logger.log(`Trying OpenStreetMap reverse geocoding for: ${lat}, ${lng}`);
    return this.reverseGeocodeWithOpenStreetMap(lat, lng);
  }

  /**
   * Reverse geocode using Google Maps Geocoding API
   */
  private async reverseGeocodeWithGoogle(
    latitude: number,
    longitude: number,
    apiKey: string,
  ): Promise<string | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`Google Reverse Geocoding API failed for ${latitude}, ${longitude}, status: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        this.logger.log(`Google reverse geocoded ${latitude}, ${longitude} to: ${result.formatted_address}`);
        return result.formatted_address;
      }

      this.logger.warn(`Google Reverse Geocoding: No results found for ${latitude}, ${longitude}, status: ${data.status}`);
      return null;
    } catch (error) {
      this.logger.error(`Error reverse geocoding with Google Maps API for ${latitude}, ${longitude}:`, error);
      return null;
    }
  }

  /**
   * Reverse geocode using Here Maps Geocoding API
   */
  private async reverseGeocodeWithHere(
    latitude: number,
    longitude: number,
    apiKey: string,
  ): Promise<string | null> {
    try {
      const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&apiKey=${apiKey}&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`Here Maps Reverse Geocoding API failed for ${latitude}, ${longitude}, status: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const result = data.items[0];
        const address = result.address;
        const formattedAddress = [
          address.street,
          address.district,
          address.city,
          address.countryName,
        ]
          .filter(Boolean)
          .join(', ');
        this.logger.log(`Here Maps reverse geocoded ${latitude}, ${longitude} to: ${formattedAddress}`);
        return formattedAddress || result.title;
      }

      this.logger.warn(`Here Maps Reverse Geocoding: No results found for ${latitude}, ${longitude}`);
      return null;
    } catch (error) {
      this.logger.error(`Error reverse geocoding with Here Maps API for ${latitude}, ${longitude}:`, error);
      return null;
    }
  }

  /**
   * Reverse geocode using Mapbox Geocoding API
   */
  private async reverseGeocodeWithMapbox(
    latitude: number,
    longitude: number,
    apiKey: string,
  ): Promise<string | null> {
    try {
      // Mapbox uses longitude,latitude order
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`Mapbox Reverse Geocoding API failed for ${latitude}, ${longitude}, status: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const result = data.features[0];
        this.logger.log(`Mapbox reverse geocoded ${latitude}, ${longitude} to: ${result.place_name}`);
        return result.place_name;
      }

      this.logger.warn(`Mapbox Reverse Geocoding: No results found for ${latitude}, ${longitude}`);
      return null;
    } catch (error) {
      this.logger.error(`Error reverse geocoding with Mapbox API for ${latitude}, ${longitude}:`, error);
      return null;
    }
  }

  /**
   * Reverse geocode using OpenStreetMap Nominatim API (fallback)
   */
  private async reverseGeocodeWithOpenStreetMap(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ERP-2025/1.0', // Required by Nominatim
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.display_name) {
          this.logger.log(`OpenStreetMap reverse geocoded ${latitude}, ${longitude} to: ${data.display_name}`);
          return data.display_name;
        }
      }

      this.logger.warn(`OpenStreetMap Reverse Geocoding: No results found for ${latitude}, ${longitude}`);
      return null;
    } catch (error) {
      this.logger.error(`Error reverse geocoding with OpenStreetMap API for ${latitude}, ${longitude}:`, error);
      return null;
    }
  }
}

