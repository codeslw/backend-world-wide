import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/db/prisma.service';

describe('CampusesController (e2e)', () => {
  let app: INestApplication;
  let prismaService = {
    campus: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'campus-1' }),
      update: jest.fn().mockResolvedValue({ id: 'campus-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'campus-1' }),
    },
    university: {
      findUnique: jest.fn().mockResolvedValue({ id: 'uni-1' }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/campuses (GET)', () => {
    it('should return empty array', () => {
      return request(app.getHttpServer())
        .get('/api/v1/campuses')
        .expect(200)
        .expect([]);
    });

    it('should query with universityId', async () => {
      prismaService.campus.findMany.mockResolvedValueOnce([
        { id: 'c1', universityId: 'u1' },
      ]);
      const response = await request(app.getHttpServer()).get(
        '/api/v1/campuses?universityId=u1',
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 'c1', universityId: 'u1' }]);
      expect(prismaService.campus.findMany).toHaveBeenCalledWith({
        where: { universityId: 'u1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('/api/v1/campuses/:id (GET)', () => {
    it('should return 404 if not found', () => {
      prismaService.campus.findUnique.mockResolvedValueOnce(null);
      return request(app.getHttpServer())
        .get('/api/v1/campuses/non-existent')
        .expect(404);
    });

    it('should return campus', () => {
      prismaService.campus.findUnique.mockResolvedValueOnce({
        id: 'campus-1',
        name: 'Test',
      });
      return request(app.getHttpServer())
        .get('/api/v1/campuses/campus-1')
        .expect(200)
        .expect({ id: 'campus-1', name: 'Test' });
    });
  });
});
