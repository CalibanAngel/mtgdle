import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor() {}

  getHello(): string {
    return 'Hello World!';
  }
}
