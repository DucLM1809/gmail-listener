import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('auth-url')
  getAuthUrl() {
    return { url: this.gmailService.generateAuthUrl() };
  }

  @Get('oauth2callback')
  async oauth2callback(@Query('code') code: string) {
    const tokens = await this.gmailService.getToken(code);
    return tokens; // copy refresh_token vào .env để dùng lâu dài
  }

  @Get('watch')
  async watch() {
    await this.gmailService.watchMailbox();
    return { ok: true };
  }

  // Webhook nhận push từ Gmail Pub/Sub
  @Post('notification')
  async onNotification(@Body() body: any) {
    if (!body.message) return { ok: false };

    const data = JSON.parse(
      Buffer.from(body.message.data, 'base64').toString('utf8'),
    );

    console.log('📨 New Gmail Event:', data);

    // Gmail messageId
    const gmailMessageId = data.emailId || data.historyId;

    const message = await this.gmailService.getMessageById(gmailMessageId);

    console.log('📬 Gmail push event:', message);

    // Bạn có thể gọi Gmail API để lấy mail mới
    // (dùng GmailService.getMessageById hoặc users.history.list)
    return { ok: true };
  }

  @Get('vcb/today')
  async getTodayTransactions() {
    const data = await this.gmailService.getVcbTransactionsToday();

    return {
      count: data.length,
      data,
    };
  }

  @Get('me')
  async getProfile() {
    return this.gmailService.getProfile();
  }
}
