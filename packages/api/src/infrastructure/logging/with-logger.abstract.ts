import { Logger } from '@nestjs/common';

export abstract class WithLogger {
  protected readonly logger: Logger;

  protected constructor(context?: string) {
    const resolved = context ?? ((new.target as any)?.name ?? (this.constructor as any)?.name ?? 'UnknownContext');
    this.logger = new Logger(resolved);
  }
}

type Ctor<T = object> = abstract new (...args: any[]) => T;

export function WithLoggerMixin<TBase extends Ctor>(Base: TBase) {
  abstract class WithLoggerClass extends Base {
    public readonly logger: Logger;

    constructor(...args: any[]) {
      super(...args);
      const resolved = ((new.target as any)?.name ?? (this.constructor as any)?.name ?? 'UnknownContext');
      this.logger = new Logger(resolved);
    }
  };
}