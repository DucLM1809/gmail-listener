import { Module } from '@nestjs/common';
import { AccountRepository } from '../../infrastructure/repositories/account.repository';
import { AccountController } from './controllers/account.controller';
import { AccountService } from './services/account.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

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
