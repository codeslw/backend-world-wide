/**
 * Transactional email bodies. Kept as plain template functions (no templating
 * engine) so the mail module has no build-time asset story — these are the only
 * two emails the platform sends.
 */

const BRAND = 'World Wide';

function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#4361EE 0%,#3A0CA3 100%);padding:28px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.4px;">${BRAND}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;">${heading}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                  This is an automated message from ${BRAND}. Please do not reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function codeBlock(code: string): string {
  return `<div style="margin:24px 0;padding:20px;background:#f1f5f9;border-radius:12px;text-align:center;">
    <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:#1e293b;font-family:'SF Mono',Menlo,Consolas,monospace;">${code}</span>
  </div>`;
}

export function emailVerificationTemplate(code: string, ttlMinutes: number) {
  return {
    subject: `${code} is your ${BRAND} verification code`,
    html: layout(
      'Confirm your email address',
      `<p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
         Enter this code to finish creating your ${BRAND} account.
       </p>
       ${codeBlock(code)}
       <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
         The code expires in ${ttlMinutes} minutes. If you did not sign up, you can safely ignore this email.
       </p>`,
    ),
    text:
      `Confirm your email address\n\n` +
      `Enter this code to finish creating your ${BRAND} account:\n\n${code}\n\n` +
      `The code expires in ${ttlMinutes} minutes. If you did not sign up, you can safely ignore this email.`,
  };
}

export function passwordResetTemplate(code: string, ttlMinutes: number) {
  return {
    subject: `${code} is your ${BRAND} password reset code`,
    html: layout(
      'Reset your password',
      `<p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
         Enter this code to choose a new password for your ${BRAND} account.
       </p>
       ${codeBlock(code)}
       <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
         The code expires in ${ttlMinutes} minutes. If you did not request a password reset,
         ignore this email — your password will stay unchanged.
       </p>`,
    ),
    text:
      `Reset your password\n\n` +
      `Enter this code to choose a new password for your ${BRAND} account:\n\n${code}\n\n` +
      `The code expires in ${ttlMinutes} minutes. If you did not request a password reset, ` +
      `ignore this email — your password will stay unchanged.`,
  };
}
