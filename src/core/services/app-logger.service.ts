import { Injectable, LoggerService } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AppLoggerService.name);
  }

  log(message: any, ...optionalParams: any[]) {
    this.logger.info(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    if (message instanceof Error) {
      this.logger.error(
        {
          err: message,
          msg: message.message,
          stack: message.stack,
          ...optionalParams,
        },
        message.message,
      );
    } else {
      this.logger.error(message, ...optionalParams);
    }
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logger.trace(message, ...optionalParams);
  }

  setContext(context: string) {
    this.logger.setContext(context);
  }
}
