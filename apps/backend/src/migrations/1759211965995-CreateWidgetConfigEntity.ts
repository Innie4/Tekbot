import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWidgetConfigEntity1759211965995
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create widget_configs table
    await queryRunner.query(`
            CREATE TABLE "widget_configs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" character varying NOT NULL,
                "title" character varying(255) NOT NULL DEFAULT 'Chat with us',
                "welcomeMessage" text,
                "placeholder" text,
                "position" character varying(20) NOT NULL DEFAULT 'bottom-right',
                "theme" json NOT NULL DEFAULT '{}',
                "branding" json NOT NULL DEFAULT '{}',
                "behavior" json NOT NULL DEFAULT '{}',
                "security" json NOT NULL DEFAULT '{}',
                "isActive" boolean NOT NULL DEFAULT true,
                "version" character varying(50) NOT NULL DEFAULT 'v1',
                "customFields" json,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_widget_configs" PRIMARY KEY ("id")
            )
        `);

    // Create index for tenantId
    await queryRunner.query(
      `CREATE INDEX "IDX_widget_configs_tenantId" ON "widget_configs" ("tenantId")`,
    );

    // Add foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "widget_configs" 
            ADD CONSTRAINT "FK_widget_configs_tenant" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
        `);

    // Create unique constraint for one config per tenant
    await queryRunner.query(`
            ALTER TABLE "widget_configs" 
            ADD CONSTRAINT "UQ_widget_configs_tenantId" 
            UNIQUE ("tenantId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop constraints and indexes
    await queryRunner.query(
      `ALTER TABLE "widget_configs" DROP CONSTRAINT "UQ_widget_configs_tenantId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "widget_configs" DROP CONSTRAINT "FK_widget_configs_tenant"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_widget_configs_tenantId"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "widget_configs"`);
  }
}
