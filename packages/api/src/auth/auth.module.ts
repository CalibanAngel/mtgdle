import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminSessionService } from './admin-session.service';

@Global()
@Module({
  providers: [AdminGuard, AdminSessionService],
  exports: [AdminGuard, AdminSessionService],
})
export class AuthModule {}
