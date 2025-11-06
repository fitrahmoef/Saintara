import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

/**
 * Data Factory for Test Data Generation
 * Uses Faker.js for realistic fake data
 */

export class DataFactory {
  /**
   * Generate fake user data
   */
  static user(overrides: any = {}) {
    const password = overrides.password || 'password123';
    return {
      email: faker.internet.email().toLowerCase(),
      password: bcrypt.hashSync(password, 10),
      full_name: faker.person.fullName(),
      phone: faker.phone.number(),
      date_of_birth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
      gender: faker.helpers.arrayElement(['male', 'female', 'other']),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      province: faker.location.state(),
      country: 'Indonesia',
      email_verified: true,
      role: 'user',
      ...overrides,
    };
  }

  /**
   * Generate fake character type data
   */
  static characterType(overrides: any = {}) {
    return {
      type_name: faker.word.adjective() + ' ' + faker.word.noun(),
      description: faker.lorem.paragraph(),
      traits: JSON.stringify(faker.helpers.multiple(() => faker.word.adjective(), { count: 5 })),
      strengths: JSON.stringify(faker.helpers.multiple(() => faker.lorem.sentence(), { count: 3 })),
      weaknesses: JSON.stringify(faker.helpers.multiple(() => faker.lorem.sentence(), { count: 3 })),
      recommended_careers: JSON.stringify(
        faker.helpers.multiple(() => faker.person.jobTitle(), { count: 5 })
      ),
      ...overrides,
    };
  }

  /**
   * Generate fake test question data
   */
  static testQuestion(overrides: any = {}) {
    return {
      question_text: faker.lorem.sentence() + '?',
      question_type: faker.helpers.arrayElement(['multiple_choice', 'scale', 'boolean']),
      options: JSON.stringify({
        A: faker.lorem.words(3),
        B: faker.lorem.words(3),
        C: faker.lorem.words(3),
        D: faker.lorem.words(3),
      }),
      category: faker.helpers.arrayElement(['personality', 'aptitude', 'interest']),
      weight: faker.number.int({ min: 1, max: 5 }),
      ...overrides,
    };
  }

  /**
   * Generate fake test result data
   */
  static testResult(userId: number, testId: number, characterTypeId: number, overrides: any = {}) {
    return {
      user_id: userId,
      test_id: testId,
      score: faker.number.int({ min: 50, max: 100 }),
      character_type_id: characterTypeId,
      completed_at: faker.date.recent({ days: 30 }),
      time_taken: faker.number.int({ min: 300, max: 3600 }),
      ...overrides,
    };
  }

  /**
   * Generate fake transaction data
   */
  static transaction(userId: number, overrides: any = {}) {
    const amount = faker.helpers.arrayElement([50000, 100000, 200000, 500000]);
    return {
      user_id: userId,
      package_id: faker.number.int({ min: 1, max: 3 }),
      amount,
      status: faker.helpers.arrayElement(['pending', 'completed', 'failed']),
      payment_method: faker.helpers.arrayElement(['xendit', 'stripe']),
      external_id: `txn_${faker.string.alphanumeric(16)}`,
      ...overrides,
    };
  }

  /**
   * Generate multiple instances
   */
  static multiple<T>(factory: () => T, count: number): T[] {
    return Array.from({ length: count }, () => factory());
  }
}

export default DataFactory;
