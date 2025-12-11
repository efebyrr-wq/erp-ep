import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { CreatePricingOfferDto } from './dto/pricing-offer.dto.js';
import { CreateInvoiceDto } from './dto/invoice.dto.js';
import { CreateBillDto } from './dto/bill.dto.js';

@Injectable()
export class PdfService {
  private readonly templatesPath: string;
  private readonly assetsPath: string;

  constructor() {
    // Try multiple possible paths for templates
    const possiblePaths = [
      path.join(process.cwd(), 'src', 'pdf', 'templates'), // Development
      path.join(__dirname, 'templates'), // Production (if templates copied to dist)
      path.join(process.cwd(), 'dist', 'src', 'pdf', 'templates'), // Development build
    ];

    // Find the first path that exists
    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        this.templatesPath = templatePath;
        break;
      }
    }

    // Fallback to src path
    if (!this.templatesPath) {
      this.templatesPath = path.join(process.cwd(), 'src', 'pdf', 'templates');
    }

    // Set assets path
    const possibleAssetPaths = [
      path.join(process.cwd(), 'src', 'pdf', 'assets'),
      path.join(__dirname, 'assets'),
      path.join(process.cwd(), 'dist', 'src', 'pdf', 'assets'),
    ];

    for (const assetPath of possibleAssetPaths) {
      if (fs.existsSync(assetPath)) {
        this.assetsPath = assetPath;
        break;
      }
    }

    if (!this.assetsPath) {
      this.assetsPath = path.join(process.cwd(), 'src', 'pdf', 'assets');
    }
  }

  private imageToBase64(imagePath: string): string | null {
    try {
      // If it's already a data URI, return as is
      if (imagePath.startsWith('data:')) {
        return imagePath;
      }

      // If it's a URL, return as is (Puppeteer can handle URLs)
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }

      // Try to find the image file
      let fullPath: string;
      
      // Check if it's an absolute path
      if (path.isAbsolute(imagePath)) {
        fullPath = imagePath;
      } else {
        // Try relative to assets directory
        fullPath = path.join(this.assetsPath, imagePath);
        
        // If not found, try relative to templates directory
        if (!fs.existsSync(fullPath)) {
          fullPath = path.join(path.dirname(this.templatesPath), 'assets', imagePath);
        }
        
        // If still not found, try relative to process.cwd()
        if (!fs.existsSync(fullPath)) {
          fullPath = path.join(process.cwd(), imagePath);
        }
      }

      if (fs.existsSync(fullPath)) {
        const imageBuffer = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase().slice(1);
        const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
        return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
      }

      return null;
    } catch (error) {
      console.error(`Error converting image to base64: ${imagePath}`, error);
      return null;
    }
  }

  private processTemplateData(data: any): any {
    const processed = { ...data };

    // Process from logo
    if (processed.from?.logo) {
      const base64Logo = this.imageToBase64(processed.from.logo);
      if (base64Logo) {
        processed.from.logo = base64Logo;
      }
    }

    // Process to logo if exists
    if (processed.to?.logo) {
      const base64Logo = this.imageToBase64(processed.to.logo);
      if (base64Logo) {
        processed.to.logo = base64Logo;
      }
    }

    return processed;
  }

  async generatePricingOffer(dto: CreatePricingOfferDto): Promise<Buffer> {
    const templatePath = path.join(this.templatesPath, 'pricing-offer.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}. Templates path: ${this.templatesPath}`);
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Register Handlebars helpers
    Handlebars.registerHelper('add', (a, b) => a + b);
    
    // Process template data to convert image paths to base64
    const processedData = this.processTemplateData(dto);
    
    const template = Handlebars.compile(templateContent);
    const html = template(processedData);

    return this.generatePdf(html);
  }

  async generateInvoice(dto: CreateInvoiceDto): Promise<Buffer> {
    const templatePath = path.join(this.templatesPath, 'invoice.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}. Templates path: ${this.templatesPath}`);
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Register Handlebars helpers
    Handlebars.registerHelper('add', (a, b) => a + b);
    
    // Process template data to convert image paths to base64
    const processedData = this.processTemplateData(dto);
    
    const template = Handlebars.compile(templateContent);
    const html = template(processedData);

    return this.generatePdf(html);
  }

  async generateBill(dto: CreateBillDto): Promise<Buffer> {
    const templatePath = path.join(this.templatesPath, 'bill.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}. Templates path: ${this.templatesPath}`);
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Register Handlebars helpers
    Handlebars.registerHelper('add', (a, b) => a + b);
    
    const template = Handlebars.compile(templateContent);
    const html = template(dto);

    return this.generatePdf(html);
  }

  private async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Wait for images to load
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for all images to be loaded
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images, (img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve); // Don't fail on image errors
            });
          })
        );
      }).catch(() => {
        // Ignore errors
      });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}

