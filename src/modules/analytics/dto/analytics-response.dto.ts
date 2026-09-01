import { ApiProperty } from '@nestjs/swagger';

class GlobalMetrics {
  @ApiProperty({ example: 85 })
  teamProductivity: number;

  @ApiProperty({ example: 92 })
  averageScore: number;

  @ApiProperty({ example: 88 })
  taskCompletionRate: number;

  @ApiProperty({ example: 91 })
  teamSatisfaction: number;
}

export class TeamAnalyticsResponseDto {
  @ApiProperty({ type: () => GlobalMetrics })
  globalMetrics: GlobalMetrics;

  @ApiProperty({ example: [{ name: 'John Doe', completed: 15 }] })
  taskCompletionByMember: any[];

  @ApiProperty({ example: [{ name: 'Engineering', membersCount: 5, productivity: 85 }] })
  departmentPerformance: any[];

  @ApiProperty({ example: [{ id: 'uuid', name: 'John Doe', score: 95, avatar: null }] })
  topPerformers: any[];
}

export class UserStatsResponseDto {
  @ApiProperty({ example: 45 })
  completionRate: number;

  @ApiProperty({ example: 12 })
  activeTasks: number;

  @ApiProperty({ example: 3 })
  activeProjects: number;
}
