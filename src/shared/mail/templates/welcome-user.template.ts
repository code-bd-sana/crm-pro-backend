export const getWelcomeUserTemplate = (name: string, loginUrl: string, temporaryPassword: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CRM Pro</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f6f8fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f8fb;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

              <tr>
                <td style="padding:32px 48px 24px 48px;border-bottom:1px solid #f0f0f0;">
                  <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;text-align:center;">Welcome to CRM Pro</h2>
                </td>
              </tr>

              <tr>
                <td style="padding:32px 48px 32px 48px;">
                  <p style="margin:0 0 16px 0;font-size:15px;color:#374151;">Hi <strong>${name}</strong>,</p>
                  <p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.7;">Your account has been created by the system administrator. Below are your temporary login credentials. Please sign in and change your password as soon as possible.</p>

                  <!-- Credentials Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Temporary Password</p>
                        <p style="margin:0;font-size:24px;font-weight:700;color:#111827;letter-spacing:2px;font-family:'Courier New',monospace;">${temporaryPassword}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom:28px;">
                        <a href="${loginUrl}"
                          style="display:inline-block;padding:13px 36px;background-color:#0891b2;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
                          Sign In to Your Account
                        </a>
                      </td>
                    </tr>
                  </table>

                  <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px 0;">

                  <p style="margin:0 0 8px 0;font-size:13px;color:#9ca3af;">For security reasons, please change your password immediately after your first login.</p>
                  <p style="margin:0;font-size:13px;color:#9ca3af;">If the button doesn't work, paste this link into your browser:</p>
                  <p style="margin:8px 0 0 0;font-size:12px;word-break:break-all;">
                    <a href="${loginUrl}" style="color:#0891b2;text-decoration:none;">${loginUrl}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 48px;background-color:#f9fafb;border-top:1px solid #f0f0f0;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} CRM Pro. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
