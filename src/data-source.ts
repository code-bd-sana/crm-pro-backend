import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { UserProfile } from './modules/users/entities/user-profile.entity';
import { Role } from './modules/roles/entities/role.entity';
import { Permission } from './modules/roles/entities/permission.entity';
import { Task } from './modules/tasks/entities/task.entity';
import { TaskActivity } from './modules/tasks/entities/task-activity.entity';
import { Subtask } from './modules/tasks/entities/subtask.entity';
import { TaskComment } from './modules/tasks/entities/task-comment.entity';
import { Project } from './modules/projects/entities/project.entity';
import { ProjectMilestone } from './modules/projects/entities/project-milestone.entity';
import { Client } from './modules/clients/entities/client.entity';
import { ClientCommunication } from './modules/clients/entities/client-communication.entity';
import { Department } from './modules/departments/entities/department.entity';
import { Invoice } from './modules/invoices/entities/invoice.entity';
import { InvoiceItem } from './modules/invoices/entities/invoice-item.entity';
import { Payment } from './modules/invoices/entities/payment.entity';
import { Attachment } from './modules/attachments/entities/attachment.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Setting } from './modules/settings/entities/setting.entity';
import * as path from 'path';

// Resolve migrations directory relative to this file
const migrationsPath = path.join(__dirname, 'migrations', '*{.ts,.js}');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_DATABASE || 'fbintbd_crm',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    UserProfile,
    Role,
    Permission,
    Task,
    TaskActivity,
    Subtask,
    TaskComment,
    Project,
    ProjectMilestone,
    Client,
    ClientCommunication,
    Department,
    Invoice,
    InvoiceItem,
    Payment,
    Attachment,
    Notification,
    Setting,
  ],
  migrations: [migrationsPath],
  synchronize: false,
});
