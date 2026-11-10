import 'dotenv/config';

import { defineConfig } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

import { WalletEntity } from './infrastructure/database/entities/wallet.entities.js';
import { WagerTransactionEntity } from './infrastructure/database/entities/wager-transaction.entity.js';
import { WalletLedgerEntryEntity } from './infrastructure/database/entities/wallet-ledger-entry.entity.js';

export default defineConfig({
  dbName: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  metadataProvider: ReflectMetadataProvider,

  entities: [
    WalletEntity,
    WagerTransactionEntity,
    WalletLedgerEntryEntity,
  ],

  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
});