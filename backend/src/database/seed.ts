import { pool } from '../config/database';
import { seedUsers } from './seeds/users.seed';
import { seedCharacterTypes } from './seeds/character-types.seed';
import { logger } from '../utils/logger';

/**
 * Database Seeder
 * Run all seeds in order
 */

async function runSeeds() {
  try {
    logger.info('Starting database seeding...');

    await seedCharacterTypes();
    await seedUsers();

    logger.info('All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  runSeeds();
}

export default runSeeds;
