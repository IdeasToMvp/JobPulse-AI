import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType } from '../activity.entity';

export const ACTIVITY_FILTER_TYPES = [
  'all',
  'application',
  'status_update',
  'suggestion',
  'sync',
] as const;

export type ActivityFilterType = (typeof ACTIVITY_FILTER_TYPES)[number];

export class ListActivitiesDto {
  @IsOptional()
  @IsIn(ACTIVITY_FILTER_TYPES)
  type?: ActivityFilterType = 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export function filterToActivityType(
  filter: ActivityFilterType = 'all',
): ActivityType | null {
  if (filter === 'all') return null;
  return filter as ActivityType;
}
