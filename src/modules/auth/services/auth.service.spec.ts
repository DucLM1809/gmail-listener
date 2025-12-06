import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import {
  InvalidCredentialsException,
  PasswordReuseException,
} from '../exceptions/auth.exceptions';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from 'src/core/services/app-logger.service';
import { EmailService } from 'src/modules/email/email.service';
import { TokenService } from './token.service';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';
import * as bcrypt from 'bcrypt';
import { Result } from 'src/core/result';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: IUserRepository;
  let tokenService: TokenService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockEmailService = {
    sendTemplateEmail: jest.fn(),
  };

  const mockTokenService = {
    generateToken: jest.fn(),
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: EmailService, useValue: mockEmailService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<IUserRepository>('IUserRepository');
    tokenService = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resetPassword', () => {
    it('should fail if new password is the same as old password', async () => {
      const token = 'valid-token';
      const newPassword = 'samePassword';
      const oldPasswordHash = await bcrypt.hash(newPassword, 10);
      const userId = 'user-id';

      mockTokenService.verifyToken.mockResolvedValue({
        type: 'reset-password',
        sub: userId,
      });

      mockUserRepository.findOne.mockResolvedValue({
        id: userId,
        password: oldPasswordHash,
      });

      const result = await service.resetPassword(token, newPassword);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PasswordReuseException);
    });

    it('should succeed if new password is different', async () => {
      const token = 'valid-token';
      const newPassword = 'newPassword';
      const oldPassword = 'oldPassword';
      const oldPasswordHash = await bcrypt.hash(oldPassword, 10);
      const userId = 'user-id';

      mockTokenService.verifyToken.mockResolvedValue({
        type: 'reset-password',
        sub: userId,
      });

      mockUserRepository.findOne.mockResolvedValue({
        id: userId,
        password: oldPasswordHash,
      });

      mockUserRepository.update.mockResolvedValue({
        id: userId,
      });

      const result = await service.resetPassword(token, newPassword);

      expect(result.isSuccess).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile if user exists', async () => {
      const userId = 'user-id';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        picture: 'http://example.com/pic.jpg',
        role: 1,
        isTwoFactorEnabled: false,
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.getProfile(userId);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(user);
    });

    it('should fail if user does not exist', async () => {
      const userId = 'user-id';

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.getProfile(userId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidCredentialsException);
    });
  });
});
