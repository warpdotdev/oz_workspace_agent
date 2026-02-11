import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { UnauthorizedError, ConflictError } from '../utils/errors.js';
import { generateToken, getTokenExpiresIn } from '../middleware/auth.js';
import type { LoginInput, RegisterInput } from '../utils/validation.js';
import type { TokenResponse } from '../types/index.js';

const SALT_ROUNDS = 12;

/**
 * Authentication Service
 * Handles user registration, login, and token management
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<TokenResponse> {
    const { email, password, name } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
      },
    });

    // Generate token
    const token = generateToken(user);
    const expiresIn = getTokenExpiresIn();

    return {
      token,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Login an existing user
   */
  async login(input: LoginInput): Promise<TokenResponse> {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user);
    const expiresIn = getTokenExpiresIn();

    return {
      token,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            agents: true,
            tasks: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
