import mongoose from 'mongoose';

import { connectDatabase } from '../config/db';
import logger from '../config/logger';
import { Client } from '../models/Client';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';

import { seedUsers, seedClients, seedInvoices } from './data';

// Clear all data from collections
async function clearDatabase(): Promise<void> {
  logger.info('Clearing existing data...');

  await User.deleteMany({});
  await Client.deleteMany({});
  await Invoice.deleteMany({});

  logger.info('✅ Database cleared');
}

// Seed users
async function seedUsersData(): Promise<Map<string, string>> {
  logger.info('Seeding users...');

  const userIdMap = new Map<string, string>();

  for (const userData of seedUsers) {
    try {
      const user = new User(userData);
      await user.save();

      userIdMap.set(userData.email, (user as any)._id.toString());

      logger.info(`✅ Created user: ${userData.name} (${userData.email})`);
    } catch (error) {
      logger.error(`❌ Failed to create user ${userData.email}:`, error);
    }
  }

  logger.info(`✅ Seeded ${userIdMap.size} users`);
  return userIdMap;
}

// Seed clients
async function seedClientsData(userIdMap: Map<string, string>): Promise<Map<string, string>> {
  logger.info('Seeding clients...');

  const clientIdMap = new Map<string, string>();

  // Get user IDs (randomly assign clients to users for demo)
  const userIds = Array.from(userIdMap.values()).filter((_, index) => index > 0); // Skip admin user

  for (let i = 0; i < seedClients.length; i++) {
    const clientData = seedClients[i];
    const userId = userIds[i % userIds.length]; // Round-robin assignment

    try {
      const client = new Client({
        ...clientData,
        userId: new mongoose.Types.ObjectId(userId)
      });

      await client.save();

      clientIdMap.set(clientData.email, (client as any)._id.toString());

      logger.info(`✅ Created client: ${clientData.name} (${clientData.email})`);
    } catch (error) {
      logger.error(`❌ Failed to create client ${clientData.email}:`, error);
    }
  }

  logger.info(`✅ Seeded ${clientIdMap.size} clients`);
  return clientIdMap;
}

// Seed invoices
async function seedInvoicesData(
  userIdMap: Map<string, string>,
  clientIdMap: Map<string, string>
): Promise<void> {
  logger.info('Seeding invoices...');

  const userIds = Array.from(userIdMap.values()).filter((_, index) => index > 0);
  const clientIds = Array.from(clientIdMap.values());

  for (let i = 0; i < seedInvoices.length; i++) {
    const invoiceData = seedInvoices[i];
    const userId = userIds[i % userIds.length];
    const clientId = clientIds[i % clientIds.length];

    try {
      const invoice = new Invoice({
        ...invoiceData,
        userId: new mongoose.Types.ObjectId(userId),
        clientId: new mongoose.Types.ObjectId(clientId)
      });

      await invoice.save();

      logger.info(`✅ Created invoice: ${invoiceData.number}`);
    } catch (error) {
      logger.error(`❌ Failed to create invoice ${invoiceData.number}:`, error);
    }
  }

  logger.info(`✅ Seeded ${seedInvoices.length} invoices`);
}

// Update client financial data
async function updateClientFinancials(): Promise<void> {
  logger.info('Updating client financial data...');

  const clients = await Client.find({});

  for (const client of clients) {
    try {
      await client.updateFinancials();
      logger.info(`✅ Updated financials for client: ${client.name}`);
    } catch (error) {
      logger.error(`❌ Failed to update financials for client ${client.name}:`, error);
    }
  }

  logger.info('✅ Client financials updated');
}

// Main seeder function
async function main(): Promise<void> {
  try {
    logger.info('🌱 Starting database seeding...');

    // Connect to database
    await connectDatabase();
    logger.info('✅ Connected to database');

    // Clear existing data
    await clearDatabase();

    // Seed data in order
    const userIdMap = await seedUsersData();
    const clientIdMap = await seedClientsData(userIdMap);
    await seedInvoicesData(userIdMap, clientIdMap);

    // Update calculated fields
    await updateClientFinancials();

    logger.info('🎉 Database seeding completed successfully!');

    // Display summary
    const stats = await Promise.all([
      User.countDocuments(),
      Client.countDocuments(),
      Invoice.countDocuments()
    ]);

    logger.info('📊 Seeding Summary:');
    logger.info(`   Users: ${stats[0]}`);
    logger.info(`   Clients: ${stats[1]}`);
    logger.info(`   Invoices: ${stats[2]}`);

    // Display login credentials
    logger.info('🔑 Sample Login Credentials:');
    logger.info('   Admin: admin@involuck.dev / AdminPassword123!');
    logger.info('   User 1: john@example.com / UserPassword123!');
    logger.info('   User 2: sarah@example.com / UserPassword123!');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  logger.info('🛑 Seeding interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Seeding terminated');
  await mongoose.connection.close();
  process.exit(0);
});

// Run seeder if called directly
main().catch(error => {
  logger.error('❌ Seeding error:', error);
  process.exit(1);
});

export { main as runSeeder };
export default main;
