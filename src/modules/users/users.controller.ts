import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../shared/enums/permissions.enum';
import { User } from './entities/user.entity';

@ApiTags('Users (Team)')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(Permission.TEAM_CREATE)
  @ApiOperation({ summary: 'Create a new user (Team Member)' })
  @ApiResponse({ status: 201, description: 'User created successfully.', type: User })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions(Permission.TEAM_READ)
  @ApiOperation({ summary: 'List all team members' })
  @ApiResponse({ status: 200, description: 'Returns list of all users.', type: [User] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.TEAM_READ)
  @ApiOperation({ summary: 'Get details of a specific user' })
  @ApiResponse({ status: 200, description: 'Returns user details.', type: User })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.TEAM_CREATE) // Reusing create permission for update
  @ApiOperation({ summary: 'Update a user profile or roles' })
  @ApiResponse({ status: 200, description: 'User updated successfully.', type: User })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TEAM_CREATE) // Only admins can delete
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
