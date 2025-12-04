import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { GmailModule } from './modules/gmail/gmail.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CoreModule } from './core/core.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
          level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        },
      },
    }),
    CoreModule,
    PrismaModule,
    GmailModule,
    TransactionsModule,
    AuthModule,
    EmailModule,
  ],
})
export class AppModule {}
