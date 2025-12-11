import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { WorkingSite } from '../entities';
import { WorkingSitesService } from './working-sites.service';
import { CreateWorkingSiteDto } from './dto/create-working-site.dto';

@Controller('working-sites')
export class WorkingSitesController {
  constructor(private readonly workingSitesService: WorkingSitesService) {}

  @Get()
  async findAll(): Promise<WorkingSite[]> {
    return this.workingSitesService.findAll();
  }

  @Post()
  async create(@Body() createWorkingSiteDto: CreateWorkingSiteDto): Promise<WorkingSite> {
    return this.workingSitesService.create(createWorkingSiteDto);
  }

  @Patch(':name/geocode')
  async updateCoordinates(@Param('name') name: string): Promise<WorkingSite | null> {
    return this.workingSitesService.updateCoordinates(name);
  }

  @Patch(':name/coordinates')
  async setCoordinates(
    @Param('name') name: string,
    @Body() body: { latitude: string; longitude: string },
  ): Promise<WorkingSite | null> {
    return this.workingSitesService.setCoordinates(name, body.latitude, body.longitude);
  }

  @Post('batch-update-coordinates')
  async batchUpdateCoordinates(
    @Body() body: Array<{ workingSiteName: string; latitude: string; longitude: string }>,
  ): Promise<{ message: string; updated: number }> {
    let updated = 0;
    for (const site of body) {
      try {
        await this.workingSitesService.setCoordinates(
          site.workingSiteName,
          site.latitude,
          site.longitude,
        );
        updated++;
      } catch (error) {
        console.error(`Error updating ${site.workingSiteName}:`, error);
      }
    }
    return { message: `Updated ${updated} working sites`, updated };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.workingSitesService.remove(id);
    return { message: 'Working site deleted successfully' };
  }
}







