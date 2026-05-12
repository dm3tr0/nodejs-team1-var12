/**
 * src/auth/authService.js
 * Authentication service for JWT tokens and password hashing
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/orm/UserRepository');

class AuthService {
  // JWT Secret (should be in environment variables)
  static JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  static JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Register new user
   */
  static async register(userData) {
    const { name, email, password, role = 'user' } = userData;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user with password and role
    const user = await UserRepository.create({
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date()
    });

    // Generate token
    const token = this.generateToken(user);

    // Remove password from response
    delete user.password;

    return { user, token };
  }

  /**
   * Login user
   */
  static async login(email, password) {
    // Find user by email
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    if (!user.password || !await this.comparePassword(password, user.password)) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    // Remove password from response
    delete user.password;

    return { user, token };
  }

  /**
   * Refresh token
   */
  static async refreshToken(user) {
    const token = this.generateToken(user);
    return { token };
  }

  /**
   * Validate user role
   */
  static validateRole(userRole, requiredRole) {
    const roles = {
      'admin': 3,
      'moderator': 2,
      'user': 1
    };

    return roles[userRole] >= roles[requiredRole];
  }
}

module.exports = AuthService;
