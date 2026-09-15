export const Permission = {
  // Clients
  CLIENTS_READ: 'clients.read',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_UPDATE: 'clients.update',
  CLIENTS_DELETE: 'clients.delete',

  // Projects
  PROJECTS_READ: 'projects.read',
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',

  // Tasks
  TASKS_READ: 'tasks.read',
  TASKS_CREATE: 'tasks.create',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',

  // Invoices
  INVOICES_READ: 'invoices.read',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_UPDATE: 'invoices.update',
  INVOICES_DELETE: 'invoices.delete',

  // Team / Users
  TEAM_READ: 'team.read',
  TEAM_CREATE: 'team.create',
  TEAM_UPDATE: 'team.update',
  TEAM_DELETE: 'team.delete',

  // Departments
  DEPARTMENTS_READ: 'departments.read',
  DEPARTMENTS_CREATE: 'departments.create',
  DEPARTMENTS_UPDATE: 'departments.update',
  DEPARTMENTS_DELETE: 'departments.delete',

  // Reports
  REPORTS_READ: 'reports.read',
  REPORTS_EXPORT: 'reports.export',

  // Dashboard
  DASHBOARD_READ: 'dashboard.read',

  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',

  // Roles
  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
} as const;

export type PermissionType = typeof Permission[keyof typeof Permission];
