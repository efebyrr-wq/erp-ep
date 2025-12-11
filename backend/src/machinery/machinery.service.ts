import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machinery, MachinerySpec } from '../entities';
import { CreateMachineryDto, UpdateMachineryDto, CreateMachinerySpecDto, UpdateMachinerySpecDto } from './dto';

@Injectable()
export class MachineryService {
  constructor(
    @InjectRepository(Machinery)
    private readonly machineryRepository: Repository<Machinery>,
    @InjectRepository(MachinerySpec)
    private readonly machinerySpecRepository: Repository<MachinerySpec>,
  ) {}

  async findAll(): Promise<Machinery[]> {
    // Check if latitude/longitude columns exist
    const columnCheck = await this.machineryRepository.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'machinery' 
        AND column_name IN ('latitude', 'longitude')
    `);
    const hasLocationColumns = columnCheck.length === 2;

    let result: any[];
    if (hasLocationColumns) {
      result = await this.machineryRepository.query(`
        SELECT 
          id,
          machine_number as "machineNumber",
          machine_code as "machineCode",
          status,
          latitude,
          longitude,
          created_at as "createdAt"
        FROM public.machinery
        ORDER BY machine_number ASC
      `);
    } else {
      result = await this.machineryRepository.query(`
        SELECT 
          id,
          machine_number as "machineNumber",
          machine_code as "machineCode",
          status,
          created_at as "createdAt"
        FROM public.machinery
        ORDER BY machine_number ASC
      `);
    }
    
    // Get specs for each machinery
    const machineryWithSpecs = await Promise.all(
      result.map(async (m: any) => {
        const specs = await this.machinerySpecRepository.find({
          where: { machineryId: m.id },
        });
        return {
          ...m,
          specs,
          latitude: m.latitude ?? null,
          longitude: m.longitude ?? null,
        };
      })
    );
    
    return machineryWithSpecs as Machinery[];
  }

  async create(createMachineryDto: CreateMachineryDto): Promise<Machinery> {
    // Check if latitude/longitude columns exist
    const columnCheck = await this.machineryRepository.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'machinery' 
        AND column_name IN ('latitude', 'longitude')
    `);
    const hasLocationColumns = columnCheck.length === 2;

    let result: any[];
    if (hasLocationColumns) {
      result = await this.machineryRepository.query(
        `INSERT INTO public.machinery (machine_number, machine_code, status, latitude, longitude)
         VALUES ($1, $2, $3, NULL, NULL)
         RETURNING id, machine_number as "machineNumber", machine_code as "machineCode", status, latitude, longitude, created_at as "createdAt"`,
        [createMachineryDto.machineNumber, createMachineryDto.machineCode, createMachineryDto.status ?? null]
      );
    } else {
      result = await this.machineryRepository.query(
        `INSERT INTO public.machinery (machine_number, machine_code, status)
         VALUES ($1, $2, $3)
         RETURNING id, machine_number as "machineNumber", machine_code as "machineCode", status, created_at as "createdAt"`,
        [createMachineryDto.machineNumber, createMachineryDto.machineCode, createMachineryDto.status ?? null]
      );
    }

    return {
      ...result[0],
      latitude: result[0].latitude ?? null,
      longitude: result[0].longitude ?? null,
      specs: [],
    } as Machinery;
  }

  async update(id: string, updateMachineryDto: UpdateMachineryDto): Promise<Machinery> {
    // Check if latitude/longitude columns exist
    const columnCheck = await this.machineryRepository.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'machinery' 
        AND column_name IN ('latitude', 'longitude')
    `);
    const hasLocationColumns = columnCheck.length === 2;

    // Get existing machinery using raw query
    const existing = await this.machineryRepository.query(
      `SELECT id, machine_number as "machineNumber", machine_code as "machineCode", status${hasLocationColumns ? ', latitude, longitude' : ''}
       FROM public.machinery WHERE id = $1`,
      [id]
    );

    if (!existing || existing.length === 0) {
      throw new NotFoundException(`Machinery with id ${id} not found`);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateMachineryDto.machineNumber !== undefined) {
      updates.push(`machine_number = $${paramIndex++}`);
      values.push(updateMachineryDto.machineNumber);
    }
    if (updateMachineryDto.machineCode !== undefined) {
      updates.push(`machine_code = $${paramIndex++}`);
      values.push(updateMachineryDto.machineCode);
    }
    if (updateMachineryDto.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(updateMachineryDto.status ?? null);
    }

    if (updates.length > 0) {
      values.push(id);
      await this.machineryRepository.query(
        `UPDATE public.machinery SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    // Get updated machinery with specs
    const updated = await this.machineryRepository.query(
      `SELECT id, machine_number as "machineNumber", machine_code as "machineCode", status${hasLocationColumns ? ', latitude, longitude' : ''}
       FROM public.machinery WHERE id = $1`,
      [id]
    );
    const specs = await this.machinerySpecRepository.find({
      where: { machineryId: id },
    });

    return {
      ...updated[0],
      latitude: updated[0].latitude ?? null,
      longitude: updated[0].longitude ?? null,
      specs,
    } as Machinery;
  }

  async remove(id: string): Promise<void> {
    await this.machineryRepository.delete(id);
  }

  async createSpec(machineryId: string, createSpecDto: CreateMachinerySpecDto): Promise<MachinerySpec> {
    const machinery = await this.machineryRepository.findOne({ where: { id: machineryId } });
    if (!machinery) {
      throw new NotFoundException(`Machinery with id ${machineryId} not found`);
    }

    const spec = this.machinerySpecRepository.create({
      machineryId,
      specName: createSpecDto.specName,
      specValue: createSpecDto.specValue,
    });

    return this.machinerySpecRepository.save(spec);
  }

  async updateSpec(specId: string, updateSpecDto: UpdateMachinerySpecDto): Promise<MachinerySpec> {
    const spec = await this.machinerySpecRepository.findOne({ where: { id: specId } });
    if (!spec) {
      throw new NotFoundException(`Machinery spec with id ${specId} not found`);
    }

    if (updateSpecDto.specName !== undefined) {
      spec.specName = updateSpecDto.specName;
    }
    if (updateSpecDto.specValue !== undefined) {
      spec.specValue = updateSpecDto.specValue;
    }

    return this.machinerySpecRepository.save(spec);
  }

  async removeSpec(specId: string): Promise<void> {
    await this.machinerySpecRepository.delete(specId);
  }

  async updateMachineryStatusAndLocation(
    machineNumber: string,
    status: string | null,
    latitude: string | null,
    longitude: string | null,
  ): Promise<Machinery | null> {
    // Check if latitude/longitude columns exist
    const columnCheck = await this.machineryRepository.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'machinery' 
        AND column_name IN ('latitude', 'longitude')
    `);
    const hasLocationColumns = columnCheck.length === 2;

    // Check if machinery exists using raw query
    const existing = await this.machineryRepository.query(
      `SELECT id FROM public.machinery WHERE machine_number = $1`,
      [machineNumber]
    );

    if (!existing || existing.length === 0) {
      return null;
    }

    // If columns don't exist, try to add them
    if (!hasLocationColumns) {
      try {
        await this.machineryRepository.query(`
          ALTER TABLE public.machinery 
          ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
          ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7)
        `);
      } catch (migrationError) {
        console.error('Failed to add location columns:', migrationError);
      }
    }

    // Update machinery using raw query
    if (hasLocationColumns || columnCheck.length > 0) {
      // Columns exist or were just added
      await this.machineryRepository.query(
        `UPDATE public.machinery 
         SET status = $1, latitude = $2, longitude = $3 
         WHERE machine_number = $4`,
        [status, latitude, longitude, machineNumber]
      );
    } else {
      // Only update status if columns don't exist
      await this.machineryRepository.query(
        `UPDATE public.machinery 
         SET status = $1 
         WHERE machine_number = $2`,
        [status, machineNumber]
      );
    }

    // Return updated machinery
    const result = await this.machineryRepository.query(
      `SELECT id, machine_number as "machineNumber", machine_code as "machineCode", status${hasLocationColumns || columnCheck.length > 0 ? ', latitude, longitude' : ''}
       FROM public.machinery WHERE machine_number = $1`,
      [machineNumber]
    );

    if (!result || result.length === 0) {
      return null;
    }

    return {
      ...result[0],
      latitude: result[0].latitude ?? null,
      longitude: result[0].longitude ?? null,
      specs: [],
    } as Machinery;
  }

  async findByMachineCode(machineCode: string): Promise<Machinery | null> {
    return this.machineryRepository.findOne({
      where: { machineCode },
    });
  }
}




