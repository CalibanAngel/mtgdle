import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { adminOperations } from '@mtgdle/shared-types';
import type {
  AdminOperation,
  AdminSession,
  AdminJob,
  AdminColumn,
  AdminTable,
  AdminRows,
  AdminDay,
  AdminStatistics,
  AdminHealth,
} from '@mtgdle/shared-types';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MaxLength(40)
  username: string;
  @ApiProperty({ writeOnly: true, format: 'password', maxLength: 256 })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password: string;
}
export class AdminSessionDto implements AdminSession {
  @ApiProperty() configured: boolean;
  @ApiProperty() authenticated: boolean;
  @ApiProperty({ type: String, nullable: true }) username: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  expiresAt: string | null;
}
export class AdminJobRequestDto {
  @ApiProperty({ enum: adminOperations })
  @IsIn(adminOperations)
  operation: AdminOperation;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cardId?: string;
  @ApiPropertyOptional({ type: [String], maxItems: 100 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  names?: string[];
}
export class AdminJobDto implements AdminJob {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: adminOperations }) operation: AdminOperation;
  @ApiProperty({ enum: ['running', 'succeeded', 'failed'] })
  status: AdminJob['status'];
  @ApiProperty({ format: 'date-time' }) startedAt: string;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  finishedAt: string | null;
  @ApiProperty({ type: String, nullable: true }) result: string | null;
  @ApiProperty({ type: String, nullable: true }) error: string | null;
}
export class AdminColumnDto implements AdminColumn {
  @ApiProperty() name: string;
  @ApiProperty() type: string;
  @ApiProperty() primary: boolean;
  @ApiProperty() nullable: boolean;
}
export class AdminTableDto implements AdminTable {
  @ApiProperty() name: string;
  @ApiProperty() label: string;
  @ApiProperty() count: number;
  @ApiProperty({ type: [AdminColumnDto] }) columns: AdminColumnDto[];
}
export class AdminRowsDto implements AdminRows {
  @ApiProperty() table: string;
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty({ type: [AdminColumnDto] }) columns: AdminColumnDto[];
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description:
      'Read-only rows. Large values are previewed; use the row detail for their contents.',
  })
  rows: Record<string, unknown>[];
}
export class AdminRowDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'One read-only application record; no SQL commands or writes are accepted.',
  })
  data: Record<string, unknown>;
}
export class AdminDayDto implements AdminDay {
  @ApiProperty({ format: 'date' }) day: string;
  @ApiProperty() sessions: number;
  @ApiProperty({ description: 'Sessions with at least one guess.' })
  players: number;
  @ApiProperty() won: number;
  @ApiProperty() abandoned: number;
  @ApiProperty() guesses: number;
  @ApiProperty() winningGuesses: number;
  @ApiProperty() reduceHints: number;
  @ApiProperty() artHints: number;
  @ApiProperty() textHints: number;
}
export class AdminDistributionDto {
  @ApiProperty() guesses: number;
  @ApiProperty() count: number;
}
export class AdminStatisticsDto implements AdminStatistics {
  @ApiProperty({ format: 'date' }) since: string;
  @ApiProperty({ format: 'date' }) until: string;
  @ApiProperty({ type: [AdminDayDto] }) days: AdminDayDto[];
  @ApiProperty({ type: [AdminDistributionDto] })
  distribution: AdminDistributionDto[];
}
export class AdminHealthDto implements AdminHealth {
  @ApiProperty({ enum: ['up', 'down'] }) database: AdminHealth['database'];
  @ApiProperty({ enum: ['up', 'down'] }) scryfall: AdminHealth['scryfall'];
  @ApiProperty({ format: 'date-time' }) checkedAt: string;
}
export class AdminStatisticsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 90, default: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days = 30;
}
export class AdminRowsQueryDto {
  @ApiPropertyOptional({ default: 1, maximum: 1000000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  page = 1;
  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 20;
  @ApiPropertyOptional({
    description:
      'Search text and identifiers, with literal wildcard characters.',
  })
  @IsString()
  @MaxLength(80)
  q = '';
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) sort?: string;
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'ASC';
}
export class AdminRowQueryDto {
  @ApiProperty({
    description: 'JSON object containing exactly the primary key columns.',
  })
  @IsString()
  @MaxLength(500)
  @MinLength(2)
  key: string;
}
