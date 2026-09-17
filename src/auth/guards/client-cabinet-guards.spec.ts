import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtAuthGuard as JwtAuthGuardLegacy } from '../jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../common/enum/roles.enum';
import { FilesController } from '../../files/files.controller';
import { ApplicationsController } from '../../applications/applications.controller';
import { ChatController } from '../../chat/chat.controller';

/**
 * Guards the client-cabinet security contract:
 * every client-reachable endpoint must enforce authentication,
 * and role restrictions must be backed by RolesGuard
 * (a bare @Roles() without RolesGuard is inert).
 */
describe('client cabinet route guards', () => {
  function guardsOf(controller: new (...args: any[]) => object, method: string): any[] {
    const methodGuards: any[] =
      Reflect.getMetadata(GUARDS_METADATA, controller.prototype[method]) ?? [];
    const classGuards: any[] = Reflect.getMetadata(GUARDS_METADATA, controller) ?? [];
    return [...classGuards, ...methodGuards];
  }

  function rolesOf(controller: new (...args: any[]) => object, method: string): Role[] | undefined {
    return Reflect.getMetadata(ROLES_KEY, controller.prototype[method]);
  }

  // The codebase has two identical real JWT guards (auth/jwt-auth.guard and
  // auth/guards/jwt-auth.guard); either one enforces authentication.
  const REAL_JWT_GUARDS = [JwtAuthGuard, JwtAuthGuardLegacy];

  function expectGuarded(
    controller: new (...args: any[]) => object,
    method: string,
    roles: Role[],
  ) {
    const guards = guardsOf(controller, method);
    expect(guards.some((guard) => REAL_JWT_GUARDS.includes(guard))).toBe(true);
    expect(guards).toEqual(expect.arrayContaining([RolesGuard]));
    expect(rolesOf(controller, method)).toEqual(expect.arrayContaining(roles));
  }

  it('lets any authenticated role upload a single file', () => {
    expectGuarded(FilesController, 'uploadFile', [Role.CLIENT, Role.PARTNER, Role.ADMIN]);
  });

  it('restricts bulk upload, file listing and file deletion to admins', () => {
    expectGuarded(FilesController, 'uploadMultipleFiles', [Role.ADMIN]);
    expectGuarded(FilesController, 'getAllFiles', [Role.ADMIN]);
    expectGuarded(FilesController, 'deleteFileByUrl', [Role.ADMIN]);
  });

  it('requires authentication for file downloads and metadata', () => {
    for (const method of ['downloadFileById', 'downloadFileByUrl', 'getFile']) {
      const guards = guardsOf(FilesController, method);
      expect(guards.some((guard) => REAL_JWT_GUARDS.includes(guard))).toBe(true);
    }
  });

  it('enforces roles on every client application endpoint', () => {
    expectGuarded(ApplicationsController, 'create', [Role.CLIENT]);
    expectGuarded(ApplicationsController, 'findOne', [Role.CLIENT, Role.ADMIN]);
    expectGuarded(ApplicationsController, 'update', [Role.CLIENT, Role.ADMIN]);
    expectGuarded(ApplicationsController, 'remove', [Role.CLIENT, Role.ADMIN]);
    expectGuarded(ApplicationsController, 'submit', [Role.CLIENT]);
  });

  it('lets clients delete their own chat messages', () => {
    expectGuarded(ChatController, 'deleteMessage', [Role.CLIENT]);
    // Clear-all stays admin-only so one user can never wipe a chat.
    expect(rolesOf(ChatController, 'clearChatMessages')).toEqual([Role.ADMIN]);
  });

  it('uses the real JWT guard on the files controller (never the mock)', async () => {
    const mockModule = await import('./jwt-auth.guard.mock').catch(() => null);
    const guards = guardsOf(FilesController, 'uploadFile');
    expect(guards).toContain(JwtAuthGuard);
    if (mockModule?.JwtAuthGuard) {
      expect(guards).not.toContain(mockModule.JwtAuthGuard);
    }
  });
});
