/**
 * src/models/User.js
 * User entity model with ORM patterns
 */

const BaseModel = require('./BaseModel');
const { getPool } = require('../db/pool');

class User extends BaseModel {
  constructor(data = {}) {
    super('Users', {
      id: 'id',
      name: 'name',
      email: 'email',
      password: 'password',
      role: 'role',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
    
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'user';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Convert database row to User instance
   */
  static fromRow(row) {
    return new User({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Validation rules
   */
  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!this.email || !this.email.includes('@')) {
      errors.push('Valid email is required');
    }
    
    return errors;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const pool = await getPool();
    const sql = 'SELECT * FROM Users WHERE email = ?';
    const result = await pool.query(sql, [email]);
    return result[0].length ? this.fromRow(result[0][0]) : null;
  }

  /**
   * Get user's lots (one-to-many relationship)
   */
  async getLots() {
    const Lot = require('./Lot');
    return await Lot.findBy({ owner_id: this.id });
  }

  /**
   * Get user's bids (one-to-many relationship)
   */
  async getBids() {
    const Bid = require('./Bid');
    return await Bid.findBy({ bidder_id: this.id });
  }

  /**
   * Check if user owns a specific lot
   */
  async ownsLot(lotId) {
    const Lot = require('./Lot');
    const lot = await Lot.findById(lotId);
    return lot && lot.ownerId === this.id;
  }

  /**
   * Create user with validation
   */
  static async create(userData) {
    const user = new User(userData);
    const errors = user.validate();
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return await user.save();
  }

  /**
   * Update user with validation
   */
  async updateData(userData) {
    Object.assign(this, userData);
    const errors = this.validate();
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return await this.update();
  }

  /**
   * Get user statistics
   */
  async getStatistics() {
    const lots = await this.getLots();
    const bids = await this.getBids();
    
    return {
      totalLots: lots.length,
      activeLots: lots.filter(lot => lot.status === 'active').length,
      totalBids: bids.length,
      totalBidAmount: bids.reduce((sum, bid) => sum + bid.amount, 0)
    };
  }
}

module.exports = User;
