import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AccountService } from '../services/account.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../../core/decorators/user.decorator';
import { UserSession } from '../../../core/interfaces/user-session.interface';
import { PageOptionsDto } from '../../../core/dto/page-options.dto';
import { PageDto } from '../../../core/dto/page.dto';
import { AccountResponseDto } from '../dto/account-response.dto';
import { Result } from '../../../core/result';
import { BaseController } from 'src/core/base.controller';
import { AccountNotFoundException } from '../exceptions/account.exceptions';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/accounts')
export class AccountController extends BaseController {
  constructor(private readonly accountService: AccountService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully.' })
  async create(
    @Body() createAccountDto: CreateAccountDto,
    @User() user: UserSession,
  ) {
    return this.handleResult(
      await this.accountService.create(createAccountDto, user.userId),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiResponse({
    status: 200,
    description: 'Return all accounts.',
    type: PageDto,
  })
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @User() user: UserSession,
  ) {
    return this.handleResult(
      await this.accountService.findAll(pageOptionsDto, user.userId),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by id' })
  @ApiResponse({
    status: 200,
    description: 'Return account details.',
    type: AccountResponseDto,
  })
  async findOne(@Param('id') id: string) {
    return this.handleResult(await this.accountService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account' })
  @ApiResponse({ status: 200, description: 'Account updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.handleResult(
      await this.accountService.update(id, updateAccountDto),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
  async remove(@Param('id') id: string) {
    return this.handleResult(await this.accountService.remove(id));
  }

  protected resolveError(error: any): HttpException {
    if (error instanceof AccountNotFoundException) {
      return new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
    return super.resolveError(error);
  }
}
