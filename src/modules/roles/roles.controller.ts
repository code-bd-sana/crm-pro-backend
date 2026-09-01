import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission as PermissionEnum } from '../../shared/enums/permissions.enum';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @RequirePermissions(PermissionEnum.ROLES_READ)
  @ApiOperation({ summary: 'List all roles with attached permissions' })
  @ApiResponse({ status: 200, description: 'Roles retrieved', type: [Role] })
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Post('roles')
  @RequirePermissions(PermissionEnum.ROLES_CREATE)
  @ApiOperation({ summary: 'Create a new dynamic role' })
  @ApiResponse({ status: 201, description: 'Role created', type: Role })
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Patch('roles/:id')
  @RequirePermissions(PermissionEnum.ROLES_UPDATE)
  @ApiOperation({ summary: 'Update role details or permission assignments' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role updated', type: Role })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @RequirePermissions(PermissionEnum.ROLES_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete role (system roles cannot be deleted)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.deleteRole(id);
  }

  @Get('permissions')
  @RequirePermissions(PermissionEnum.ROLES_READ)
  @ApiOperation({ summary: 'List all available system permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved', type: [Permission] })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post('roles/assign-user')
  @RequirePermissions(PermissionEnum.ROLES_UPDATE)
  @ApiOperation({ summary: 'Assign or change role for a specific user' })
  @ApiResponse({ status: 201, description: 'Role assigned to user' })
  assignRole(@Body() dto: AssignRoleDto) {
    return this.rolesService.assignRoleToUser(dto);
  }
}
