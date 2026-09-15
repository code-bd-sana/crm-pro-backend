import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { getPasswordResetTemplate } from './templates/password-reset.template';
import { getWelcomeUserTemplate } from './templates/welcome-user.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('mail.frontendUrl');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const htmlContent = getPasswordResetTemplate(name, resetLink);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Password - CRM System',
        html: htmlContent,
      });
      this.logger.log(`Password reset email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(email: string, name: string, temporaryPassword: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('mail.frontendUrl');
    const loginUrl = `${frontendUrl}/login`;
    const htmlContent = getWelcomeUserTemplate(name, loginUrl, temporaryPassword);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to CRM Pro - Your Account is Ready',
        html: htmlContent,
      });
      this.logger.log(`Welcome email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error.stack);
      // Do not throw — user creation should succeed even if email fails
    }
  }
}
