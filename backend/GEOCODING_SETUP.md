# Geocoding Setup Guide

This guide explains how to set up geocoding providers for accurate address-to-coordinate conversion.

## Supported Providers

The system supports multiple geocoding providers in order of preference:

1. **Google Maps Geocoding API** (Most accurate, recommended)
2. **Here Maps Geocoding API** (Good accuracy)
3. **Mapbox Geocoding API** (Good accuracy)
4. **OpenStreetMap Nominatim** (Free, no API key required, fallback)

## Setting Up API Keys

### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Geocoding API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Geocoding API"
   - Click "Enable"
4. Create an API key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Restrict the key to "Geocoding API" for security
5. Add to `.env` file:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### Here Maps API Key

1. Go to [Here Developer Portal](https://developer.here.com/)
2. Sign up for a free account
3. Create a new project
4. Get your API key from the project dashboard
5. Add to `.env` file:
   ```
   HERE_MAPS_API_KEY=your_api_key_here
   ```

### Mapbox API Key

1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up for a free account
3. Go to your account page and create an access token
4. Add to `.env` file:
   ```
   MAPBOX_API_KEY=your_access_token_here
   ```

## Configuration

Add the API keys to your `backend/.env` file:

```env
# Geocoding API Keys (optional, but recommended for accuracy)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
HERE_MAPS_API_KEY=your_here_maps_api_key
MAPBOX_API_KEY=your_mapbox_api_key
```

## Usage

The geocoding service will automatically try providers in order:
1. If Google Maps API key is available, it will be used first
2. If Google fails or no key, Here Maps will be tried
3. If Here fails or no key, Mapbox will be tried
4. If all fail or no keys, OpenStreetMap (free) will be used as fallback

## Testing

To test geocoding for a working site:

```bash
curl -X PATCH "http://localhost:3000/working-sites/YOUR_SITE_NAME/geocode"
```

To manually set coordinates:

```bash
curl -X PATCH "http://localhost:3000/working-sites/YOUR_SITE_NAME/coordinates" \
  -H "Content-Type: application/json" \
  -d '{"latitude":"37.0755690","longitude":"30.6207496"}'
```

## Notes

- **Apple Maps**: Apple Maps does not provide a public geocoding API, so it cannot be used
- **Free Tier**: OpenStreetMap Nominatim is free but has rate limits (1 request per second)
- **Accuracy**: Google Maps typically provides the most accurate results for Turkish addresses
- **Cost**: Google Maps, Here Maps, and Mapbox all have free tiers with generous limits for development





