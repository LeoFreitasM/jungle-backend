
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { createObserveModule } from '@nestjs/observe';
import { WalletEntity } from './infrastructure/database/entities/wallet.entities.js';
import { WagerTransactionEntity } from './infrastructure/database/entities/wager-transaction.entity.js';
import { WalletRepository } from './infrastructure/database/repositories/wallet.repository.js';
import { WagerTransactionRepository } from './infrastructure/database/repositories/wager-transaction.repository.js';
import { WalletLedgerEntryRepository } from './infrastructure/database/repositories/wallet-ledger-entry.repository.js';
import { WagerProcessorService } from './services/wager-processor.service.js';
import { WagerPersistenceService } from './services/wager-persistence.service.js';
import { WagerController } from './controllers/wager.controller.js';
import { WalletController } from './controllers/wallet.controller.js';

import { WalletLedgerEntryEntity } from './infrastructure/database/entities/wallet-ledger-entry.entity.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dbName: configService.getOrThrow<string>('DB_NAME'),
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        user: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        metadataProvider: ReflectMetadataProvider,
       entities: [
        WalletEntity,
        WagerTransactionEntity,
        WalletLedgerEntryEntity,
      ],
      }),
    }),

    ObserveModule.forRoot({
      serviceId: 'jungle-backend',
    }),
  ],
  controllers: [AppController, WagerController, WalletController],
  providers: [
    AppService,
    WalletRepository,
    WagerTransactionRepository,
    WalletLedgerEntryRepository,
    WagerProcessorService,
    WagerPersistenceService,
  ],
})
export class AppModule {}
