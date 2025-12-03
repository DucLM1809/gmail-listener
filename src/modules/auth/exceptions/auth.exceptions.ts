import { AppException } from '../../../core/exceptions/app.exception';

export class InvalidCredentialsException extends AppException {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsException';
  }
}

export class TwoFactorRequiredException extends AppException {
  constructor() {
    super('Two-factor authentication required');
    this.name = 'TwoFactorRequiredException';
  }
}

export class UserAlreadyExistsException extends AppException {
  constructor() {
    super('User already exists');
    this.name = 'UserAlreadyExistsException';
  }
}
