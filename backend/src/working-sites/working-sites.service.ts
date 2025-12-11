import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkingSite } from '../entities';
import { CreateWorkingSiteDto } from './dto/create-working-site.dto';
import { GeocodingService } from '../common/geocoding.service';

@Injectable()
export class WorkingSitesService {
  constructor(
    @InjectRepository(WorkingSite)
    private readonly workingSitesRepository: Repository<WorkingSite>,
    private readonly geocodingService: GeocodingService,
  ) {}

  async findAll(): Promise<WorkingSite[]> {
    // Check if latitude/longitude columns exist
    const columnCheck = await this.workingSitesRepository.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'working_sites' 
        AND column_name IN ('latitude', 'longitude')
    `);
    const hasLocationColumns = columnCheck.length === 2;

    let result: any[];
    if (hasLocationColumns) {
      result = await this.workingSitesRepository.query(`
        SELECT 
          id,
          working_site_name as "workingSiteName",
          location,
          latitude,
          longitude,
          created_at as "createdAt"
        FROM public.working_sites
        ORDER BY working_site_name ASC
      `);
    } else {
      result = await this.workingSitesRepository.query(`
        SELECT 
          id,
          working_site_name as "workingSiteName",
          location,
          created_at as "createdAt"
        FROM public.working_sites
        ORDER BY working_site_name ASC
      `);
    }
    
    return result.map((site: any) => ({
      ...site,
      latitude: site.latitude ?? null,
      longitude: site.longitude ?? null,
    })) as WorkingSite[];
  }

  async create(createWorkingSiteDto: CreateWorkingSiteDto): Promise<WorkingSite> {
    // Check if latitude/longitude columns exist
    const columnCheck = await this.workingSitesRepository.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'working_sites' 
        AND column_name IN ('latitude', 'longitude')
    `);
    const hasLocationColumns = columnCheck.length === 2;

    // If columns don't exist, add them
    if (!hasLocationColumns) {
      await this.workingSitesRepository.query(`
        ALTER TABLE public.working_sites 
        ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
        ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7)
      `);
    }

    // Geocode the location if coordinates are not provided
    let latitude = createWorkingSiteDto.latitude ?? null;
    let longitude = createWorkingSiteDto.longitude ?? null;

    if ((!latitude || !longitude) && createWorkingSiteDto.location) {
      console.log(`[WorkingSitesService] Geocoding address for new working site: ${createWorkingSiteDto.location}`);
      const coords = await this.geocodingService.geocodeAddress(createWorkingSiteDto.location);
      if (coords) {
        latitude = coords.latitude;
        longitude = coords.longitude;
        console.log(`[WorkingSitesService] Successfully geocoded to: ${latitude}, ${longitude}`);
      } else {
        console.warn(`[WorkingSitesService] Failed to geocode address: ${createWorkingSiteDto.location}`);
        // Try with working site name appended as fallback
        if (createWorkingSiteDto.workingSiteName) {
          console.log(`[WorkingSitesService] Trying with working site name: ${createWorkingSiteDto.workingSiteName}, ${createWorkingSiteDto.location}`);
          const altCoords = await this.geocodingService.geocodeAddress(
            `${createWorkingSiteDto.workingSiteName}, ${createWorkingSiteDto.location}`
          );
          if (altCoords) {
            latitude = altCoords.latitude;
            longitude = altCoords.longitude;
            console.log(`[WorkingSitesService] Successfully geocoded with site name to: ${latitude}, ${longitude}`);
          } else {
            console.error(`[WorkingSitesService] All geocoding attempts failed for: ${createWorkingSiteDto.location}`);
          }
        }
      }
    }

    // Use raw query to insert
    let result: any[];
    if (hasLocationColumns || columnCheck.length > 0) {
      result = await this.workingSitesRepository.query(
        `INSERT INTO public.working_sites (working_site_name, location, latitude, longitude)
         VALUES ($1, $2, $3, $4)
         RETURNING id, working_site_name as "workingSiteName", location, latitude, longitude, created_at as "createdAt"`,
        [createWorkingSiteDto.workingSiteName, createWorkingSiteDto.location, latitude, longitude]
      );
    } else {
      result = await this.workingSitesRepository.query(
        `INSERT INTO public.working_sites (working_site_name, location)
         VALUES ($1, $2)
         RETURNING id, working_site_name as "workingSiteName", location, created_at as "createdAt"`,
        [createWorkingSiteDto.workingSiteName, createWorkingSiteDto.location]
      );
    }

    return {
      ...result[0],
      latitude: result[0].latitude ?? null,
      longitude: result[0].longitude ?? null,
    } as WorkingSite;
  }

  async updateCoordinates(workingSiteName: string): Promise<WorkingSite | null> {
    // Get the working site
    const columnCheck = await this.workingSitesRepository.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'working_sites' 
        AND column_name IN ('latitude', 'longitude')
    `);
    const hasLocationColumns = columnCheck.length === 2;

    if (!hasLocationColumns) {
      // Add columns if they don't exist
      await this.workingSitesRepository.query(`
        ALTER TABLE public.working_sites 
        ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
        ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7)
      `);
    }

    // Get working site location
    const result = await this.workingSitesRepository.query(
      `SELECT location, latitude, longitude FROM public.working_sites WHERE working_site_name = $1 LIMIT 1`,
      [workingSiteName]
    );

    if (!result || result.length === 0) {
      return null;
    }

    const site = result[0];

    // If coordinates already exist, return
    if (site.latitude && site.longitude) {
      return {
        id: result[0].id,
        workingSiteName,
        location: site.location,
        latitude: site.latitude,
        longitude: site.longitude,
        createdAt: result[0].created_at,
      } as WorkingSite;
    }

    // Geocode the location
    if (!site.location) {
      console.log(`[updateCoordinates] No location string for working site: ${workingSiteName}`);
      return null;
    }

    console.log(`[updateCoordinates] Geocoding address: ${site.location}`);
    const coords = await this.geocodingService.geocodeAddress(site.location);
    console.log(`[updateCoordinates] Geocoding result:`, coords);
    if (!coords) {
      console.warn(`[updateCoordinates] Geocoding failed for: ${site.location}`);
      console.warn(`[updateCoordinates] Trying alternative address formats...`);
      
      // Try alternative formats if primary geocoding fails
      const alternatives = [
        `${workingSiteName}, ${site.location}`,
        site.location + ', Antalya',
        site.location + ', Antalya, Turkey',
      ];
      
      for (const altAddress of alternatives) {
        console.log(`[updateCoordinates] Trying alternative: ${altAddress}`);
        const altCoords = await this.geocodingService.geocodeAddress(altAddress);
        if (altCoords) {
          console.log(`[updateCoordinates] Successfully geocoded with alternative address!`);
          // Update with alternative coordinates
          await this.workingSitesRepository.query(
            `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
            [altCoords.latitude, altCoords.longitude, workingSiteName]
          );
          
          // Return updated working site
          const updated = await this.workingSitesRepository.query(
            `SELECT id, working_site_name as "workingSiteName", location, latitude, longitude, created_at as "createdAt"
             FROM public.working_sites WHERE working_site_name = $1 LIMIT 1`,
            [workingSiteName]
          );
          
          if (updated && updated.length > 0) {
            return {
              ...updated[0],
              latitude: updated[0].latitude ?? null,
              longitude: updated[0].longitude ?? null,
            } as WorkingSite;
          }
        }
      }
      
      console.error(`[updateCoordinates] All geocoding attempts failed for: ${site.location}`);
      return null;
    }

    // Update the working site with coordinates
    await this.workingSitesRepository.query(
      `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
      [coords.latitude, coords.longitude, workingSiteName]
    );

    // Return updated working site
    const updated = await this.workingSitesRepository.query(
      `SELECT id, working_site_name as "workingSiteName", location, latitude, longitude, created_at as "createdAt"
       FROM public.working_sites WHERE working_site_name = $1 LIMIT 1`,
      [workingSiteName]
    );

    if (!updated || updated.length === 0) {
      return null;
    }

    return {
      ...updated[0],
      latitude: updated[0].latitude ?? null,
      longitude: updated[0].longitude ?? null,
    } as WorkingSite;
  }

  async setCoordinates(
    workingSiteName: string,
    latitude: string,
    longitude: string,
  ): Promise<WorkingSite | null> {
    // Check if columns exist
    const columnCheck = await this.workingSitesRepository.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'working_sites' 
        AND column_name IN ('latitude', 'longitude')
    `);
    const hasLocationColumns = columnCheck.length === 2;

    if (!hasLocationColumns) {
      await this.workingSitesRepository.query(`
        ALTER TABLE public.working_sites 
        ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
        ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7)
      `);
    }

    // Update coordinates
    await this.workingSitesRepository.query(
      `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
      [latitude, longitude, workingSiteName]
    );

    // Return updated working site
    const updated = await this.workingSitesRepository.query(
      `SELECT id, working_site_name as "workingSiteName", location, latitude, longitude, created_at as "createdAt"
       FROM public.working_sites WHERE working_site_name = $1 LIMIT 1`,
      [workingSiteName]
    );

    if (!updated || updated.length === 0) {
      return null;
    }

    return {
      ...updated[0],
      latitude: updated[0].latitude ?? null,
      longitude: updated[0].longitude ?? null,
    } as WorkingSite;
  }

  async remove(id: string): Promise<void> {
    await this.workingSitesRepository.query(
      `DELETE FROM public.working_sites WHERE id = $1`,
      [id]
    );
  }
}







