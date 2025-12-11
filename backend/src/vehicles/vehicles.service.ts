import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../entities';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      order: {
        plateNumber: 'ASC',
      },
    });
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create({
      plateNumber: createVehicleDto.plateNumber ?? null,
      vehicleType: createVehicleDto.vehicleType ?? null,
      examinationDate: createVehicleDto.examinationDate ?? null,
      insuranceDate: createVehicleDto.insuranceDate ?? null,
    });
    return this.vehicleRepository.save(vehicle);
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with id ${id} not found`);
    }

    if (updateVehicleDto.plateNumber !== undefined) {
      vehicle.plateNumber = updateVehicleDto.plateNumber ?? null;
    }
    if (updateVehicleDto.vehicleType !== undefined) {
      vehicle.vehicleType = updateVehicleDto.vehicleType ?? null;
    }
    if (updateVehicleDto.examinationDate !== undefined) {
      vehicle.examinationDate = updateVehicleDto.examinationDate ?? null;
    }
    if (updateVehicleDto.insuranceDate !== undefined) {
      vehicle.insuranceDate = updateVehicleDto.insuranceDate ?? null;
    }

    await this.vehicleRepository.save(vehicle);
    return vehicle;
  }

  async remove(id: string): Promise<void> {
    await this.vehicleRepository.delete(id);
  }
}





