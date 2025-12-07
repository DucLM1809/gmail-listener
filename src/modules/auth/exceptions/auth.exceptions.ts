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

export class PasswordReuseException extends AppException {
  constructor() {
    super('New password cannot be the same as the old password');
    this.name = 'PasswordReuseException';
  }
}

export class InvalidTokenException extends AppException {
  constructor() {
    super('Invalid or expired token');
    this.name = 'InvalidTokenException';
  }
}

export class InvalidTokenTypeException extends AppException {
  constructor() {
    super('Invalid token type');
    this.name = 'InvalidTokenTypeException';
  }
}

export class InvalidTwoFactorCodeException extends AppException {
  constructor() {
    super('Invalid 2FA code');
    this.name = 'InvalidTwoFactorCodeException';
  }
}
