import { Migration } from '@mikro-orm/migrations';

export class Migration20261109015617 extends Migration {

  override name = 'Migration20261109015617';

  override up(): void | Promise<void> {
    this.addSql(`alter table "wager_transactions" add "currency" varchar(3) not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "wager_transactions" drop column "currency";`);
  }

}
