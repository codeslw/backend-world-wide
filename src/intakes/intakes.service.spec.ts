import { IntakeSeason } from '@prisma/client';
import { IntakesService } from './intakes.service';

describe('IntakesService.runExpiryAndRollover', () => {
  const NOW = new Date('2026-08-01T00:00:00.000Z');

  function setup(expiredRows: any[]) {
    const tx = {
      intake: {
        findMany: jest.fn().mockResolvedValue(expiredRows),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((args: any) =>
          Promise.resolve({ id: `created-${args.data.year}`, ...args.data }),
        ),
        delete: jest.fn().mockResolvedValue({}),
      },
      universityProgramIntake: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const mockPrisma: any = {
      $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    };
    const mockCache: any = { reset: jest.fn() };
    const service = new IntakesService(mockPrisma, mockCache);
    return { service, tx, mockCache };
  }

  it('deletes an expired intake with no links even when its start date is still in the future', async () => {
    const { service, tx } = setup([
      {
        id: 'orphan-1',
        season: IntakeSeason.FALL,
        startMonth: 9,
        year: 2026,
        deadline: new Date('2026-07-01T00:00:00.000Z'),
        universityPrograms: [],
      },
    ]);

    const summary = await service.runExpiryAndRollover(NOW);

    expect(tx.intake.delete).toHaveBeenCalledWith({
      where: { id: 'orphan-1' },
    });
    expect(summary.deletedIntakes).toBe(1);
  });

  it('rolls linked programs forward, detaches the expired row and deletes it without waiting for the start date', async () => {
    const { service, tx } = setup([
      {
        id: 'old-1',
        season: IntakeSeason.FALL,
        startMonth: 9,
        year: 2026,
        deadline: new Date('2026-07-01T00:00:00.000Z'),
        universityPrograms: [{ universityProgramId: 'prog-1' }],
      },
    ]);
    tx.universityProgramIntake.createMany.mockResolvedValue({ count: 1 });
    tx.universityProgramIntake.deleteMany.mockResolvedValue({ count: 1 });

    const summary = await service.runExpiryAndRollover(NOW);

    // Rolled onto the next future same-season cycle (2027).
    expect(tx.intake.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ season: 'FALL', year: 2027 }),
      }),
    );
    expect(tx.universityProgramIntake.deleteMany).toHaveBeenCalledWith({
      where: { intakeId: 'old-1' },
    });
    expect(tx.intake.delete).toHaveBeenCalledWith({
      where: { id: 'old-1' },
    });
    expect(summary).toEqual({
      detachedLinks: 1,
      rolledOver: 1,
      deletedIntakes: 1,
    });
  });

  it('leaves intakes whose deadline has not passed alone', async () => {
    const { service, tx } = setup([]);

    const summary = await service.runExpiryAndRollover(NOW);

    expect(tx.intake.delete).not.toHaveBeenCalled();
    expect(summary).toEqual({
      detachedLinks: 0,
      rolledOver: 0,
      deletedIntakes: 0,
    });
  });
});
