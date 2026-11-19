import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';

export const AdminOnly = () =>
  applyDecorators(UseGuards(AdminGuard), ApiBearerAuth('admin'));
