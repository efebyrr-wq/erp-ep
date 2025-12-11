import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as entities from './entities';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { WorkingSitesModule } from './working-sites/working-sites.module';
import { BillsModule } from './bills/bills.module';
import { AccountsModule } from './accounts/accounts.module';
import { InventoryModule } from './inventory/inventory.module';
import { MachineryModule } from './machinery/machinery.module';
import { OperationsModule } from './operations/operations.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CollectionsModule } from './collections/collections.module';
import { PaymentsModule } from './payments/payments.module';
import { PersonelModule } from './personel/personel.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { OutsourcersModule } from './outsourcers/outsourcers.module';
import { PdfModule } from './pdf/pdf.module';
import { TaxPaymentsModule } from './tax-payments/tax-payments.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseSetupModule } from './database/database-setup.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<number>('DB_PORT', 5432)),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'erp_2025'),
        schema: configService.get<string>('DB_SCHEMA', 'public'),
        synchronize: false,
        autoLoadEntities: false,
        entities: Object.values(entities),
        retryAttempts: 1,
        retryDelay: 1000,
        // Don't fail on connection errors - let services handle it
        logging: ['error', 'warn'],
        // Continue even if connection fails initially
        keepConnectionAlive: false,
        // Enable SSL for RDS connections (required for AWS RDS)
        ssl: process.env.NODE_ENV === 'production' || configService.get<string>('DB_HOST', 'localhost') !== 'localhost' ? {
          rejectUnauthorized: false
        } : false,
      }),
    }),
    CustomersModule,
    SuppliersModule,
    WorkingSitesModule,
    BillsModule,
    AccountsModule,
    InventoryModule,
    MachineryModule,
    OperationsModule,
    InvoicesModule,
    CollectionsModule,
    PaymentsModule,
    PersonelModule,
    VehiclesModule,
    OutsourcersModule,
    PdfModule,
    TaxPaymentsModule,
    AuthModule,
    DatabaseSetupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
