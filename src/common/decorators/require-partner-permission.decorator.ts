import { SetMetadata } from '@nestjs/common';

export const PARTNER_PERMISSION_KEY = 'partnerPermission';
export const RequirePartnerPermission = (action: string) =>
  SetMetadata(PARTNER_PERMISSION_KEY, action);
