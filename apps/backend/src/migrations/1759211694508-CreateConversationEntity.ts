import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateConversationEntity1759211694508 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create conversations table
        await queryRunner.query(`
            CREATE TABLE "conversations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" character varying NOT NULL,
                "customerId" character varying,
                "title" character varying(255),
                "status" character varying(50) NOT NULL DEFAULT 'active',
                "channel" character varying(50) NOT NULL DEFAULT 'web',
                "metadata" json,
                "sessionId" character varying(255),
                "userAgent" character varying(255),
                "ipAddress" character varying(45),
                "referrer" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "last_activity_at" TIMESTAMP,
                CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for conversations
        await queryRunner.query(`CREATE INDEX "IDX_conversations_tenantId" ON "conversations" ("tenantId")`);
        await queryRunner.query(`CREATE INDEX "IDX_conversations_customerId" ON "conversations" ("customerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_conversations_status" ON "conversations" ("status")`);

        // Add foreign key constraints for conversations
        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD CONSTRAINT "FK_conversations_tenant" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD CONSTRAINT "FK_conversations_customer" 
            FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE
        `);

        // Add conversationId column to messages table
        await queryRunner.query(`ALTER TABLE "messages" ADD "conversationId" character varying NOT NULL`);

        // Create index for conversationId in messages
        await queryRunner.query(`CREATE INDEX "IDX_messages_conversationId" ON "messages" ("conversationId")`);

        // Add foreign key constraint for messages -> conversations
        await queryRunner.query(`
            ALTER TABLE "messages" 
            ADD CONSTRAINT "FK_messages_conversation" 
            FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE
        `);

        // Make customerId nullable in messages table
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "customerId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert messages table changes
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "customerId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_conversation"`);
        await queryRunner.query(`DROP INDEX "IDX_messages_conversationId"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "conversationId"`);

        // Drop conversations table
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_customer"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_tenant"`);
        await queryRunner.query(`DROP INDEX "IDX_conversations_status"`);
        await queryRunner.query(`DROP INDEX "IDX_conversations_customerId"`);
        await queryRunner.query(`DROP INDEX "IDX_conversations_tenantId"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
    }

}
