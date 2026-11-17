import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../db/prisma.service';

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: {
            uploadFile: jest.fn(),
            uploadMultipleFiles: jest.fn(),
            getFile: jest.fn(),
            getAllFiles: jest.fn(),
            downloadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        // ServiceActorGuard's dependencies
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

describe('UPLOAD_MIME_TYPES', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { UPLOAD_MIME_TYPES } = require('./files.controller');
  it.each([
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ])('accepts %s', (mime) => expect(UPLOAD_MIME_TYPES.test(mime)).toBe(true));
  it.each(['application/x-msdownload', 'text/html', 'application/zip', 'image/svg+xml'])(
    'refuses %s',
    (mime) => expect(UPLOAD_MIME_TYPES.test(mime)).toBe(false),
  );
});
