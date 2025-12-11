import { Controller, Get } from '@nestjs/common';
import { Inventory } from '../entities';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(): Promise<Inventory[]> {
    return this.inventoryService.findAll();
  }
}











