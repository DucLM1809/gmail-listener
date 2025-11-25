import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private oAuth2Client: OAuth2Client;
  private gmail = google.gmail('v1');

  constructor() {
    this.oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI,
    );

    // Ensure the OAuth2Client is initialized with valid credentials
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GMAIL_REDIRECT_URI
    ) {
      throw new Error(
        'Missing required environment variables for Google OAuth2 configuration.',
      );
    }

    // Add error handling for missing refresh token
    if (!process.env.GMAIL_REFRESH_TOKEN) {
      this.logger.error(
        'GMAIL_REFRESH_TOKEN is not set. Authentication may fail.',
      );
    } else {
      this.oAuth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      });
    }
  }

  getClient() {
    return this.oAuth2Client;
  }

  generateAuthUrl() {
    const scopes = ['https://mail.google.com/'];
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  async getToken(code: string) {
    const { tokens } = await this.oAuth2Client.getToken(code);
    return tokens;
  }

  async watchMailbox() {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oAuth2Client });

      const res = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: process.env.PUBSUB_TOPIC,
          labelIds: ['INBOX'],
        },
      });
      this.logger.log('Watch started: ' + JSON.stringify(res.data));
    } catch (error) {
      this.logger.error('Failed to start watch on mailbox:', error);
      throw error;
    }
  }

  async getMessageById(id: string) {
    try {
      const history = await this.gmail.users.history.list({
        userId: 'me',
        startHistoryId: id,
        historyTypes: ['messageAdded'],
      });

      const messages =
        history.data.history?.flatMap((h) => h.messages || []) || [];

      const res = await this.gmail.users.messages.get({
        userId: 'me',
        id: messages[0].id!,
        auth: this.oAuth2Client,
        format: 'full',
      });

      const msg = res.data;

      // Extract subject, snippet, payload...
      const subject = this.extractHeader(msg, 'Subject');
      const from = this.extractHeader(msg, 'From');
      const date = this.extractHeader(msg, 'Date');
      const snippet = msg.snippet;

      console.log('📧 Email details:', { subject, from, date, snippet });

      return { subject, from, date, snippet, raw: msg };
    } catch (err) {
      console.error('❌ fetchEmailById error:', err);
      return null;
    }
  }

  async getVcbTransactionsToday() {
    const query = `from:VCBDigibank@info.vietcombank.com.vn newer_than:1d`;

    const list = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      auth: this.oAuth2Client, // Ensure auth is passed
    });

    if (!list.data.messages) return [];

    const results = [];

    for (const msg of list.data.messages) {
      const fullMsg = await this.gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
        auth: this.oAuth2Client, // Ensure auth is passed
      });

      const bodyBase64 =
        fullMsg.data.payload.parts?.[0]?.body?.data ||
        fullMsg.data.payload.body?.data;

      if (!bodyBase64) continue;

      const body = Buffer.from(bodyBase64, 'base64').toString('utf8');

      const parsed = this.parseVcb(body);
      if (parsed) results.push(parsed);
    }

    return results;
  }

  async getProfile() {
    const res = await this.gmail.users.getProfile({
      userId: 'me',
      auth: this.oAuth2Client,
    });

    return res.data;
  }

  /**
   * Hàm lấy header
   */
  extractHeader(msg: any, name: string) {
    return msg?.payload?.headers?.find((h) => h.name === name)?.value || null;
  }

  parseVcb(body: string) {
    const regex =
      /Số dư.*?:\s?([\d.,]+).*?Số tiền.*?:\s?([\d.,]+).*?ND:\s?(.*?)\n/is;

    const match = body.match(regex);
    if (!match) return null;

    return {
      balance: match[1],
      amount: match[2],
      content: match[3],
    };
  }
}
