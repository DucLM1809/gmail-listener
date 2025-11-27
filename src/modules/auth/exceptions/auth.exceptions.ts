import { AppException } from '../../../core/exceptions/app.exception';

export class InvalidCredentialsException extends AppException {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsException';
  }
}

export class UserAlreadyExistsException extends AppException {
  constructor() {
    super('User already exists');
    this.name = 'UserAlreadyExistsException';
  }
}
