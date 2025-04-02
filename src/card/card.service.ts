import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor() {}
}
