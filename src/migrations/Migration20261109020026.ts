import { Migration } from '@mikro-orm/migrations';

export class Migration20261109020026 extends Migration {

  override name = 'Migration20261109020026';

  override up(): void | Promise<void> {
    this.addSql(`alter table "wallet_ledger_entries" add "currency" varchar(3) not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "wallet_ledger_entries" drop column "currency";`);
  }

}
