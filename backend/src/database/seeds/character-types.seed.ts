import { pool } from '../../config/database';
import DataFactory from '../factories/DataFactory';
import { logger } from '../../utils/logger';

/**
 * Seed Character Types
 * Creates personality/character types for tests
 */

export async function seedCharacterTypes() {
  try {
    logger.info('Seeding character types...');

    const characterTypes = [
      DataFactory.characterType({
        type_name: 'The Leader',
        description: 'Natural born leaders with strong decision-making abilities',
      }),
      DataFactory.characterType({
        type_name: 'The Analyst',
        description: 'Logical thinkers who excel at problem-solving',
      }),
      DataFactory.characterType({
        type_name: 'The Creative',
        description: 'Imaginative individuals with artistic tendencies',
      }),
      DataFactory.characterType({
        type_name: 'The Caregiver',
        description: 'Empathetic people who prioritize helping others',
      }),
      DataFactory.characterType({
        type_name: 'The Adventurer',
        description: 'Risk-takers who thrive on new experiences',
      }),
    ];

    for (const charType of characterTypes) {
      await pool.query(
        `INSERT INTO character_types (type_name, description, traits, strengths, weaknesses, recommended_careers)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (type_name) DO NOTHING`,
        [
          charType.type_name,
          charType.description,
          charType.traits,
          charType.strengths,
          charType.weaknesses,
          charType.recommended_careers,
        ]
      );
    }

    logger.info('Character types seeded successfully!');
  } catch (error) {
    logger.error('Error seeding character types:', error);
    throw error;
  }
}
