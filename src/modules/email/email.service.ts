import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(to: string, subject: string, content: string) {
    await this.mailerService.sendMail({
      to,
      subject,
      html: content,
    });
  }

  async sendTemplateEmail(
    to: string,
    subject: string,
    template: string,
    context: any,
  ) {
    await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
}
