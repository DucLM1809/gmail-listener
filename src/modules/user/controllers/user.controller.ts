import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/core/base.controller';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserNotFoundException } from '../exceptions/user.exceptions';
import { UserService } from '../services/user.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    const result = await this.userService.findAll();
    return this.handleResult(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  async findOne(@Param('id') id: string) {
    const result = await this.userService.findOne(id);
    return this.handleResult(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const result = await this.userService.update(id, updateUserDto);
    return this.handleResult(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string) {
    const result = await this.userService.delete(id);
    return this.handleResult(result);
  }

  protected resolveError(error: any): HttpException {
    if (error instanceof UserNotFoundException) {
      return new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
    return super.resolveError(error);
  }
}
