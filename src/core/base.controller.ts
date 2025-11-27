import { HttpException, HttpStatus } from '@nestjs/common';
import { Result } from './result';

export abstract class BaseController {
  protected handleResult<T>(result: Result<T>): T {
    if (result.isFailure) {
      throw this.resolveError(result.error);
    }
    return result.getValue();
  }

  protected resolveError(error: any): HttpException {
    return new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
