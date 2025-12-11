import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Account } from '../entities';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll(): Promise<Account[]> {
    return this.accountsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateAccountDto): Promise<Account> {
    return this.accountsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAccountDto): Promise<Account> {
    return this.accountsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.accountsService.remove(id);
    return { message: 'Account deleted successfully' };
  }
}



