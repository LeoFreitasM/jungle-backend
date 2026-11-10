import { Migration } from '@mikro-orm/migrations';

export class Migration20261109030000 extends Migration {
  override up(): void {
    this.addSql(`
      alter table "wager_transactions"
      add column "balance_after" numeric(19, 2) null;
    `);

    this.addSql(`
      create unique index if not exists "uq_wager_provider_external"
      on "wager_transactions" ("provider_id", "external_transaction_id")
      where "provider_id" is not null
        and "external_transaction_id" is not null;
    `);

    this.addSql(`
      create unique index if not exists "uq_wager_reference_kind"
      on "wager_transactions" ("reference_transaction_id", "kind")
      where "reference_transaction_id" is not null;
    `);
  }

  override down(): void {
    this.addSql(`
      drop index if exists "uq_wager_reference_kind";
    `);

    this.addSql(`
      drop index if exists "uq_wager_provider_external";
    `);

    this.addSql(`
      alter table "wager_transactions"
      drop column if exists "balance_after";
    `);
  }
}