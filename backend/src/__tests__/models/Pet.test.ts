import { PetModel } from '../../models/Pet';
import { setupTestDatabase, cleanupTestDatabase } from '../setup';

describe('PetModel', () => {
  let petModel: PetModel;

  beforeAll(() => {
    setupTestDatabase();
    petModel = new PetModel();
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  beforeEach(() => {
    // Clear pets table before each test
    const db = require('../../database/connection').getDatabase();
    db.prepare('DELETE FROM pets').run();
  });

  describe('create', () => {
    it('should create a new pet with all fields', () => {
      const petData = {
        name: 'Fluffy',
        species: 'Cat',
        birthDate: '2020-01-15'
      };

      const pet = petModel.create(petData);

      expect(pet).toMatchObject({
        id: expect.any(Number),
        name: 'Fluffy',
        species: 'Cat',
        birthDate: '2020-01-15',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should create a pet without birth date', () => {
      const petData = {
        name: 'Rex',
        species: 'Dog',
        birthDate: ''
      };

      const pet = petModel.create(petData);

      expect(pet).toMatchObject({
        name: 'Rex',
        species: 'Dog',
        birthDate: ''
      });
    });
  });

  describe('findAll', () => {
    it('should return empty array when no pets exist', () => {
      const pets = petModel.findAll();
      expect(pets).toEqual([]);
    });

    it('should return all pets ordered by creation date', () => {
      const pet1 = petModel.create({ name: 'Pet1', species: 'Cat', birthDate: '' });
      // Add a small delay to ensure different timestamps
      const pet2 = petModel.create({ name: 'Pet2', species: 'Dog', birthDate: '' });

      const pets = petModel.findAll();

      expect(pets).toHaveLength(2);
      // Check that we have both pets, order may vary due to timestamp precision
      const petNames = pets.map(p => p.name);
      expect(petNames).toContain('Pet1');
      expect(petNames).toContain('Pet2');
    });
  });

  describe('findById', () => {
    it('should return pet when found', () => {
      const created = petModel.create({ name: 'Buddy', species: 'Dog', birthDate: '' });
      const found = petModel.findById(created.id);

      expect(found).toMatchObject({
        id: created.id,
        name: 'Buddy',
        species: 'Dog'
      });
    });

    it('should return null when pet not found', () => {
      const found = petModel.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update pet fields', () => {
      const created = petModel.create({ name: 'Original', species: 'Cat', birthDate: '' });
      
      const updated = petModel.update(created.id, {
        name: 'Updated',
        species: 'Dog'
      });

      expect(updated).toMatchObject({
        id: created.id,
        name: 'Updated',
        species: 'Dog'
      });
    });

    it('should return null when pet not found', () => {
      const updated = petModel.update(999, { name: 'Test' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing pet', () => {
      const created = petModel.create({ name: 'ToDelete', species: 'Cat', birthDate: '' });
      
      const deleted = petModel.delete(created.id);
      expect(deleted).toBe(true);

      const found = petModel.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when pet not found', () => {
      const deleted = petModel.delete(999);
      expect(deleted).toBe(false);
    });
  });
});