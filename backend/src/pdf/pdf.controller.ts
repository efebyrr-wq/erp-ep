import { Body, Controller, Post, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { CreatePricingOfferDto } from './dto/pricing-offer.dto.js';
import { CreateInvoiceDto } from './dto/invoice.dto.js';
import { CreateBillDto } from './dto/bill.dto.js';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('pricing-offer')
  @Header('Content-Type', 'application/pdf')
  async generatePricingOffer(
    @Body() dto: CreatePricingOfferDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const pdfBuffer = await this.pdfService.generatePricingOffer(dto);
      res.setHeader('Content-Disposition', 'attachment; filename="pricing-offer.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating pricing offer PDF:', error);
      res.status(500).json({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
      });
    }
  }

  @Post('invoice')
  @Header('Content-Type', 'application/pdf')
  async generateInvoice(
    @Body() dto: CreateInvoiceDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const pdfBuffer = await this.pdfService.generateInvoice(dto);
      res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      res.status(500).json({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
      });
    }
  }

  @Post('bill')
  @Header('Content-Type', 'application/pdf')
  async generateBill(
    @Body() dto: CreateBillDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const pdfBuffer = await this.pdfService.generateBill(dto);
      res.setHeader('Content-Disposition', 'attachment; filename="bill.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating bill PDF:', error);
      res.status(500).json({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
      });
    }
  }
}

