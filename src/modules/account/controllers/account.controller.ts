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
import { BaseController } from 'src/core/base.controller';
import { AccountNotFoundException } from '../exceptions/account.exceptions';
import { Role } from '../../auth/enums/role.enum';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounts')
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
    @Query('userId') userId: string,
    @User() user: UserSession,
  ) {
    const targetUserId =
      user.role === Role.Admin && userId ? userId : undefined;

    return this.handleResult(
      await this.accountService.findAll(
        pageOptionsDto,
        user.userId,
        targetUserId,
      ),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by id' })
  @ApiResponse({
    status: 200,
    description: 'Return account details.',
    type: AccountResponseDto,
  })
  async findOne(@Param('id') id: string, @User() user: UserSession) {
    return this.handleResult(
      await this.accountService.findOne(id, user.userId, user.role),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account' })
  @ApiResponse({ status: 200, description: 'Account updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @User() user: UserSession,
  ) {
    return this.handleResult(
      await this.accountService.update(
        id,
        updateAccountDto,
        user.userId,
        user.role,
      ),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
  async remove(@Param('id') id: string, @User() user: UserSession) {
    return this.handleResult(
      await this.accountService.remove(id, user.userId, user.role),
    );
  }

  @Get('users/:userId/stats')
  @ApiOperation({ summary: 'Get account statistics for a user' })
  @ApiResponse({
    status: 200,
    description: 'Return account statistics.',
  })
  async getStats(@Param('userId') userId: string, @User() user: UserSession) {
    if (user.role !== Role.Admin && user.userId !== userId) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    return this.handleResult(await this.accountService.getStats(userId));
  }

  protected resolveError(error: any): HttpException {
    if (error instanceof AccountNotFoundException) {
      return new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
    return super.resolveError(error);
  }

  @Roles(Role.Admin)
  @Get('users/:userId')
  @ApiOperation({ summary: 'Get all accounts for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Return all accounts for the user.',
    type: PageDto,
  })
  async findAllByUser(
    @Param('userId') userId: string,
    @Query() pageOptionsDto: PageOptionsDto,
    @User() user: UserSession,
  ) {
    const targetUserId = user.role === Role.Admin ? userId : user.userId;

    return this.handleResult(
      await this.accountService.findAll(
        pageOptionsDto,
        user.userId,
        targetUserId,
      ),
    );
  }
}
