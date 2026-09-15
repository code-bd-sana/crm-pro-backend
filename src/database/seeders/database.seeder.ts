import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../modules/roles/entities/role.entity';
import { Permission } from '../../modules/roles/entities/permission.entity';
import { User } from '../../modules/users/entities/user.entity';
import { SystemRoles } from '../../shared/enums/system-roles.enum';

import { Permission as PermissionEnum } from '../../shared/enums/permissions.enum';

// All system permissions — driven by the central enum
const SYSTEM_PERMISSIONS: { slug: string; module: string; description: string }[] = [
  // Clients
  { slug: PermissionEnum.CLIENTS_READ, module: 'clients', description: 'View clients' },
  { slug: PermissionEnum.CLIENTS_CREATE, module: 'clients', description: 'Create clients' },
  { slug: PermissionEnum.CLIENTS_UPDATE, module: 'clients', description: 'Update clients' },
  { slug: PermissionEnum.CLIENTS_DELETE, module: 'clients', description: 'Delete clients' },
  // Projects
  { slug: PermissionEnum.PROJECTS_READ, module: 'projects', description: 'View projects' },
  { slug: PermissionEnum.PROJECTS_CREATE, module: 'projects', description: 'Create projects' },
  { slug: PermissionEnum.PROJECTS_UPDATE, module: 'projects', description: 'Update projects' },
  { slug: PermissionEnum.PROJECTS_DELETE, module: 'projects', description: 'Delete projects' },
  // Tasks
  { slug: PermissionEnum.TASKS_READ, module: 'tasks', description: 'View tasks' },
  { slug: PermissionEnum.TASKS_CREATE, module: 'tasks', description: 'Create tasks' },
  { slug: PermissionEnum.TASKS_UPDATE, module: 'tasks', description: 'Update tasks' },
  { slug: PermissionEnum.TASKS_DELETE, module: 'tasks', description: 'Delete tasks' },
  // Invoices
  { slug: PermissionEnum.INVOICES_READ, module: 'invoices', description: 'View invoices' },
  { slug: PermissionEnum.INVOICES_CREATE, module: 'invoices', description: 'Create invoices' },
  { slug: PermissionEnum.INVOICES_UPDATE, module: 'invoices', description: 'Update invoices' },
  { slug: PermissionEnum.INVOICES_DELETE, module: 'invoices', description: 'Delete invoices' },
  // Team
  { slug: PermissionEnum.TEAM_READ, module: 'team', description: 'View team members' },
  { slug: PermissionEnum.TEAM_CREATE, module: 'team', description: 'Add team members' },
  { slug: PermissionEnum.TEAM_UPDATE, module: 'team', description: 'Update team members' },
  { slug: PermissionEnum.TEAM_DELETE, module: 'team', description: 'Delete team members' },
  // Departments
  { slug: PermissionEnum.DEPARTMENTS_READ, module: 'departments', description: 'View departments' },
  { slug: PermissionEnum.DEPARTMENTS_CREATE, module: 'departments', description: 'Create departments' },
  { slug: PermissionEnum.DEPARTMENTS_UPDATE, module: 'departments', description: 'Update departments' },
  { slug: PermissionEnum.DEPARTMENTS_DELETE, module: 'departments', description: 'Delete departments' },
  // Reports
  { slug: PermissionEnum.REPORTS_READ, module: 'reports', description: 'View reports' },
  { slug: PermissionEnum.REPORTS_EXPORT, module: 'reports', description: 'Export reports' },
  // Dashboard
  { slug: PermissionEnum.DASHBOARD_READ, module: 'dashboard', description: 'View dashboard' },
  // Settings
  { slug: PermissionEnum.SETTINGS_READ, module: 'settings', description: 'View system settings' },
  { slug: PermissionEnum.SETTINGS_UPDATE, module: 'settings', description: 'Update system settings' },
  // Roles
  { slug: PermissionEnum.ROLES_READ, module: 'roles', description: 'View roles' },
  { slug: PermissionEnum.ROLES_CREATE, module: 'roles', description: 'Create roles' },
  { slug: PermissionEnum.ROLES_UPDATE, module: 'roles', description: 'Update roles' },
  { slug: PermissionEnum.ROLES_DELETE, module: 'roles', description: 'Delete roles' },
];

@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Runs automatically on app startup — seeds permissions, roles, and default super admin
  async onApplicationBootstrap() {
    this.logger.log('Running database seeders...');
    await this.seedPermissions();
    await this.seedDefaultRoles();
    await this.seedSuperAdmin();
    this.logger.log('Database seeding completed.');
  }

  private async seedPermissions() {
    for (const perm of SYSTEM_PERMISSIONS) {
      const exists = await this.permissionRepository.findOne({
        where: { slug: perm.slug },
      });
      if (!exists) {
        await this.permissionRepository.save(
          this.permissionRepository.create(perm),
        );
      }
    }
  }

  private async seedDefaultRoles() {
    const allPermissions = await this.permissionRepository.find();

    const defaults = [
      {
        name: SystemRoles.SUPER_ADMIN,
        description: 'Full system access',
        isSystem: true,
        permissions: allPermissions,
      },
      {
        name: SystemRoles.ADMIN,
        description: 'Can manage projects, clients, tasks and team',
        isSystem: true,
        permissions: allPermissions.filter((p) =>
          ['clients', 'projects', 'tasks', 'invoices', 'team', 'dashboard', 'reports', 'departments'].includes(p.module),
        ),
      },
      {
        name: SystemRoles.MANAGER,
        description: 'Can manage projects and teams',
        isSystem: true,
        permissions: allPermissions.filter((p) =>
          ['projects', 'tasks', 'team', 'dashboard'].includes(p.module),
        ),
      },
      {
        name: SystemRoles.STAFF,
        description: 'Can view and edit assigned tasks',
        isSystem: true,
        permissions: allPermissions.filter((p) =>
          ['tasks', 'dashboard'].includes(p.module),
        ),
      },
      {
        name: SystemRoles.CLIENT,
        description: 'Client portal access — read-only view of own invoices and projects',
        isSystem: true,
        permissions: allPermissions.filter((p) =>
          p.slug === PermissionEnum.CLIENTS_READ ||
          p.slug === PermissionEnum.INVOICES_READ ||
          p.slug === PermissionEnum.DASHBOARD_READ,
        ),
      },
    ];

    for (const def of defaults) {
      const existing = await this.roleRepository.findOne({
        where: { name: def.name },
        relations: { permissions: true },
      });
      if (!existing) {
        await this.roleRepository.save(this.roleRepository.create(def));
      } else {
        // Add any permissions introduced after the role was first seeded
        const existingIds = new Set((existing.permissions ?? []).map((p) => p.id));
        const missing = def.permissions.filter((p) => !existingIds.has(p.id));
        if (missing.length > 0) {
          existing.permissions = [...(existing.permissions ?? []), ...missing];
          await this.roleRepository.save(existing);
          this.logger.log(
            `Role "${def.name}" updated with ${missing.length} new permission(s).`,
          );
        }
      }
    }
  }

  private async seedSuperAdmin() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    // Throw error if env variables are missing
    if (!email || !password) {
      this.logger.error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables are required for seeding!');
      throw new Error('Missing Super Admin credentials in environment variables.');
    }

    const exists = await this.userRepository.findOne({ where: { email } });
    if (exists) {
      return; // Already seeded — skip safely
    }

    const superAdminRole = await this.roleRepository.findOne({
      where: { name: SystemRoles.SUPER_ADMIN },
    });
    if (!superAdminRole) {
      throw new Error('Super Admin role not found. Seeding failed.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Profile will be saved automatically due to cascade: true on User -> UserProfile
    const admin = this.userRepository.create({
      email,
      password: hashedPassword,
      isActive: true,
      roles: [superAdminRole],
      profile: {
        firstName: process.env.SUPER_ADMIN_FIRST_NAME ?? 'Super',
        lastName: process.env.SUPER_ADMIN_LAST_NAME ?? 'Admin',
      },
    });

    await this.userRepository.save(admin);
    this.logger.log(`Super Admin seeded successfully: ${email}`);
  }
}
