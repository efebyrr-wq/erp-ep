import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  PaymentsCheck,
  PaymentCreditCard,
  PaymentsCash,
} from '../entities';
import { PaymentsService } from './payments.service';
import { CreatePaymentCheckDto } from './dto/create-payment-check.dto';
import { UpdatePaymentCheckDto } from './dto/update-payment-check.dto';
import { CreatePaymentCreditCardDto } from './dto/create-payment-credit-card.dto';
import { UpdatePaymentCreditCardDto } from './dto/update-payment-credit-card.dto';
import { CreatePaymentCashDto } from './dto/create-payment-cash.dto';
import { UpdatePaymentCashDto } from './dto/update-payment-cash.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('check')
  async findAllCheck(): Promise<PaymentsCheck[]> {
    try {
      return await this.paymentsService.findAllCheck();
    } catch (error: any) {
      console.error('[PaymentsController] Error in findAllCheck:', error);
      return [];
    }
  }

  @Post('check')
  async createCheck(@Body() dto: CreatePaymentCheckDto): Promise<PaymentsCheck> {
    return this.paymentsService.createCheck(dto);
  }

  @Patch('check/:id')
  async updateCheck(@Param('id') id: string, @Body() dto: UpdatePaymentCheckDto): Promise<PaymentsCheck> {
    return this.paymentsService.updateCheck(id, dto);
  }

  @Delete('check/:id')
  async removeCheck(@Param('id') id: string): Promise<{ message: string }> {
    await this.paymentsService.removeCheck(id);
    return { message: 'Payment check deleted successfully' };
  }

  @Get('credit-card')
  async findAllCreditCard(): Promise<PaymentCreditCard[]> {
    try {
      return await this.paymentsService.findAllCreditCard();
    } catch (error: any) {
      console.error('[PaymentsController] Error in findAllCreditCard:', error);
      return [];
    }
  }

  @Post('credit-card')
  async createCreditCard(@Body() dto: CreatePaymentCreditCardDto): Promise<PaymentCreditCard> {
    return this.paymentsService.createCreditCard(dto);
  }

  @Patch('credit-card/:id')
  async updateCreditCard(@Param('id') id: string, @Body() dto: UpdatePaymentCreditCardDto): Promise<PaymentCreditCard> {
    return this.paymentsService.updateCreditCard(id, dto);
  }

  @Delete('credit-card/:id')
  async removeCreditCard(@Param('id') id: string): Promise<{ message: string }> {
    await this.paymentsService.removeCreditCard(id);
    return { message: 'Payment credit card deleted successfully' };
  }

  @Get('cash')
  async findAllCash(): Promise<PaymentsCash[]> {
    try {
      return await this.paymentsService.findAllCash();
    } catch (error: any) {
      console.error('[PaymentsController] Error in findAllCash:', error);
      return [];
    }
  }

  @Post('cash')
  async createCash(@Body() dto: CreatePaymentCashDto): Promise<PaymentsCash> {
    return this.paymentsService.createCash(dto);
  }

  @Patch('cash/:id')
  async updateCash(@Param('id') id: string, @Body() dto: UpdatePaymentCashDto): Promise<PaymentsCash> {
    return this.paymentsService.updateCash(id, dto);
  }

  @Delete('cash/:id')
  async removeCash(@Param('id') id: string): Promise<{ message: string }> {
    await this.paymentsService.removeCash(id);
    return { message: 'Payment cash deleted successfully' };
  }
}

