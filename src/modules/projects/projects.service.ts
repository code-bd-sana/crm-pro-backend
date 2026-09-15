import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMilestone } from './entities/project-milestone.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType, ResourceType } from '../../shared/enums/notification.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMilestone)
    private readonly milestoneRepository: Repository<ProjectMilestone>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    const client = await this.clientRepository.findOne({ where: { id: dto.clientId } });
    if (!client) {
      throw new NotFoundException(`Client with ID "${dto.clientId}" not found.`);
    }

    let members: User[] = [];
    if (dto.memberIds?.length) {
      members = await this.userRepository.findBy({ id: In(dto.memberIds) });
      if (members.length !== dto.memberIds.length) {
        throw new BadRequestException('One or more member IDs are invalid.');
      }
    }

    const project = this.projectRepository.create({
      title: dto.title,
      description: dto.description,
      budget: dto.budget,
      priority: dto.priority,
      status: dto.status,
      startDate: dto.startDate as unknown as Date,
      dueDate: dto.dueDate as unknown as Date,
      client,
      members,
    });

    const savedProject = await this.projectRepository.save(project);

    // Notify members they were added to the project
    members.forEach((member) => {
      this.eventEmitter.emit('notification.send', {
        userId: member.id,
        title: 'Added to Project',
        message: `You have been added to project "${savedProject.title}"`,
        type: NotificationType.PROJECT_MEMBER_ADDED,
        resourceType: ResourceType.PROJECT,
        resourceId: savedProject.id,
      });
    });

    return savedProject;
  }

  async findAll(query: QueryProjectDto) {
    const { page, limit, search, clientId, status, priority } = query;
    const skip = (page - 1) * limit;

    const qb = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.client', 'client')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.profile', 'memberProfile')
      .where('project.deleted_at IS NULL');

    if (search) {
      qb.andWhere(
        '(project.title ILIKE :search OR project.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (clientId) {
      qb.andWhere('client.id = :clientId', { clientId });
    }

    if (status) {
      qb.andWhere('project.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('project.priority = :priority', { priority });
    }

    qb.orderBy('project.created_at', 'DESC').skip(skip).take(limit);

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

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: {
        client: true,
        members: { profile: true },
        milestones: true,
      },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found.`);
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    if (dto.memberIds !== undefined) {
      const members = dto.memberIds.length
        ? await this.userRepository.findBy({ id: In(dto.memberIds) })
        : [];
      if (dto.memberIds.length && members.length !== dto.memberIds.length) {
        throw new BadRequestException('One or more member IDs are invalid.');
      }
      project.members = members;
    }

    const { memberIds: _, ...rest } = dto;
    Object.assign(project, rest);

    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<{ message: string }> {
    const project = await this.findOne(id);
    await this.projectRepository.softRemove(project);
    return { message: `Project "${project.title}" has been archived.` };
  }

  // --- Milestones ---

  async getMilestones(projectId: string): Promise<ProjectMilestone[]> {
    await this.findOne(projectId); // ensure project exists
    return this.milestoneRepository.find({
      where: { project: { id: projectId } },
      order: { dueDate: 'ASC' },
    });
  }

  async createMilestone(
    projectId: string,
    dto: CreateMilestoneDto,
  ): Promise<ProjectMilestone> {
    const project = await this.findOne(projectId);
    const milestone = this.milestoneRepository.create({
      ...dto,
      dueDate: dto.dueDate as unknown as Date,
      project,
    });
    return this.milestoneRepository.save(milestone);
  }

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ): Promise<ProjectMilestone> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id: milestoneId, project: { id: projectId } },
    });
    if (!milestone) {
      throw new NotFoundException(
        `Milestone with ID "${milestoneId}" not found in this project.`,
      );
    }
    Object.assign(milestone, dto);
    return this.milestoneRepository.save(milestone);
  }

  async deleteMilestone(
    projectId: string,
    milestoneId: string,
  ): Promise<{ message: string }> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id: milestoneId, project: { id: projectId } },
    });
    if (!milestone) {
      throw new NotFoundException(
        `Milestone with ID "${milestoneId}" not found in this project.`,
      );
    }
    await this.milestoneRepository.remove(milestone);
    return { message: `Milestone "${milestone.title}" has been deleted.` };
  }
}
