import 'reflect-metadata';
import { AuthService } from './auth.service';
import { Role } from '../common/enum/roles.enum';
import { UsersController } from '../users/users.controller';
import { IntakesController } from '../intakes/intakes.controller';
import { CampusesController } from '../campuses/campuses.controller';
import { StudyLanguagesController } from '../study-languages/study-languages.controller';
import { AdmissionRequirementsController } from '../admission-requirements/admission-requirements.controller';
import { MiniApplicationsController } from '../modules/mini-applications.controller';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('public sign-up', () => {
  it('never lets the caller choose the role', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'u1' });
    const prisma = { user: { update: jest.fn() } };
    const service = new AuthService(
      { create } as any,
      {} as any,
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await service.register({
      email: 'a@example.test',
      password: 'secret-pass',
      role: Role.ADMIN,
    } as any);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ role: Role.CLIENT }),
    );
  });
});

/** A route is protected when its handler (or class) carries the admin role. */
const isAdminOnly = (cls: any, method: string) => {
  const proto = cls.prototype;
  const roles =
    Reflect.getMetadata(ROLES_KEY, proto[method]) ??
    Reflect.getMetadata(ROLES_KEY, cls);
  return Array.isArray(roles) && roles.includes(Role.ADMIN);
};

describe('routes that change or list data without a signed-in user', () => {
  const cases: [string, any, string[]][] = [
    ['users', UsersController, ['create', 'createMany', 'createAsAdmin', 'findAll']],
    ['intakes', IntakesController, ['create', 'update', 'remove']],
    ['campuses', CampusesController, ['create', 'update', 'remove']],
    ['study-languages', StudyLanguagesController, ['create', 'update', 'remove']],
    ['admission-requirements', AdmissionRequirementsController, ['create', 'update', 'remove']],
    ['mini-applications', MiniApplicationsController, ['findAll', 'findOne', 'update', 'remove']],
  ];
  it.each(cases)('%s needs an admin', (_name, cls, methods) => {
    for (const m of methods) {
      expect({ m, adminOnly: isAdminOnly(cls, m) }).toEqual({ m, adminOnly: true });
    }
  });

  it('keeps the website form public', () => {
    expect(isAdminOnly(MiniApplicationsController, 'create')).toBe(false);
  });
});
