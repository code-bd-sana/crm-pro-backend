import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../shared/enums/permissions.enum';
import { TeamAnalyticsResponseDto, UserStatsResponseDto } from './dto/analytics-response.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('team')
  @RequirePermissions(Permission.TEAM_READ)
  @ApiOperation({ summary: 'Get global team analytics (Productivity, Top Performers, Dept Performance)' })
  @ApiResponse({ status: 200, description: 'Returns aggregated team analytics.', type: TeamAnalyticsResponseDto })
  getTeamAnalytics() {
    return this.analyticsService.getTeamAnalytics();
  }

  @Get('users/:id/stats')
  @RequirePermissions(Permission.TEAM_READ)
  @ApiOperation({ summary: 'Get performance statistics for a specific user' })
  @ApiResponse({ status: 200, description: 'Returns user statistics (Completion rate, active tasks/projects).', type: UserStatsResponseDto })
  getUserStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.getUserStats(id);
  }

  @Get('dashboard')
  @RequirePermissions(Permission.DASHBOARD_READ)
  @ApiOperation({ summary: 'Get dashboard summary metrics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard summary data.' })
  async getDashboardSummary() {
    const summary = await this.analyticsService.getDashboardSummary();
    const recentActivity = await this.analyticsService.getRecentActivity();
    const upcomingDeadlines = await this.analyticsService.getUpcomingDeadlines();
    return { summary, recentActivity, upcomingDeadlines };
  }

  @Get('revenue')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'Get monthly revenue for the last 6 months' })
  @ApiResponse({ status: 200, description: 'Returns monthly revenue data.' })
  getRevenueAnalytics() {
    return this.analyticsService.getRevenueAnalytics();
  }

  @Get('projects-performance')
  @RequirePermissions(Permission.REPORTS_READ)
  @ApiOperation({ summary: 'Get project performance metrics and top clients' })
  @ApiResponse({ status: 200, description: 'Returns project status distribution and top clients by revenue.' })
  getProjectsPerformance() {
    return this.analyticsService.getProjectsPerformance();
  }
}
