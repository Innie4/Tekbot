import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Entities
import { Tenant, TenantPlan, TenantStatus } from '../src/modules/tenants/entities/tenant.entity';
import { User, UserRole, UserStatus } from '../src/modules/users/entities/user.entity';
import { Customer } from '../src/modules/customers/entities/customer.entity';
import { Conversation } from '../src/modules/conversations/entities/conversation.entity';
import { Message } from '../src/modules/messages/entities/message.entity';
import { WidgetConfig } from '../src/modules/widget-config/entities/widget-config.entity';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // Register only the entities we need for seeding to keep it simple
  entities: [Tenant, User, Customer, Conversation, Message, WidgetConfig],
  synchronize: true, // create tables according to entities in dev
  logging: false,
});

async function upsertTenant(ds: DataSource) {
  const repo = ds.getRepository(Tenant);
  const existing = await repo.findOne({ where: { subdomain: 'tekbot' } });
  if (existing) return existing;

  const tenant = repo.create({
    id: uuidv4(),
    name: 'TekBot Test',
    subdomain: 'tekbot',
    domain: 'localhost',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.FREE,
    settings: { locale: 'en-US' },
    features: ['chat', 'widgets'],
    limits: { users: 10 },
  });
  return repo.save(tenant);
}

async function upsertAdmin(ds: DataSource, tenantId: string) {
  const repo = ds.getRepository(User);
  const email = 'admin@tekbot.com';
  const existing = await repo.findOne({ where: { email } });
  if (existing) return existing;

  const passwordHash = await hash('password123', 10);
  const admin = repo.create({
    id: uuidv4(),
    firstName: 'Admin',
    lastName: 'User',
    email,
    password: passwordHash,
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    tenantId,
  });
  return repo.save(admin);
}

async function upsertCustomer(ds: DataSource, tenantId: string) {
  const repo = ds.getRepository(Customer);
  const email = 'customer@example.com';
  const existing = await repo.findOne({ where: { tenantId, email } });
  if (existing) return existing;

  const customer = repo.create({
    id: uuidv4(),
    tenantId,
    name: 'John Doe',
    phone: '1234567890',
    email,
    tags: ['test', 'demo'],
    preferences: { contact: 'email' },
  });
  return repo.save(customer);
}

async function upsertWidgetConfig(ds: DataSource, tenantId: string) {
  const repo = ds.getRepository(WidgetConfig);
  const existing = await repo.findOne({ where: { tenantId } });
  if (existing) return existing;

  const config = repo.create({
    id: uuidv4(),
    tenantId,
    title: 'Chat with us',
    welcomeMessage: 'Hi! How can we help you today?',
    position: 'bottom-right',
    theme: { primaryColor: '#4f46e5', textColor: '#111827' },
    branding: { companyName: 'TekBot' },
    behavior: { autoOpen: false },
    security: { allowedDomains: ['localhost'] },
    isActive: true,
    version: 'v1',
  });
  return repo.save(config);
}

async function createConversationWithMessage(ds: DataSource, tenantId: string, customerId: string) {
  const convoRepo = ds.getRepository(Conversation);
  const msgRepo = ds.getRepository(Message);

  const convo = convoRepo.create({
    id: uuidv4(),
    tenantId,
    customerId,
    title: 'Welcome conversation',
    status: 'active',
    channel: 'web',
    metadata: { seeded: true },
  });
  await convoRepo.save(convo);

  const message = msgRepo.create({
    id: uuidv4(),
    tenantId,
    conversationId: convo.id,
    customerId,
    channel: 'web',
    direction: 'incoming',
    content: 'Hello, I need some help!',
    metadata: { seeded: true },
  });
  await msgRepo.save(message);

  return convo;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  await dataSource.initialize();

  // Ensure UUID extensions (safe no-op if exists)
  try {
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  } catch (e) {
    // Ignore if not permitted; we generate UUIDs in app anyway
  }

  const tenant = await upsertTenant(dataSource);
  await upsertAdmin(dataSource, tenant.id);
  const customer = await upsertCustomer(dataSource, tenant.id);
  await upsertWidgetConfig(dataSource, tenant.id);
  await createConversationWithMessage(dataSource, tenant.id, customer.id);

  console.log('Seeding complete.');
  await dataSource.destroy();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });