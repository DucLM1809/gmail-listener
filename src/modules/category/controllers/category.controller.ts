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
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PageOptionsDto } from '../../../core/dto/page-options.dto';
import { PageDto } from '../../../core/dto/page.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { User } from '../../../core/decorators/user.decorator';
import { UserSession } from '../../../core/interfaces/user-session.interface';
import { BaseController } from '../../../core/base.controller';
import { CategoryNotFoundException } from '../exceptions/category.exceptions';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoryController extends BaseController {
  constructor(private readonly categoryService: CategoryService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
    type: CategoryResponseDto,
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @User() user: UserSession,
  ) {
    return this.handleResult(
      await this.categoryService.create(createCategoryDto, user.userId),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Return all categories.',
    type: PageDto,
  })
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @User() user: UserSession,
  ) {
    return this.handleResult(
      await this.categoryService.findAll(pageOptionsDto, user.userId),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the category.',
    type: CategoryResponseDto,
  })
  async findOne(@Param('id') id: string) {
    return this.handleResult(await this.categoryService.findOne(id));
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
    type: CategoryResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.handleResult(
      await this.categoryService.update(id, updateCategoryDto),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
  })
  async remove(@Param('id') id: string, @User() user: UserSession) {
    return this.handleResult(
      await this.categoryService.remove(id, user.userId),
    );
  }

  protected resolveError(error: any): HttpException {
    if (error instanceof CategoryNotFoundException) {
      return new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
    return super.resolveError(error);
  }
}
