import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../shared/enums/permissions.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Task } from './entities/task.entity';
import { Subtask } from './entities/subtask.entity';
import { MessageResponseDto } from '../../shared/dto/message-response.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequirePermissions(Permission.TASKS_CREATE)
  @ApiOperation({ summary: 'Create a new task within a project' })
  @ApiResponse({ status: 201, description: 'Task created successfully.', type: Task })
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.TASKS_READ)
  @ApiOperation({ summary: 'List all tasks with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully.', type: [Task] })
  findAll(@Query() query: QueryTaskDto) {
    return this.tasksService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.TASKS_READ)
  @ApiOperation({ summary: 'Get task details with project and assignee info' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully.', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.TASKS_UPDATE)
  @ApiOperation({ summary: 'Update task details, status, priority, or reassign' })
  @ApiResponse({ status: 200, description: 'Task updated successfully.', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TASKS_DELETE)
  @ApiOperation({ summary: 'Soft delete (archive) a task' })
  @ApiResponse({ status: 200, description: 'Task archived successfully.', type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }

  // ──────────────── Subtasks ────────────────

  @Get(':id/subtasks')
  @RequirePermissions(Permission.TASKS_READ)
  @ApiOperation({ summary: 'List all subtasks for a task' })
  @ApiResponse({ status: 200, description: 'Subtasks retrieved successfully.', type: [Subtask] })
  getSubtasks(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.getSubtasks(id);
  }

  @Post(':id/subtasks')
  @RequirePermissions(Permission.TASKS_UPDATE)
  @ApiOperation({ summary: 'Create a new subtask (checklist item)' })
  @ApiResponse({ status: 201, description: 'Subtask created successfully.', type: Subtask })
  createSubtask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.tasksService.createSubtask(id, dto);
  }

  @Patch(':id/subtasks/:subtaskId')
  @RequirePermissions(Permission.TASKS_UPDATE)
  @ApiOperation({ summary: 'Update a subtask (e.g. mark as completed)' })
  @ApiResponse({ status: 200, description: 'Subtask updated successfully.', type: Subtask })
  updateSubtask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('subtaskId', ParseUUIDPipe) subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.tasksService.updateSubtask(id, subtaskId, dto);
  }

  @Delete(':id/subtasks/:subtaskId')
  @RequirePermissions(Permission.TASKS_UPDATE)
  @ApiOperation({ summary: 'Delete a subtask' })
  @ApiResponse({ status: 200, description: 'Subtask deleted successfully.', type: MessageResponseDto })
  deleteSubtask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('subtaskId', ParseUUIDPipe) subtaskId: string,
  ) {
    return this.tasksService.deleteSubtask(id, subtaskId);
  }

  // ──────────────── Comments ────────────────

  @Get(':id/comments')
  @RequirePermissions(Permission.TASKS_READ)
  @ApiOperation({ summary: 'List all comments for a task' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully.' })
  getComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.getComments(id);
  }

  @Post(':id/comments')
  @RequirePermissions(Permission.TASKS_READ) // Requires read access to the task to comment
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiResponse({ status: 201, description: 'Comment added successfully.' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tasksService.addComment(id, userId, dto);
  }

  @Delete(':id/comments/:commentId')
  @RequirePermissions(Permission.TASKS_READ)
  @ApiOperation({ summary: 'Delete a comment (must be owner)' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully.' })
  deleteComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.deleteComment(id, commentId, userId);
  }
}
