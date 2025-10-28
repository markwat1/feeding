import request from 'supertest';
import app from '../../app';
import { setupTestDatabase, cleanupTestDatabase } from '../setup';

describe('Pets API', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  beforeEach(() => {
    // Clear pets table before each test
    const db = require('../../database/connection').getDatabase();
    db.prepare('DELETE FROM pets').run();
  });

  describe('GET /api/pets', () => {
    it('should return empty array when no pets exist', async () => {
      const response = await request(app)
        .get('/api/pets')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all pets', async () => {
      // Create test pets
      await request(app)
        .post('/api/pets')
        .send({ name: 'Fluffy', species: 'Cat' });
      
      await request(app)
        .post('/api/pets')
        .send({ name: 'Rex', species: 'Dog' });

      const response = await request(app)
        .get('/api/pets')
        .expect(200);

      expect(response.body).toHaveLength(2);
      // Check that we have both pets, order may vary due to timestamp precision
      const petNames = response.body.map((p: any) => p.name);
      expect(petNames).toContain('Fluffy');
      expect(petNames).toContain('Rex');
    });
  });

  describe('POST /api/pets', () => {
    it('should create a new pet with valid data', async () => {
      const petData = {
        name: 'Buddy',
        species: 'Dog',
        birthDate: '2020-01-15'
      };

      const response = await request(app)
        .post('/api/pets')
        .send(petData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: 'Buddy',
        species: 'Dog',
        birthDate: '2020-01-15',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should create a pet without birth date', async () => {
      const petData = {
        name: 'Whiskers',
        species: 'Cat'
      };

      const response = await request(app)
        .post('/api/pets')
        .send(petData)
        .expect(201);

      expect(response.body.name).toBe('Whiskers');
      expect(response.body.species).toBe('Cat');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/pets')
        .send({ name: '', species: 'Dog' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/pets')
        .send({ name: 'Test' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/pets/:id', () => {
    it('should return pet when found', async () => {
      const createResponse = await request(app)
        .post('/api/pets')
        .send({ name: 'Luna', species: 'Cat' });

      const petId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/pets/${petId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: petId,
        name: 'Luna',
        species: 'Cat'
      });
    });

    it('should return 404 when pet not found', async () => {
      const response = await request(app)
        .get('/api/pets/999')
        .expect(404);

      expect(response.body.error.code).toBe('PET_NOT_FOUND');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/pets/invalid')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/pets/:id', () => {
    it('should update existing pet', async () => {
      const createResponse = await request(app)
        .post('/api/pets')
        .send({ name: 'Original', species: 'Cat' });

      const petId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/pets/${petId}`)
        .send({ name: 'Updated', species: 'Dog', birthDate: '2021-01-01' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: petId,
        name: 'Updated',
        species: 'Dog',
        birthDate: '2021-01-01'
      });
    });

    it('should return 404 when pet not found', async () => {
      const response = await request(app)
        .put('/api/pets/999')
        .send({ name: 'Test', species: 'Dog' })
        .expect(404);

      expect(response.body.error.code).toBe('PET_NOT_FOUND');
    });

    it('should return 400 for invalid data', async () => {
      const createResponse = await request(app)
        .post('/api/pets')
        .send({ name: 'Test', species: 'Cat' });

      const response = await request(app)
        .put(`/api/pets/${createResponse.body.id}`)
        .send({ name: '', species: 'Dog' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/pets/:id', () => {
    it('should delete existing pet', async () => {
      const createResponse = await request(app)
        .post('/api/pets')
        .send({ name: 'ToDelete', species: 'Cat' });

      const petId = createResponse.body.id;

      await request(app)
        .delete(`/api/pets/${petId}`)
        .expect(204);

      // Verify pet is deleted
      await request(app)
        .get(`/api/pets/${petId}`)
        .expect(404);
    });

    it('should return 404 when pet not found', async () => {
      const response = await request(app)
        .delete('/api/pets/999')
        .expect(404);

      expect(response.body.error.code).toBe('PET_NOT_FOUND');
    });
  });
});