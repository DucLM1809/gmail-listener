import { Module } from '@nestjs/common';
import { AccountRepository } from '../../infrastructure/repositories/account.repository';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AccountController } from './controllers/account.controller';
import { AccountService } from './services/account.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountController],
  providers: [
    AccountService,
    {
      provide: 'IAccountRepository',
      useClass: AccountRepository,
    },
  ],
  exports: [AccountService],
})
export class AccountModule {}
