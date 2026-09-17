import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../db/prisma.service';
import { UsersService } from '../users/users.service';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
import { PartnerAuditService } from '../partner-audit/partner-audit.service';
import { OtpService } from './otp.service';

/**
 * OTP is reserved for password reset: registration creates a verified
 * account directly and never issues a signup code.
 */
describe('AuthService OTP scope', () => {
  let service: AuthService;
  let usersCreate: jest.Mock;
  let userUpdate: jest.Mock;
  let otpIssue: jest.Mock;

  beforeEach(async () => {
    usersCreate = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      role: 'CLIENT',
    });
    userUpdate = jest.fn().mockResolvedValue({});
    otpIssue = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { create: usersCreate } },
        { provide: JwtService, useValue: {} },
        {
          provide: PrismaService,
          useValue: { user: { update: userUpdate } },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PartnerOrganizationsService, useValue: {} },
        { provide: PartnerAuditService, useValue: {} },
        { provide: OtpService, useValue: { issue: otpIssue } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('register marks the account verified without sending any OTP', async () => {
    const result = await service.register({
      email: 'new@example.com',
      password: 'secret123',
      role: 'CLIENT',
    } as any);

    expect(usersCreate).toHaveBeenCalledTimes(1);
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isEmailVerified: true },
    });
    expect(otpIssue).not.toHaveBeenCalled();
    expect(result.isEmailVerified).toBe(true);
  });
});
