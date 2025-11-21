import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as moment from 'moment';
import { GmailService } from 'src/gmail/gmail.service';
import * as cheerio from 'cheerio';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionsService {
  private gmail: ReturnType<typeof google.gmail>;

  constructor(
    private readonly gmailService: GmailService,
    private readonly prisma: PrismaService,
  ) {
    this.gmail = google.gmail({
      version: 'v1',
      auth: this.gmailService.getClient(),
    });
  }

  async getTodayVcbTransactions() {
    const today = moment().format('YYYY/MM/DD');
    const query = `from:info@info.vietcombank.com.vn after:${today}`;

    const list = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
    });

    if (!list.data.messages?.length) return [];

    const results = [];

    for (const msg of list.data.messages) {
      const messageId = msg.id;

      const full = await this.gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
      });

      const bodyData =
        full.data.payload?.parts?.[0]?.body?.data ||
        full.data.payload?.body?.data ||
        '';

      const decoded = Buffer.from(bodyData, 'base64').toString('utf-8');

      const transaction = this.parseVcbHtml(decoded);

      const existedMessage = await this.prisma.transaction.findFirst({
        where: { messageId },
      });

      if (transaction && !!transaction.amount && !existedMessage) {
        const saved = await this.prisma.transaction.create({
          data: {
            messageId,
            amount: transaction.amount,
            description: transaction.description,
            time: moment(transaction.time, 'DD/MM/YYYY HH:mm:ss').isValid()
              ? moment(transaction.time, 'DD/MM/YYYY HH:mm:ss').toDate()
              : null,
            location: transaction.location,
            rawText: transaction.rawText,
          },
        });
      }
      results.push(transaction);
    }

    return results;
  }

  async getTodayVcbDigitalTransactions() {
    const today = moment().format('YYYY/MM/DD');
    const query = `from:VCBDigibank@info.vietcombank.com.vn after:${today}`;

    const list = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
    });

    if (!list.data.messages?.length) return [];

    const results = [];

    for (const msg of list.data.messages) {
      const messageId = msg.id;

      const full = await this.gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
      });

      const bodyData =
        full.data.payload?.parts?.[0]?.body?.data ||
        full.data.payload?.body?.data ||
        '';

      const decoded = Buffer.from(bodyData, 'base64').toString('utf-8');

      const transaction = this.parseVcbDigitalHtml(decoded);

      const existedMessage = await this.prisma.transaction.findFirst({
        where: { messageId },
      });

      if (transaction && !!transaction.amount && !existedMessage) {
        const saved = await this.prisma.transaction.create({
          data: {
            messageId,
            amount: transaction.amount,
            description: transaction.description,
            time: moment(transaction.time, 'DD/MM/YYYY HH:mm:ss').isValid()
              ? moment(transaction.time, 'DD/MM/YYYY HH:mm:ss').toDate()
              : null,
            beneficiaryName: transaction.beneficiaryName,
            beneficiaryBankName: transaction.beneficiaryBankName,
            chargeCode: transaction.chargeCode,
            chargeAmount: transaction.chargeAmount,
            rawText: transaction.rawText,
          },
        });
      }
      results.push(transaction);
    }

    return results;
  }

  private parseVcbHtml(html: string) {
    const $ = cheerio.load(html);
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    let amount = 0;
    let description = '';

    if (text.includes('nhận thưởng')) {
      const match = text.match(/nhận thưởng\s+([\d.,]+)\s*(VND|USD|VNĐ)?/i);
      if (match) {
        amount = this.normalizeAmount(match[1]);
        description = 'Nhận thưởng';
      }
    } else {
      const amountText = $('td:contains("Số tiền")').next().text().trim();
      amount = this.normalizeAmount(amountText);
      description = $('td:contains("Tình trạng giao dịch")')
        .next()
        .text()
        .trim();
    }

    const card = $('td:contains("Thẻ")').next().text().trim();
    const location = $('td:contains("Sử dụng tại")').next().text().trim();
    const time = $('td:contains("Ngày, giờ giao dịch")').next().text().trim();

    return {
      card: card ?? null,
      amount: amount || null,
      description: description ?? null,
      location: location ?? null,
      time: time ?? null,
      rawText: text,
    };
  }

  private parseVcbDigitalHtml(html: string) {
    const $ = cheerio.load(html);
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    const card =
      $('td:contains("Tài khoản nguồn")').next().text().trim() || null;
    const amountText = $('td:contains("Số tiền")').next().text().trim() || null;

    const amount = this.normalizeAmount(amountText);
    const description =
      $('td:contains("Nội dung chuyển tiền")').next().text().trim() || null;
    const beneficiaryName =
      $('td:contains("Tên người hưởng")').next().text().trim() || null;
    const beneficiaryBankName =
      $('td:contains("Tên ngân hàng hưởng")').next().text().trim() || null;
    const chargeCode =
      $('td:contains("Loại phí")').next().text().trim() || null;

    // Extract and normalize chargeAmountText
    const chargeAmountText =
      $('td:contains("Số tiền phí")').next().text().trim() || null;

    // Use normalizeAmount to parse chargeAmountText
    const chargeAmount = this.normalizeAmount(chargeAmountText);

    const time = $('td:contains("Thời gian")').next().text().trim() || null;

    return {
      card: card ?? null,
      amount: amount ?? null,
      description: description ?? null,
      beneficiaryName: beneficiaryName ?? null,
      beneficiaryBankName: beneficiaryBankName ?? null,
      chargeCode: chargeCode ?? null,
      chargeAmount: chargeAmount ?? null,
      time: time ?? null,
      rawText: text,
    };
  }

  /**
   * Normalize the amount string to ensure correct parsing.
   * Handles cases like "0 VND 0 VND0 VND" -> 0.
   */
  private normalizeAmount(amountText: string): number {
    if (!amountText) return 0;

    // Extract the first valid numeric part (e.g., "0" from "0 VND 0 VND0 VND")
    const match = amountText.match(/[\d.,]+/);
    if (!match) return 0;

    const cleaned = match[0]; // Get the first matched numeric part

    // If the string contains both commas and dots, assume commas are thousand separators
    if (cleaned.includes(',') && cleaned.includes('.')) {
      return parseFloat(cleaned.replace(/,/g, ''));
    }

    // If the string contains only commas, replace them with dots for decimal parsing
    if (cleaned.includes(',')) {
      return parseFloat(cleaned.replace(/,/g, ''));
    }

    // Otherwise, parse the string as is
    return parseFloat(cleaned);
  }
}
