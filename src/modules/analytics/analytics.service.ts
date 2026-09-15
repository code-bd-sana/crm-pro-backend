import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not, Equal } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskStatus } from '../../shared/enums/task.enum';
import { Department } from '../departments/entities/department.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoiceStatus } from '../../shared/enums/invoice.enum';
import { TaskActivity } from '../tasks/entities/task-activity.entity';
import { Client } from '../clients/entities/client.entity';
import { ProjectStatus } from '../../shared/enums/project.enum';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(TaskActivity)
    private readonly taskActivityRepository: Repository<TaskActivity>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async getUserStats(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const allTasks = await this.taskRepository.find({
      where: { assignee: { id: userId } },
      relations: { project: true },
    });

    const activeTasks = allTasks.filter((t) => t.status !== TaskStatus.DONE);
    const completedTasks = allTasks.filter((t) => t.status === TaskStatus.DONE);
    
    const taskCompletionRate = allTasks.length > 0 
      ? Math.round((completedTasks.length / allTasks.length) * 100) 
      : 0;

    const activeProjects = await this.projectRepository.count({
      where: { members: { id: userId } }
    });

    return {
      activeTasksCount: activeTasks.length,
      completedTasksCount: completedTasks.length,
      activeProjectsCount: activeProjects,
      taskCompletionRate,
      recentActiveTasks: activeTasks.slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        project: t.project?.title,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
    };
  }

  async getTeamAnalytics() {
    const allTasks = await this.taskRepository.find({
      relations: { assignee: { profile: { department: true } } },
    });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === TaskStatus.DONE);
    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Team Productivity (Mocking a 92% base + actual)
    const teamProductivity = overallCompletionRate > 0 ? overallCompletionRate + 5 : 0; 
    
    // Task Completion By Member
    const memberStats = new Map<string, { name: string; completed: number; total: number; score: number }>();
    
    allTasks.forEach((t) => {
      if (t.assignee) {
        const id = t.assignee.id;
        if (!memberStats.has(id)) {
          memberStats.set(id, { 
            name: `${t.assignee.profile.firstName} ${t.assignee.profile.lastName}`, 
            completed: 0, 
            total: 0,
            score: 0,
          });
        }
        
        const stat = memberStats.get(id);
        if (stat) {
          stat.total += 1;
          if (t.status === TaskStatus.DONE) stat.completed += 1;
          
          // Simple score calculation
          stat.score = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
        }
      }
    });

    const topPerformers = Array.from(memberStats.values())
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 3);

    // Department Performance
    const deptStats = new Map<string, { name: string; members: Set<string>; completed: number; total: number }>();
    
    allTasks.forEach((t) => {
      const dept = t.assignee?.profile?.department;
      if (dept) {
        if (!deptStats.has(dept.id)) {
          deptStats.set(dept.id, { name: dept.name, members: new Set(), completed: 0, total: 0 });
        }
        
        const stat = deptStats.get(dept.id);
        if (stat) {
          stat.members.add(t.assignee.id);
          stat.total += 1;
          if (t.status === TaskStatus.DONE) stat.completed += 1;
        }
      }
    });

    const departmentPerformance = Array.from(deptStats.values()).map(d => ({
      name: d.name,
      membersCount: d.members.size,
      productivity: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    }));

    return {
      globalMetrics: {
        teamProductivity,
        averageScore: topPerformers.length > 0 ? Math.round(topPerformers.reduce((s, p) => s + p.score, 0) / topPerformers.length) : 0,
        taskCompletionRate: overallCompletionRate,
        teamSatisfaction: 91, // Static for now, could be derived from surveys later
      },
      taskCompletionByMember: Array.from(memberStats.values()).map(m => ({ name: m.name, completed: m.completed })),
      departmentPerformance,
      topPerformers,
    };
  }

  // ──────────────── Dashboard Analytics ────────────────

  async getDashboardSummary() {
    const totalClients = await this.clientRepository.count({
      where: { deletedAt: IsNull() },
    });

    const activeProjects = await this.projectRepository.count({
      where: { status: ProjectStatus.ACTIVE, deletedAt: IsNull() },
    });

    const totalTasks = await this.taskRepository.count({
      where: { deletedAt: IsNull() },
    });

    const completedTasks = await this.taskRepository.count({
      where: { status: TaskStatus.DONE, deletedAt: IsNull() },
    });

    // Tasks due today (not completed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await this.taskRepository.count({
      where: {
        dueDate: Between(today, tomorrow),
        status: Not(Equal(TaskStatus.DONE)),
        deletedAt: IsNull(),
      },
    });

    // Revenue this month (from PAID + PARTIALLY_PAID invoices)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const revenueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount)', 'total')
      .where('invoice.status IN (:...statuses)', { statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID] })
      .andWhere('invoice.issueDate >= :startOfMonth', { startOfMonth })
      .getRawOne();

    const revenueThisMonth = Number(revenueResult?.total ?? 0);

    // Task status distribution
    const tasksTodo = await this.taskRepository.count({
      where: { status: TaskStatus.TODO, deletedAt: IsNull() },
    });
    const tasksInProgress = await this.taskRepository.count({
      where: { status: TaskStatus.IN_PROGRESS, deletedAt: IsNull() },
    });

    return {
      totalClients,
      activeProjects,
      tasksDueToday,
      totalTasks,
      completedTasks,
      revenueThisMonth,
      tasksByStatus: {
        todo: tasksTodo,
        inProgress: tasksInProgress,
        done: completedTasks,
      },
    };
  }

  async getRecentActivity(limit = 10) {
    const activities = await this.taskActivityRepository.find({
      relations: { user: { profile: true }, task: { project: true } },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return activities.map((a) => ({
      id: a.id,
      description: a.actionDescription,
      userName: a.user ? `${a.user.profile?.firstName ?? ''} ${a.user.profile?.lastName ?? ''}`.trim() || 'System' : 'System',
      initials: a.user ? `${a.user.profile?.firstName?.charAt(0) ?? ''}${a.user.profile?.lastName?.charAt(0) ?? ''}`.toUpperCase() : 'SY',
      taskTitle: a.task?.title,
      projectTitle: a.task?.project?.title,
      createdAt: a.createdAt,
    }));
  }

  async getUpcomingDeadlines(limit = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const tasks = await this.taskRepository.find({
      where: {
        dueDate: Between(today, nextWeek),
        status: Not(Equal(TaskStatus.DONE)),
        deletedAt: IsNull(),
      },
      relations: { project: true, assignee: { profile: true } },
      order: { dueDate: 'ASC' },
      take: limit,
    });

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      projectTitle: t.project?.title,
      assigneeName: t.assignee ? `${t.assignee.profile?.firstName ?? ''} ${t.assignee.profile?.lastName ?? ''}`.trim() : null,
    }));
  }

  // ──────────────── Revenue Analytics ────────────────

  async getRevenueAnalytics() {
    // Get last 6 months revenue grouped by month
    const months: { name: string; value: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);

      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);

      const monthName = d.toLocaleString('en-US', { month: 'short' });

      const result = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.totalAmount), 0)', 'total')
        .where('invoice.status IN (:...statuses)', { statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID] })
        .andWhere('invoice.issueDate >= :start', { start: d })
        .andWhere('invoice.issueDate < :end', { end: next })
        .getRawOne();

      months.push({
        name: monthName,
        value: Number(result?.total ?? 0),
      });
    }

    return months;
  }

  // ──────────────── Projects Performance ────────────────

  async getProjectsPerformance() {
    const projects = await this.projectRepository.find({
      where: { deletedAt: IsNull() },
      relations: { client: true },
    });

    const statusDistribution: Record<string, number> = {};
    Object.values(ProjectStatus).forEach((s) => (statusDistribution[s] = 0));

    projects.forEach((p) => {
      statusDistribution[p.status] = (statusDistribution[p.status] || 0) + 1;
    });

    const projectStatus = Object.entries(statusDistribution).map(([status, count]) => ({
      status,
      count,
    }));

    // Top clients by total invoice value
    const topClientsRaw = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('client.id', 'clientId')
      .addSelect('client.companyName', 'companyName')
      .addSelect('SUM(invoice.totalAmount)', 'total')
      .leftJoin('invoice.client', 'client')
      .where('invoice.status IN (:...statuses)', { statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID] })
      .groupBy('client.id')
      .addGroupBy('client.companyName')
      .orderBy('total', 'DESC')
      .limit(5)
      .getRawMany();

    const topClients = topClientsRaw.map((r) => ({
      name: r.companyName ?? 'Unknown',
      value: Number(r.total ?? 0),
    }));

    return {
      totalProjects: projects.length,
      projectStatus,
      topClients,
    };
  }
}
