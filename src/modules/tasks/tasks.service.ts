import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Subtask } from './entities/subtask.entity';
import { TaskComment } from './entities/task-comment.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType, ResourceType } from '../../shared/enums/notification.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Subtask)
    private readonly subtaskRepository: Repository<Subtask>,
    @InjectRepository(TaskComment)
    private readonly commentRepository: Repository<TaskComment>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const project = await this.projectRepository.findOne({ where: { id: dto.projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID "${dto.projectId}" not found.`);
    }

    let assignee: User | null = null;
    if (dto.assigneeId) {
      assignee = await this.userRepository.findOne({ where: { id: dto.assigneeId, isActive: true } });
      if (!assignee) {
        throw new NotFoundException(`User with ID "${dto.assigneeId}" not found or is inactive.`);
      }
    }

    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: dto.status,
      dueDate: dto.dueDate as unknown as Date,
      tags: dto.tags,
      project,
      ...(assignee && { assignee }),
    });

    const savedTask = await this.taskRepository.save(task);

    if (assignee) {
      this.eventEmitter.emit('notification.send', {
        userId: assignee.id,
        title: 'New Task Assigned',
        message: `You have been assigned to task: "${savedTask.title}" in project "${project.title}"`,
        type: NotificationType.TASK_ASSIGNED,
        resourceType: ResourceType.TASK,
        resourceId: savedTask.id,
      });
    }

    return savedTask;
  }

  async findAll(query: QueryTaskDto) {
    const { page, limit, search, projectId, assigneeId, status, priority } = query;
    const skip = (page - 1) * limit;

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('assignee.profile', 'assigneeProfile')
      .where('task.deleted_at IS NULL');

    if (search) {
      qb.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (projectId) {
      qb.andWhere('project.id = :projectId', { projectId });
    }

    if (assigneeId) {
      qb.andWhere('assignee.id = :assigneeId', { assigneeId });
    }

    if (status) {
      qb.andWhere('task.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('task.priority = :priority', { priority });
    }

    qb.orderBy('task.created_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: {
        project: true,
        assignee: { profile: true },
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId === null) {
        task.assignee = null as unknown as User;
      } else {
        const assignee = await this.userRepository.findOne({
          where: { id: dto.assigneeId, isActive: true },
        });
        if (!assignee) {
          throw new NotFoundException(`User with ID "${dto.assigneeId}" not found or is inactive.`);
        }
        task.assignee = assignee;
      }
    }

    const { assigneeId: _, ...rest } = dto;
    Object.assign(task, rest);

    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<{ message: string }> {
    const task = await this.findOne(id);
    await this.taskRepository.softRemove(task);
    return { message: `Task "${task.title}" has been archived.` };
  }

  // ──────────────── Subtasks ────────────────

  async getSubtasks(taskId: string): Promise<Subtask[]> {
    await this.findOne(taskId);
    return this.subtaskRepository.find({
      where: { task: { id: taskId } },
      order: { createdAt: 'ASC' },
    });
  }

  async createSubtask(taskId: string, dto: CreateSubtaskDto): Promise<Subtask> {
    const task = await this.findOne(taskId);
    const subtask = this.subtaskRepository.create({ ...dto, task });
    return this.subtaskRepository.save(subtask);
  }

  async updateSubtask(taskId: string, subtaskId: string, dto: UpdateSubtaskDto): Promise<Subtask> {
    const subtask = await this.subtaskRepository.findOne({
      where: { id: subtaskId, task: { id: taskId } },
    });
    if (!subtask) throw new NotFoundException(`Subtask with ID "${subtaskId}" not found.`);
    
    Object.assign(subtask, dto);
    return this.subtaskRepository.save(subtask);
  }

  async deleteSubtask(taskId: string, subtaskId: string): Promise<{ message: string }> {
    const subtask = await this.subtaskRepository.findOne({
      where: { id: subtaskId, task: { id: taskId } },
    });
    if (!subtask) throw new NotFoundException(`Subtask with ID "${subtaskId}" not found.`);
    
    await this.subtaskRepository.remove(subtask);
    return { message: 'Subtask deleted successfully.' };
  }

  // ──────────────── Comments ────────────────

  async getComments(taskId: string): Promise<TaskComment[]> {
    await this.findOne(taskId);
    return this.commentRepository.find({
      where: { task: { id: taskId } },
      relations: { user: { profile: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async addComment(taskId: string, userId: string, dto: CreateCommentDto): Promise<TaskComment> {
    const task = await this.findOne(taskId);
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) throw new NotFoundException('User not found.');

    const comment = this.commentRepository.create({
      content: dto.content,
      task,
      user,
    });
    const savedComment = await this.commentRepository.save(comment);

    // Notify task assignee about new comment (if not the commenter themselves)
    if (task.assignee && task.assignee.id !== userId) {
      this.eventEmitter.emit('notification.send', {
        userId: task.assignee.id,
        title: 'New Comment on Task',
        message: `${user.profile?.firstName ?? 'Someone'} commented on "${task.title}"`,
        type: NotificationType.TASK_ASSIGNED,
        resourceType: ResourceType.TASK,
        resourceId: task.id,
      });
    }

    return savedComment;
  }

  async deleteComment(taskId: string, commentId: string, userId: string): Promise<{ message: string }> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, task: { id: taskId } },
      relations: { user: true },
    });
    if (!comment) throw new NotFoundException('Comment not found.');
    
    // Check if the user trying to delete is the owner of the comment (we can also let admins bypass this later via guards)
    if (comment.user.id !== userId) {
      throw new NotFoundException('You can only delete your own comments.');
    }

    await this.commentRepository.softRemove(comment);
    return { message: 'Comment deleted successfully.' };
  }
}
