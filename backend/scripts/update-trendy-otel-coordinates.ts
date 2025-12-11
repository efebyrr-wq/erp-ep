// Script to update coordinates for "Trendy Otel Lara" working site
// Run with: npx ts-node backend/scripts/update-trendy-otel-coordinates.ts

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_2025',
});

async function geocodeAddress(address: string): Promise<{ latitude: string; longitude: string } | null> {
  try {
    // Try multiple search strategies
    const searchStrategies = [
      // Strategy 1: Full address with Turkey filter
      {
        query: address,
        countrycodes: 'tr',
        description: 'Full address with Turkey filter',
      },
      // Strategy 2: Remove street number
      {
        query: address.replace(/No:\d+/gi, '').trim(),
        countrycodes: 'tr',
        description: 'Address without street number',
      },
      // Strategy 3: Just the key parts
      {
        query: 'Tesisler Caddesi, Kundu, Aksu, Antalya',
        countrycodes: 'tr',
        description: 'Key location parts only',
      },
      // Strategy 4: Simplified
      {
        query: 'Kundu, Aksu, Antalya',
        countrycodes: 'tr',
        description: 'Simplified location',
      },
      // Strategy 5: Without country restriction
      {
        query: address,
        countrycodes: null,
        description: 'Full address without country filter',
      },
    ];

    for (const strategy of searchStrategies) {
      try {
        const encodedQuery = encodeURIComponent(strategy.query);
        const countryParam = strategy.countrycodes ? `&countrycodes=${strategy.countrycodes}` : '';
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}${countryParam}&format=json&limit=1&addressdetails=1`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'ERP-2025/1.0',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const result = data[0];
            console.log(`✓ Geocoded using "${strategy.description}" to: ${result.lat}, ${result.lon}`);
            console.log(`  Matched: ${result.display_name}`);
            return {
              latitude: parseFloat(result.lat).toFixed(7),
              longitude: parseFloat(result.lon).toFixed(7),
            };
          }
        }
      } catch (strategyError) {
        console.log(`  Strategy "${strategy.description}" failed, trying next...`);
        continue;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error geocoding address "${address}":`, error);
    return null;
  }
}

async function updateTrendyOtelCoordinates() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if latitude/longitude columns exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'working_sites' 
        AND column_name IN ('latitude', 'longitude')
    `);
    const hasLocationColumns = columnCheck.rows.length === 2;

    if (!hasLocationColumns) {
      console.log('Adding latitude and longitude columns...');
      await client.query(`
        ALTER TABLE public.working_sites 
        ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
        ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7)
      `);
      console.log('✓ Columns added');
    }

    // Find the working site
    const result = await client.query(
      `SELECT id, working_site_name, location, latitude, longitude 
       FROM public.working_sites 
       WHERE working_site_name ILIKE $1 
       LIMIT 1`,
      ['%Trendy Otel Lara%']
    );

    if (result.rows.length === 0) {
      console.log('❌ Working site "Trendy Otel Lara" not found in database.');
      console.log('Available working sites:');
      const allSites = await client.query('SELECT working_site_name FROM public.working_sites');
      allSites.rows.forEach((row) => {
        console.log(`  - ${row.working_site_name}`);
      });
      return;
    }

    const site = result.rows[0];
    console.log(`\nFound working site: "${site.working_site_name}"`);
    console.log(`Current location: ${site.location}`);
    console.log(`Current coordinates: ${site.latitude || 'null'}, ${site.longitude || 'null'}`);

    // If coordinates already exist, ask if we should update
    if (site.latitude && site.longitude) {
      console.log(`\n⚠ Coordinates already exist. They will be updated.`);
    }

    // Geocode the address
    if (!site.location) {
      console.log('❌ No location/address found for this working site.');
      return;
    }

    console.log(`\nGeocoding address: "${site.location}"...`);
    const coords = await geocodeAddress(site.location);

    if (!coords) {
      console.log('\n❌ Failed to geocode with primary address. Trying alternative formats...');
      
      // Try alternative formats with hotel name
      const alternatives = [
        'Trendy Otel Lara, Kundu, Aksu, Antalya',
        'Trendy Otel Lara, Antalya',
        'Tesisler Caddesi 454, Kundu, Aksu, Antalya',
        'Kundu Mahallesi, Tesisler Caddesi, Aksu, Antalya',
      ];

      for (const altAddress of alternatives) {
        console.log(`\nTrying: "${altAddress}"...`);
        const altCoords = await geocodeAddress(altAddress);
        if (altCoords) {
          console.log(`✓ Successfully geocoded with alternative address!`);
          await client.query(
            `UPDATE public.working_sites 
             SET latitude = $1, longitude = $2 
             WHERE id = $3`,
            [altCoords.latitude, altCoords.longitude, site.id]
          );
          console.log(`\n✅ Updated coordinates for "${site.working_site_name}"`);
          console.log(`   Latitude: ${altCoords.latitude}`);
          console.log(`   Longitude: ${altCoords.longitude}`);
          
          // Verify the update
          const verify = await client.query(
            `SELECT latitude, longitude FROM public.working_sites WHERE id = $1`,
            [site.id]
          );
          console.log(`\n✓ Verified: ${verify.rows[0].latitude}, ${verify.rows[0].longitude}`);
          return;
        }
      }
      
      console.log('\n❌ All geocoding attempts failed.');
      console.log('You may need to manually set coordinates or check the address format.');
      return;
    }

    // Update the coordinates
    await client.query(
      `UPDATE public.working_sites 
       SET latitude = $1, longitude = $2 
       WHERE id = $3`,
      [coords.latitude, coords.longitude, site.id]
    );

    console.log(`\n✅ Successfully updated coordinates for "${site.working_site_name}"`);
    console.log(`   Latitude: ${coords.latitude}`);
    console.log(`   Longitude: ${coords.longitude}`);

    // Verify the update
    const verify = await client.query(
      `SELECT latitude, longitude FROM public.working_sites WHERE id = $1`,
      [site.id]
    );
    console.log(`\n✓ Verified: ${verify.rows[0].latitude}, ${verify.rows[0].longitude}`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateTrendyOtelCoordinates();

