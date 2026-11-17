import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ServiceActorGuard } from './service-actor.guard';

const TOKEN = 'x'.repeat(40);
const USER_ID = '11111111-1111-4111-8111-111111111111';

function setup(user: any, token = TOKEN) {
  const config = { get: jest.fn().mockReturnValue(token) } as any;
  const prisma = { user: { findUnique: jest.fn().mockResolvedValue(user) } } as any;
  return new ServiceActorGuard(config, prisma);
}

function ctx(headers: Record<string, string>) {
  const req: any = { headers };
  return {
    req,
    context: { switchToHttp: () => ({ getRequest: () => req }) } as any,
  };
}

const partner = {
  id: USER_ID,
  email: 'p@x.test',
  role: 'PARTNER',
  partnerOrganization: { id: 'org', isActive: true },
  partnerMembership: null,
};

describe('ServiceActorGuard', () => {
  it('leaves requests without a service token to JWT auth', async () => {
    const { req, context } = ctx({});
    await expect(setup(partner).canActivate(context)).resolves.toBe(true);
    expect(req.user).toBeUndefined();
    expect(req.serviceActor).toBeUndefined();
  });

  it('acts as the named partner', async () => {
    const { req, context } = ctx({ 'x-service-token': TOKEN, 'x-act-as-user': USER_ID });
    await expect(setup(partner).canActivate(context)).resolves.toBe(true);
    expect(req.serviceActor).toBe(true);
    expect(req.user).toMatchObject({ userId: USER_ID, role: 'PARTNER', partnerRole: 'OWNER', organizationId: 'org' });
  });

  it('refuses a wrong token', async () => {
    const { context } = ctx({ 'x-service-token': 'y'.repeat(40), 'x-act-as-user': USER_ID });
    await expect(setup(partner).canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuses every token when none (or a short one) is configured', async () => {
    const { context } = ctx({ 'x-service-token': 'short', 'x-act-as-user': USER_ID });
    await expect(setup(partner, 'short').canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    const empty = ctx({ 'x-service-token': '', 'x-act-as-user': USER_ID });
    await expect(setup(partner, undefined as any).canActivate(empty.context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuses a missing or unknown user', async () => {
    await expect(setup(partner).canActivate(ctx({ 'x-service-token': TOKEN }).context)).rejects.toBeInstanceOf(UnauthorizedException);
    const { context } = ctx({ 'x-service-token': TOKEN, 'x-act-as-user': USER_ID });
    await expect(setup(null).canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuses clients and deactivated organizations', async () => {
    const headers = { 'x-service-token': TOKEN, 'x-act-as-user': USER_ID };
    await expect(setup({ ...partner, role: 'CLIENT' }).canActivate(ctx(headers).context)).rejects.toBeInstanceOf(ForbiddenException);
    const off = { ...partner, partnerOrganization: { id: 'org', isActive: false } };
    await expect(setup(off).canActivate(ctx(headers).context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
