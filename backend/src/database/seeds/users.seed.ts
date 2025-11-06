import { pool } from '../../config/database';
import DataFactory from '../factories/DataFactory';
import { logger } from '../../utils/logger';

/**
 * Seed Users
 * Creates test users for development
 */

export async function seedUsers() {
  try {
    logger.info('Seeding users...');

    // Create admin user
    const adminData = DataFactory.user({
      email: 'admin@saintara.com',
      password: 'admin123',
      full_name: 'Admin Saintara',
      role: 'admin',
      email_verified: true,
    });

    await pool.query(
      `INSERT INTO users (email, password, full_name, phone, date_of_birth, gender, 
                          address, city, province, country, email_verified, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (email) DO NOTHING`,
      [
        adminData.email,
        adminData.password,
        adminData.full_name,
        adminData.phone,
        adminData.date_of_birth,
        adminData.gender,
        adminData.address,
        adminData.city,
        adminData.province,
        adminData.country,
        adminData.email_verified,
        adminData.role,
      ]
    );

    // Create regular test users
    const testUsers = DataFactory.multiple(() => DataFactory.user(), 10);

    for (const userData of testUsers) {
      await pool.query(
        `INSERT INTO users (email, password, full_name, phone, date_of_birth, gender,
                            address, city, province, country, email_verified, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (email) DO NOTHING`,
        [
          userData.email,
          userData.password,
          userData.full_name,
          userData.phone,
          userData.date_of_birth,
          userData.gender,
          userData.address,
          userData.city,
          userData.province,
          userData.country,
          userData.email_verified,
          userData.role,
        ]
      );
    }

    logger.info('Users seeded successfully!');
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
}
