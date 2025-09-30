import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMultiTenantTables1695148800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        phone varchar(20),
        email varchar(255),
        tags text[],
        preferences json,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
      ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE customers FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_isolation ON customers USING (tenant_id = current_setting('app.current_tenant')::uuid);

      CREATE TABLE leads (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        customer_id uuid NOT NULL,
        source varchar(100) NOT NULL,
        status varchar(50) NOT NULL,
        service_interest varchar(100),
        notes text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
      ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
      ALTER TABLE leads FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_isolation ON leads USING (tenant_id = current_setting('app.current_tenant')::uuid);

      CREATE TABLE services (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        description text,
        duration_minutes int NOT NULL,
        price decimal(10,2) NOT NULL,
        active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX idx_services_tenant_id ON services(tenant_id);
      ALTER TABLE services ENABLE ROW LEVEL SECURITY;
      ALTER TABLE services FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_isolation ON services USING (tenant_id = current_setting('app.current_tenant')::uuid);

      CREATE TABLE staff (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        email varchar(255),
        availability_schedule json,
        active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX idx_staff_tenant_id ON staff(tenant_id);
      ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
      ALTER TABLE staff FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_isolation ON staff USING (tenant_id = current_setting('app.current_tenant')::uuid);

      CREATE TABLE appointments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        customer_id uuid NOT NULL,
        staff_id uuid NOT NULL,
        service_id uuid NOT NULL,
        start_time timestamptz NOT NULL,
        end_time timestamptz NOT NULL,
        status varchar(50) NOT NULL,
        notes text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
      ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_isolation ON appointments USING (tenant_id = current_setting('app.current_tenant')::uuid);

      CREATE TABLE payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        appointment_id uuid NOT NULL,
        amount decimal(10,2) NOT NULL,
        currency varchar(10) NOT NULL,
        status varchar(50) NOT NULL,
        provider varchar(50) NOT NULL,
        transaction_id varchar(100),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payments FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_isolation ON payments USING (tenant_id = current_setting('app.current_tenant')::uuid);

      CREATE TABLE messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        customer_id uuid NOT NULL,
        channel varchar(50) NOT NULL,
        direction varchar(20) NOT NULL,
        content text NOT NULL,
        metadata json,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE messages FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_isolation ON messages USING (tenant_id = current_setting('app.current_tenant')::uuid);

      CREATE TABLE campaigns (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        type varchar(50) NOT NULL,
        trigger_conditions json,
        message_template text NOT NULL,
        active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX idx_campaigns_tenant_id ON campaigns(tenant_id);
      ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE campaigns FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_isolation ON campaigns USING (tenant_id = current_setting('app.current_tenant')::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS customers, leads, services, staff, appointments, payments, messages, campaigns CASCADE;
    `);
  }
}
