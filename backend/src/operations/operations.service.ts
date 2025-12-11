import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  InternalOperation,
  OutsourceOperation,
  ServiceOperation,
  TransportationOperation,
  WorkingSite,
} from '../entities';
import { CreateTransportationOperationDto } from './dto/create-transportation-operation.dto';
import { MachineryService } from '../machinery/machinery.service';
import { GeocodingService } from '../common/geocoding.service';
import { CreateInternalOperationDto } from './dto/create-internal-operation.dto';
import { CreateOutsourceOperationDto } from './dto/create-outsource-operation.dto';
import { CreateServiceOperationDto } from './dto/create-service-operation.dto';

@Injectable()
export class OperationsService {
  // Garage coordinates (idle machinery location)
  private readonly GARAGE_LAT = '36.934308';
  private readonly GARAGE_LON = '30.777931';

  constructor(
    @InjectRepository(InternalOperation)
    private readonly internalOpsRepository: Repository<InternalOperation>,
    @InjectRepository(OutsourceOperation)
    private readonly outsourceOpsRepository: Repository<OutsourceOperation>,
    @InjectRepository(ServiceOperation)
    private readonly serviceOpsRepository: Repository<ServiceOperation>,
    @InjectRepository(TransportationOperation)
    private readonly transportationOpsRepository: Repository<TransportationOperation>,
    @InjectRepository(WorkingSite)
    private readonly workingSitesRepository: Repository<WorkingSite>,
    @Inject(forwardRef(() => MachineryService))
    private readonly machineryService: MachineryService,
    private readonly geocodingService: GeocodingService,
  ) {}

  async findAllInternal(): Promise<InternalOperation[]> {
    return this.internalOpsRepository.find({
      order: {
        startDate: 'DESC',
      },
    });
  }

  async findAllOutsource(): Promise<OutsourceOperation[]> {
    return this.outsourceOpsRepository.find({
      order: {
        startDate: 'DESC',
      },
    });
  }

  async findAllService(): Promise<ServiceOperation[]> {
    return this.serviceOpsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllTransportation(): Promise<TransportationOperation[]> {
    return this.transportationOpsRepository.find({
      order: {
        operationDate: 'DESC',
      },
    });
  }

  async findActiveInternal(): Promise<InternalOperation[]> {
    return this.internalOpsRepository.find({
      where: {
        endDate: IsNull(),
      },
      order: {
        startDate: 'DESC',
      },
    });
  }

  async findActiveOutsource(): Promise<OutsourceOperation[]> {
    return this.outsourceOpsRepository.find({
      where: {
        endDate: IsNull(),
      },
      order: {
        startDate: 'DESC',
      },
    });
  }

  async closeInternalOperation(id: string): Promise<InternalOperation> {
    const operation = await this.internalOpsRepository.findOne({ where: { id } });
    if (!operation) {
      throw new Error(`Internal operation with id ${id} not found`);
    }
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    operation.endDate = today;
    const savedOp = await this.internalOpsRepository.save(operation);

    // Update machinery status to IDLE and location to garage
    if (operation.machineNumber) {
      try {
        await this.machineryService.updateMachineryStatusAndLocation(
          operation.machineNumber,
          'IDLE',
          this.GARAGE_LAT,
          this.GARAGE_LON,
        );
      } catch (error) {
        console.error('Error updating machinery status/location:', error);
        // Continue even if update fails
      }
    }

    return savedOp;
  }

  async closeOutsourceOperation(id: string): Promise<OutsourceOperation> {
    const operation = await this.outsourceOpsRepository.findOne({ where: { id } });
    if (!operation) {
      throw new Error(`Outsource operation with id ${id} not found`);
    }
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    operation.endDate = today;
    const savedOp = await this.outsourceOpsRepository.save(operation);

    // Update machinery status to IDLE and location to garage (using machineCode for outsource)
    if (operation.machineCode) {
      try {
        const machinery = await this.machineryService.findByMachineCode(operation.machineCode);
        if (machinery) {
          await this.machineryService.updateMachineryStatusAndLocation(
            machinery.machineNumber,
            'IDLE',
            this.GARAGE_LAT,
            this.GARAGE_LON,
          );
        }
      } catch (error) {
        console.error('Error updating machinery status/location:', error);
        // Continue even if update fails
      }
    }

    return savedOp;
  }

  /**
   * Create an internal operation
   */
  async createInternal(
    createInternalDto: CreateInternalOperationDto,
  ): Promise<InternalOperation> {
    try {
      // Normalize empty strings to null
      const normalize = (value: string | null | undefined): string | null => {
        if (value === undefined || value === null || value === '') return null;
        return value.trim() || null;
      };

      // Use raw query to avoid TypeORM entity mapping issues
      const result = await this.internalOpsRepository.query(
        `INSERT INTO public.internal_operations 
         (customer_name, machine_number, machine_code, working_site_name, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, customer_name as "customerName", machine_number as "machineNumber", 
                   machine_code as "machineCode", working_site_name as "workingSiteName",
                   start_date as "startDate", end_date as "endDate"`,
        [
          normalize(createInternalDto.customerName),
          normalize(createInternalDto.machineNumber),
          normalize(createInternalDto.machineCode),
          normalize(createInternalDto.workingSiteName),
          normalize(createInternalDto.startDate),
          normalize(createInternalDto.endDate),
        ]
      );

      if (!result || result.length === 0) {
        throw new Error('Failed to create internal operation');
      }

      const savedOp = result[0] as InternalOperation;

      // Update machinery status and location if machineNumber is provided
      const machineNumber = normalize(createInternalDto.machineNumber);
      if (machineNumber) {
        let latitude: string | null = null;
        let longitude: string | null = null;

        // Get working site coordinates if workingSiteName is provided
        const workingSiteName = normalize(createInternalDto.workingSiteName);
        if (workingSiteName) {
          try {
            // Use raw query to avoid TypeORM entity mapping issues
            const workingSiteResult = await this.workingSitesRepository.query(
              `SELECT location, latitude, longitude FROM public.working_sites WHERE working_site_name = $1 LIMIT 1`,
              [workingSiteName]
            );
            
            if (workingSiteResult && workingSiteResult.length > 0) {
              const site = workingSiteResult[0];
              console.log(`[createInternal] Working site found: ${workingSiteName}, location: ${site.location}, lat: ${site.latitude}, lon: ${site.longitude}`);
              
              // If coordinates exist, use them; otherwise geocode the location
              if (site.latitude && site.longitude) {
                const lat = parseFloat(String(site.latitude));
                const lon = parseFloat(String(site.longitude));
                if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
                  latitude = String(lat);
                  longitude = String(lon);
                  console.log(`[createInternal] Using existing coordinates: ${latitude}, ${longitude}`);
                } else if (site.location) {
                  // Coordinates are invalid, geocode again
                  console.log(`[createInternal] Coordinates invalid, geocoding: ${site.location}`);
                  try {
                    const coords = await this.geocodingService.geocodeAddress(site.location);
                    if (coords && coords.latitude && coords.longitude) {
                      latitude = coords.latitude;
                      longitude = coords.longitude;
                      console.log(`[createInternal] Geocoded coordinates: ${latitude}, ${longitude}`);
                      // Update the working site with the geocoded coordinates
                      await this.workingSitesRepository.query(
                        `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
                        [coords.latitude, coords.longitude, workingSiteName]
                      );
                      console.log(`[createInternal] Updated working site ${workingSiteName} with coordinates`);
                    } else {
                      console.error(`[createInternal] Geocoding failed for: ${site.location}`);
                    }
                  } catch (geocodeError) {
                    console.error(`[createInternal] Geocoding error:`, geocodeError);
                  }
                }
              } else if (site.location) {
                // Geocode the location if coordinates don't exist
                console.log(`[createInternal] No coordinates, geocoding: ${site.location}`);
                try {
                  const coords = await this.geocodingService.geocodeAddress(site.location);
                  if (coords && coords.latitude && coords.longitude) {
                    latitude = coords.latitude;
                    longitude = coords.longitude;
                    console.log(`[createInternal] Geocoded coordinates: ${latitude}, ${longitude}`);
                    // Update the working site with the geocoded coordinates
                    await this.workingSitesRepository.query(
                      `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
                      [coords.latitude, coords.longitude, workingSiteName]
                    );
                    console.log(`[createInternal] Updated working site ${workingSiteName} with coordinates`);
                  } else {
                    console.error(`[createInternal] Geocoding failed for: ${site.location}`);
                  }
                } catch (geocodeError) {
                  console.error(`[createInternal] Geocoding error:`, geocodeError);
                }
              }
            } else {
              console.warn(`[createInternal] Working site not found: ${workingSiteName}`);
            }
          } catch (error) {
            console.error('Error getting working site coordinates:', error);
            // Continue without coordinates
          }
        }

        // Update machinery to ACTIVE status and set location
        // Only update if we have valid coordinates
        if (latitude && longitude) {
          try {
            await this.machineryService.updateMachineryStatusAndLocation(
              machineNumber,
              'ACTIVE',
              latitude,
              longitude,
            );
            console.log(`Updated machinery ${machineNumber} to ACTIVE at location: ${latitude}, ${longitude}`);
          } catch (error) {
            console.error('Error updating machinery status/location:', error);
            // Continue even if update fails - operation is already saved
          }
        } else {
          console.warn(`Cannot update machinery ${machineNumber} location: coordinates are missing. Working site: ${workingSiteName}`);
          // Still update status to ACTIVE even without coordinates
          try {
            await this.machineryService.updateMachineryStatusAndLocation(
              machineNumber,
              'ACTIVE',
              null,
              null,
            );
          } catch (error) {
            console.error('Error updating machinery status:', error);
          }
        }
      }

      return savedOp;
    } catch (error) {
      console.error('Error in createInternal:', error);
      throw error;
    }
  }

  /**
   * Create an outsource operation
   */
  async createOutsource(
    createOutsourceDto: CreateOutsourceOperationDto,
  ): Promise<OutsourceOperation> {
    try {
      // Normalize empty strings to null
      const normalize = (value: string | null | undefined): string | null => {
        if (value === undefined || value === null || value === '') return null;
        return value.trim() || null;
      };

      // Use raw query to avoid TypeORM entity mapping issues
      const result = await this.outsourceOpsRepository.query(
        `INSERT INTO public.outsource_operations 
         (customer_name, outsourcer_name, machine_code, working_site_name, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, customer_name as "customerName", outsourcer_name as "outsourcerName", 
                   machine_code as "machineCode", working_site_name as "workingSiteName",
                   start_date as "startDate", end_date as "endDate"`,
        [
          normalize(createOutsourceDto.customerName),
          normalize(createOutsourceDto.outsourcerName),
          normalize(createOutsourceDto.machineCode),
          normalize(createOutsourceDto.workingSiteName),
          normalize(createOutsourceDto.startDate),
          normalize(createOutsourceDto.endDate),
        ]
      );

      if (!result || result.length === 0) {
        throw new Error('Failed to create outsource operation');
      }

      const savedOp = result[0] as OutsourceOperation;

      // Update machinery status and location if machineCode is provided
      const machineCode = normalize(createOutsourceDto.machineCode);
      if (machineCode) {
        try {
          const machinery = await this.machineryService.findByMachineCode(machineCode);
          if (machinery) {
            let latitude: string | null = null;
            let longitude: string | null = null;

            // Get working site coordinates if workingSiteName is provided
            const workingSiteName = normalize(createOutsourceDto.workingSiteName);
            if (workingSiteName) {
              try {
                // Use raw query to avoid TypeORM entity mapping issues
                const workingSiteResult = await this.workingSitesRepository.query(
                  `SELECT location, latitude, longitude FROM public.working_sites WHERE working_site_name = $1 LIMIT 1`,
                  [workingSiteName]
                );
                
                if (workingSiteResult && workingSiteResult.length > 0) {
                  const site = workingSiteResult[0];
                  console.log(`[createOutsource] Working site found: ${workingSiteName}, location: ${site.location}, lat: ${site.latitude}, lon: ${site.longitude}`);
                  
                  // If coordinates exist, use them; otherwise geocode the location
                  if (site.latitude && site.longitude) {
                    const lat = parseFloat(String(site.latitude));
                    const lon = parseFloat(String(site.longitude));
                    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
                      latitude = String(lat);
                      longitude = String(lon);
                      console.log(`[createOutsource] Using existing coordinates: ${latitude}, ${longitude}`);
                    } else if (site.location) {
                      // Coordinates are invalid, geocode again
                      console.log(`[createOutsource] Coordinates invalid, geocoding: ${site.location}`);
                      const coords = await this.geocodingService.geocodeAddress(site.location);
                      if (coords) {
                        latitude = coords.latitude;
                        longitude = coords.longitude;
                        console.log(`[createOutsource] Geocoded coordinates: ${latitude}, ${longitude}`);
                        // Update the working site with the geocoded coordinates
                        await this.workingSitesRepository.query(
                          `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
                          [coords.latitude, coords.longitude, workingSiteName]
                        );
                      }
                    }
                  } else if (site.location) {
                    // Geocode the location if coordinates don't exist
                    console.log(`[createOutsource] No coordinates, geocoding: ${site.location}`);
                    const coords = await this.geocodingService.geocodeAddress(site.location);
                    if (coords) {
                      latitude = coords.latitude;
                      longitude = coords.longitude;
                      console.log(`[createOutsource] Geocoded coordinates: ${latitude}, ${longitude}`);
                      // Update the working site with the geocoded coordinates
                      await this.workingSitesRepository.query(
                        `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
                        [coords.latitude, coords.longitude, workingSiteName]
                      );
                    }
                  }
                } else {
                  console.warn(`[createOutsource] Working site not found: ${workingSiteName}`);
                }
              } catch (error) {
                console.error('Error getting working site coordinates:', error);
                // Continue without coordinates
              }
            }

            // Update machinery to ACTIVE status and set location
            // Only update if we have valid coordinates
            if (machinery.machineNumber) {
              if (latitude && longitude) {
                try {
                  await this.machineryService.updateMachineryStatusAndLocation(
                    machinery.machineNumber,
                    'ACTIVE',
                    latitude,
                    longitude,
                  );
                  console.log(`Updated machinery ${machinery.machineNumber} to ACTIVE at location: ${latitude}, ${longitude}`);
                } catch (error) {
                  console.error('Error updating machinery status/location:', error);
                  // Continue even if update fails - operation is already saved
                }
              } else {
                console.warn(`Cannot update machinery ${machinery.machineNumber} location: coordinates are missing. Working site: ${workingSiteName}`);
                // Still update status to ACTIVE even without coordinates
                try {
                  await this.machineryService.updateMachineryStatusAndLocation(
                    machinery.machineNumber,
                    'ACTIVE',
                    null,
                    null,
                  );
                } catch (error) {
                  console.error('Error updating machinery status:', error);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error finding machinery by machine code:', error);
          // Continue even if machinery lookup fails - operation is already saved
        }
      }

      return savedOp;
    } catch (error) {
      console.error('Error in createOutsource:', error);
      throw error;
    }
  }

  async createService(
    createServiceDto: CreateServiceOperationDto,
  ): Promise<ServiceOperation> {
    const serviceOp = this.serviceOpsRepository.create({
      machineNumber: createServiceDto.machineNumber ?? null,
      type: createServiceDto.type ?? null,
      description: createServiceDto.description ?? null,
      usedParts: createServiceDto.usedParts ?? null,
    });
    return this.serviceOpsRepository.save(serviceOp);
  }

  async createTransportation(
    createTransportationDto: CreateTransportationOperationDto,
  ): Promise<TransportationOperation> {
    const transportationOp = this.transportationOpsRepository.create({
      plateNum: createTransportationDto.plateNum ?? null,
      startingLoc: createTransportationDto.startingLoc ?? null,
      endingLoc: createTransportationDto.endingLoc ?? null,
      operationDate: createTransportationDto.operationDate ?? null,
      notes: createTransportationDto.notes ?? null,
    });
    return this.transportationOpsRepository.save(transportationOp);
  }

  async removeInternal(id: string): Promise<void> {
    // Check if operation exists
    const operationCheck = await this.internalOpsRepository.query(
      `SELECT id, machine_number FROM public.internal_operations WHERE id = $1`,
      [id]
    );

    if (!operationCheck || operationCheck.length === 0) {
      throw new Error(`Internal operation with id ${id} not found`);
    }

    const operation = operationCheck[0];

    // Update machinery status to IDLE and location to garage if operation has machinery
    if (operation.machine_number) {
      try {
        await this.machineryService.updateMachineryStatusAndLocation(
          operation.machine_number,
          'IDLE',
          this.GARAGE_LAT,
          this.GARAGE_LON,
        );
      } catch (error) {
        console.error('Error updating machinery status/location on delete:', error);
        // Continue with deletion even if machinery update fails
      }
    }

    // Delete the operation
    await this.internalOpsRepository.query(
      `DELETE FROM public.internal_operations WHERE id = $1`,
      [id]
    );
  }

  async removeOutsource(id: string): Promise<void> {
    // Check if operation exists
    const operationCheck = await this.outsourceOpsRepository.query(
      `SELECT id, machine_code FROM public.outsource_operations WHERE id = $1`,
      [id]
    );

    if (!operationCheck || operationCheck.length === 0) {
      throw new Error(`Outsource operation with id ${id} not found`);
    }

    const operation = operationCheck[0];

    // Update machinery status to IDLE and location to garage if operation has machinery
    if (operation.machine_code) {
      try {
        const machinery = await this.machineryService.findByMachineCode(operation.machine_code);
        if (machinery && machinery.machineNumber) {
          await this.machineryService.updateMachineryStatusAndLocation(
            machinery.machineNumber,
            'IDLE',
            this.GARAGE_LAT,
            this.GARAGE_LON,
          );
        }
      } catch (error) {
        console.error('Error updating machinery status/location on delete:', error);
        // Continue with deletion even if machinery update fails
      }
    }

    // Delete the operation
    await this.outsourceOpsRepository.query(
      `DELETE FROM public.outsource_operations WHERE id = $1`,
      [id]
    );
  }

  async removeService(id: string): Promise<void> {
    // Check if operation exists
    const operationCheck = await this.serviceOpsRepository.query(
      `SELECT id FROM public.service_operations WHERE id = $1`,
      [id]
    );

    if (!operationCheck || operationCheck.length === 0) {
      throw new Error(`Service operation with id ${id} not found`);
    }

    // Delete the operation
    await this.serviceOpsRepository.query(
      `DELETE FROM public.service_operations WHERE id = $1`,
      [id]
    );
  }

  async removeTransportation(id: string): Promise<void> {
    // Check if operation exists
    const operationCheck = await this.transportationOpsRepository.query(
      `SELECT transportation_op_id FROM public.transportation_operations WHERE transportation_op_id = $1`,
      [id]
    );

    if (!operationCheck || operationCheck.length === 0) {
      throw new Error(`Transportation operation with id ${id} not found`);
    }

    // Delete the operation
    await this.transportationOpsRepository.query(
      `DELETE FROM public.transportation_operations WHERE transportation_op_id = $1`,
      [id]
    );
  }

  async updateInternal(id: string, updateDto: CreateInternalOperationDto): Promise<InternalOperation> {
    // Normalize empty strings to null
    const normalize = (value: string | null | undefined): string | null => {
      if (value === undefined || value === null || value === '') return null;
      return value.trim() || null;
    };

    // Check if operation exists
    const operationCheck = await this.internalOpsRepository.query(
      `SELECT id, machine_number FROM public.internal_operations WHERE id = $1`,
      [id]
    );

    if (!operationCheck || operationCheck.length === 0) {
      throw new Error(`Internal operation with id ${id} not found`);
    }

    // Update the operation using raw SQL
    await this.internalOpsRepository.query(
      `UPDATE public.internal_operations
       SET customer_name = $1, machine_number = $2, machine_code = $3, working_site_name = $4,
           start_date = $5, end_date = $6
       WHERE id = $7`,
      [
        normalize(updateDto.customerName),
        normalize(updateDto.machineNumber),
        normalize(updateDto.machineCode),
        normalize(updateDto.workingSiteName),
        normalize(updateDto.startDate),
        normalize(updateDto.endDate),
        id,
      ]
    );

    // Handle machinery status and location updates
    // If endDate is set, operation is closed - set machinery to IDLE
    // If endDate is null/empty, operation is active - set machinery to ACTIVE
    const machineNumber = normalize(updateDto.machineNumber);
    const endDate = normalize(updateDto.endDate);
    const isClosing = endDate !== null && endDate !== '';

    if (machineNumber) {
      if (isClosing) {
        // Operation is being closed - set machinery to IDLE and location to garage
        try {
          await this.machineryService.updateMachineryStatusAndLocation(
            machineNumber,
            'IDLE',
            this.GARAGE_LAT,
            this.GARAGE_LON,
          );
          console.log(`Updated machinery ${machineNumber} to IDLE (operation closed)`);
        } catch (error) {
          console.error('Error updating machinery status/location on close:', error);
        }
      } else {
        // Operation is active - set machinery to ACTIVE at working site location
        const workingSiteName = normalize(updateDto.workingSiteName);
        let latitude: string | null = null;
        let longitude: string | null = null;

        if (workingSiteName) {
          try {
            const site = await this.workingSitesRepository.findOne({
              where: { workingSiteName },
            });

            if (site) {
              if (site.latitude && site.longitude) {
                latitude = String(site.latitude);
                longitude = String(site.longitude);
              } else if (site.location) {
                const coords = await this.geocodingService.geocodeAddress(site.location);
                if (coords) {
                  latitude = coords.latitude;
                  longitude = coords.longitude;
                  await this.workingSitesRepository.query(
                    `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
                    [latitude, longitude, workingSiteName]
                  );
                }
              }
            }
          } catch (error) {
            console.error('Error getting working site coordinates:', error);
          }
        }

        if (latitude && longitude) {
          try {
            await this.machineryService.updateMachineryStatusAndLocation(
              machineNumber,
              'ACTIVE',
              latitude,
              longitude,
            );
            console.log(`Updated machinery ${machineNumber} to ACTIVE at ${latitude}, ${longitude}`);
          } catch (error) {
            console.error('Error updating machinery status/location:', error);
          }
        } else {
          try {
            await this.machineryService.updateMachineryStatusAndLocation(
              machineNumber,
              'ACTIVE',
              null,
              null,
            );
            console.log(`Updated machinery ${machineNumber} to ACTIVE (no coordinates)`);
          } catch (error) {
            console.error('Error updating machinery status:', error);
          }
        }
      }
    }

    const updated = await this.internalOpsRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Failed to retrieve updated internal operation ${id}`);
    }
    return updated;
  }

  async updateOutsource(id: string, updateDto: CreateOutsourceOperationDto): Promise<OutsourceOperation> {
    const normalize = (value: string | null | undefined): string | null => {
      if (value === undefined || value === null || value === '') return null;
      return value.trim() || null;
    };

    const operationCheck = await this.outsourceOpsRepository.query(
      `SELECT id FROM public.outsource_operations WHERE id = $1`,
      [id]
    );

    if (!operationCheck || operationCheck.length === 0) {
      throw new Error(`Outsource operation with id ${id} not found`);
    }

    await this.outsourceOpsRepository.query(
      `UPDATE public.outsource_operations
       SET customer_name = $1, outsourcer_name = $2, machine_code = $3, working_site_name = $4,
           start_date = $5, end_date = $6
       WHERE id = $7`,
      [
        normalize(updateDto.customerName),
        normalize(updateDto.outsourcerName),
        normalize(updateDto.machineCode),
        normalize(updateDto.workingSiteName),
        normalize(updateDto.startDate),
        normalize(updateDto.endDate),
        id,
      ]
    );

    // Handle machinery status and location updates
    // If endDate is set, operation is closed - set machinery to IDLE
    // If endDate is null/empty, operation is active - set machinery to ACTIVE
    const machineCode = normalize(updateDto.machineCode);
    const endDate = normalize(updateDto.endDate);
    const isClosing = endDate !== null && endDate !== '';

    if (machineCode) {
      try {
        const machinery = await this.machineryService.findByMachineCode(machineCode);
        if (machinery && machinery.machineNumber) {
          if (isClosing) {
            // Operation is being closed - set machinery to IDLE and location to garage
            try {
              await this.machineryService.updateMachineryStatusAndLocation(
                machinery.machineNumber,
                'IDLE',
                this.GARAGE_LAT,
                this.GARAGE_LON,
              );
              console.log(`Updated machinery ${machinery.machineNumber} to IDLE (operation closed)`);
            } catch (error) {
              console.error('Error updating machinery status/location on close:', error);
            }
          } else {
            // Operation is active - set machinery to ACTIVE at working site location
            const workingSiteName = normalize(updateDto.workingSiteName);
            let latitude: string | null = null;
            let longitude: string | null = null;

            if (workingSiteName) {
              try {
                const site = await this.workingSitesRepository.findOne({
                  where: { workingSiteName },
                });

                if (site) {
                  if (site.latitude && site.longitude) {
                    latitude = String(site.latitude);
                    longitude = String(site.longitude);
                  } else if (site.location) {
                    const coords = await this.geocodingService.geocodeAddress(site.location);
                    if (coords) {
                      latitude = coords.latitude;
                      longitude = coords.longitude;
                      await this.workingSitesRepository.query(
                        `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
                        [latitude, longitude, workingSiteName]
                      );
                    }
                  }
                }
              } catch (error) {
                console.error('Error getting working site coordinates:', error);
              }
            }

            if (latitude && longitude) {
              try {
                await this.machineryService.updateMachineryStatusAndLocation(
                  machinery.machineNumber,
                  'ACTIVE',
                  latitude,
                  longitude,
                );
                console.log(`Updated machinery ${machinery.machineNumber} to ACTIVE at ${latitude}, ${longitude}`);
              } catch (error) {
                console.error('Error updating machinery status/location:', error);
              }
            } else {
              try {
                await this.machineryService.updateMachineryStatusAndLocation(
                  machinery.machineNumber,
                  'ACTIVE',
                  null,
                  null,
                );
                console.log(`Updated machinery ${machinery.machineNumber} to ACTIVE (no coordinates)`);
              } catch (error) {
                console.error('Error updating machinery status:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error finding machinery by machine code:', error);
      }
    }

    const updated = await this.outsourceOpsRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Failed to retrieve updated outsource operation ${id}`);
    }
    return updated;
  }

  async updateService(id: string, updateDto: CreateServiceOperationDto): Promise<ServiceOperation> {
    const serviceOp = await this.serviceOpsRepository.findOne({ where: { id } });
    if (!serviceOp) {
      throw new Error(`Service operation with id ${id} not found`);
    }

    serviceOp.machineNumber = updateDto.machineNumber ?? null;
    serviceOp.type = updateDto.type ?? null;
    serviceOp.description = updateDto.description ?? null;
    serviceOp.usedParts = updateDto.usedParts ?? null;

    return this.serviceOpsRepository.save(serviceOp);
  }

  async updateTransportation(id: string, updateDto: CreateTransportationOperationDto): Promise<TransportationOperation> {
    const transportationOp = await this.transportationOpsRepository.findOne({ where: { transportationOpId: id } });
    if (!transportationOp) {
      throw new Error(`Transportation operation with id ${id} not found`);
    }

    transportationOp.plateNum = updateDto.plateNum ?? null;
    transportationOp.startingLoc = updateDto.startingLoc ?? null;
    transportationOp.endingLoc = updateDto.endingLoc ?? null;
    transportationOp.operationDate = updateDto.operationDate ?? null;
    transportationOp.notes = updateDto.notes ?? null;

    return this.transportationOpsRepository.save(transportationOp);
  }

  /**
   * Sync machinery locations with their active operations
   * This retroactively updates machinery coordinates for existing ACTIVE machinery
   */
  async syncMachineryLocations(): Promise<{ message: string; updated: number }> {
    let updatedCount = 0;

    try {
      // Get all active internal operations
      const activeInternalOps = await this.internalOpsRepository.query(
        `SELECT machine_number, working_site_name FROM public.internal_operations WHERE end_date IS NULL`
      );

      for (const op of activeInternalOps) {
        if (!op.machine_number || !op.working_site_name) continue;

        try {
          // Get working site coordinates
          const siteResult = await this.workingSitesRepository.query(
            `SELECT location, latitude, longitude FROM public.working_sites WHERE working_site_name = $1 LIMIT 1`,
            [op.working_site_name]
          );

          if (siteResult && siteResult.length > 0) {
            const site = siteResult[0];
            let latitude: string | null = null;
            let longitude: string | null = null;

            // Use existing coordinates or geocode
            if (site.latitude && site.longitude) {
              const lat = parseFloat(String(site.latitude));
              const lon = parseFloat(String(site.longitude));
              if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
                latitude = String(lat);
                longitude = String(lon);
              }
            }

            // If no valid coordinates, geocode
            if (!latitude || !longitude) {
              if (site.location) {
                console.log(`[syncMachineryLocations] Geocoding working site: ${op.working_site_name}, location: ${site.location}`);
                try {
                  const coords = await this.geocodingService.geocodeAddress(site.location);
                  console.log(`[syncMachineryLocations] Geocoding result for ${op.working_site_name}:`, coords);
                  if (coords && coords.latitude && coords.longitude) {
                    latitude = coords.latitude;
                    longitude = coords.longitude;
                    
                    // Update working site
                    const updateResult = await this.workingSitesRepository.query(
                      `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3 RETURNING latitude, longitude`,
                      [coords.latitude, coords.longitude, op.working_site_name]
                    );
                    console.log(`[syncMachineryLocations] Updated working site ${op.working_site_name}, result:`, updateResult);
                  } else {
                    console.warn(`[syncMachineryLocations] Geocoding returned null for ${op.working_site_name}`);
                  }
                } catch (geocodeError) {
                  console.error(`[syncMachineryLocations] Geocoding error for ${op.working_site_name}:`, geocodeError);
                }
              } else {
                console.warn(`[syncMachineryLocations] No location string for working site: ${op.working_site_name}`);
              }
            }

            // Update machinery if we have coordinates
            if (latitude && longitude) {
              console.log(`[syncMachineryLocations] Updating machinery ${op.machine_number} with coordinates: ${latitude}, ${longitude}`);
              try {
                await this.machineryService.updateMachineryStatusAndLocation(
                  op.machine_number,
                  'ACTIVE',
                  latitude,
                  longitude,
                );
                console.log(`[syncMachineryLocations] Successfully updated ${op.machine_number} to ${latitude}, ${longitude}`);
                updatedCount++;
              } catch (machineryError) {
                console.error(`[syncMachineryLocations] Error updating machinery ${op.machine_number}:`, machineryError);
              }
            } else {
              console.warn(`[syncMachineryLocations] Cannot update ${op.machine_number}: no coordinates available`);
            }
          } else {
            console.warn(`[syncMachineryLocations] Working site not found: ${op.working_site_name}`);
          }
        } catch (error) {
          console.error(`[syncMachineryLocations] Error updating ${op.machine_number}:`, error);
        }
      }

      // Get all active outsource operations
      const activeOutsourceOps = await this.outsourceOpsRepository.query(
        `SELECT machine_code, working_site_name FROM public.outsource_operations WHERE end_date IS NULL`
      );

      for (const op of activeOutsourceOps) {
        if (!op.machine_code || !op.working_site_name) continue;

        try {
          const machinery = await this.machineryService.findByMachineCode(op.machine_code);
          if (!machinery || !machinery.machineNumber) continue;

          // Get working site coordinates
          const siteResult = await this.workingSitesRepository.query(
            `SELECT location, latitude, longitude FROM public.working_sites WHERE working_site_name = $1 LIMIT 1`,
            [op.working_site_name]
          );

          if (siteResult && siteResult.length > 0) {
            const site = siteResult[0];
            let latitude: string | null = null;
            let longitude: string | null = null;

            // Use existing coordinates or geocode
            if (site.latitude && site.longitude) {
              const lat = parseFloat(String(site.latitude));
              const lon = parseFloat(String(site.longitude));
              if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
                latitude = String(lat);
                longitude = String(lon);
              }
            }

            // If no valid coordinates, geocode
            if (!latitude || !longitude) {
              if (site.location) {
                console.log(`[syncMachineryLocations] Geocoding working site: ${op.working_site_name}`);
                const coords = await this.geocodingService.geocodeAddress(site.location);
                if (coords && coords.latitude && coords.longitude) {
                  latitude = coords.latitude;
                  longitude = coords.longitude;
                  
                  // Update working site
                  await this.workingSitesRepository.query(
                    `UPDATE public.working_sites SET latitude = $1, longitude = $2 WHERE working_site_name = $3`,
                    [coords.latitude, coords.longitude, op.working_site_name]
                  );
                }
              }
            }

            // Update machinery if we have coordinates
            if (latitude && longitude) {
              await this.machineryService.updateMachineryStatusAndLocation(
                machinery.machineNumber,
                'ACTIVE',
                latitude,
                longitude,
              );
              console.log(`[syncMachineryLocations] Updated ${machinery.machineNumber} to ${latitude}, ${longitude}`);
              updatedCount++;
            }
          }
        } catch (error) {
          console.error(`[syncMachineryLocations] Error updating ${op.machine_code}:`, error);
        }
      }

      return {
        message: `Successfully synced ${updatedCount} machinery locations`,
        updated: updatedCount,
      };
    } catch (error) {
      console.error('[syncMachineryLocations] Error:', error);
      throw error;
    }
  }
}

