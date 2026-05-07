/**
 * src/models/Bid.js
 * Bid entity model with ORM patterns and relationships
 */

const BaseModel = require('./BaseModel');

class Bid extends BaseModel {
  constructor(data = {}) {
    super('Bids', {
      lotId: 'lot_id',
      bidderId: 'bidder_id',
      bidderName: 'bidder_name',
      amount: 'amount',
      createdAt: 'created_at'
    });
    
    this.lotId = data.lotId;
    this.bidderId = data.bidderId;
    this.bidderName = data.bidderName;
    this.amount = data.amount;
    this.createdAt = data.createdAt || new Date();
    
    // Relationship cache
    this._lot = null;
    this._bidder = null;
  }

  /**
   * Convert database row to Bid instance
   */
  static fromRow(row) {
    return new Bid({
      lotId: row.lot_id,
      bidderId: row.bidder_id,
      bidderName: row.bidder_name,
      amount: Number(row.amount),
      createdAt: row.created_at
    });
  }

  /**
   * Validation rules
   */
  validate() {
    const errors = [];
    
    if (!this.lotId) {
      errors.push('Lot ID is required');
    }
    
    if (!this.bidderId) {
      errors.push('Bidder ID is required');
    }
    
    if (!this.bidderName || this.bidderName.trim().length < 2) {
      errors.push('Bidder name must be at least 2 characters long');
    }
    
    if (!this.amount || this.amount <= 0) {
      errors.push('Bid amount must be greater than 0');
    }
    
    return errors;
  }

  /**
   * Get associated lot (many-to-one relationship)
   */
  async getLot() {
    if (!this._lot) {
      const Lot = require('./Lot');
      this._lot = await Lot.findById(this.lotId);
    }
    return this._lot;
  }

  /**
   * Get bidder (many-to-one relationship)
   */
  async getBidder() {
    if (!this._bidder) {
      const User = require('./User');
      this._bidder = await User.findById(this.bidderId);
    }
    return this._bidder;
  }

  /**
   * Find bids by lot
   */
  static async findByLot(lotId) {
    const pool = await getPool();
    const sql = `
      SELECT * FROM Bids 
      WHERE lot_id = ? 
      ORDER BY amount DESC, created_at ASC
    `;
    const result = await pool.query(sql, [lotId]);
    return result[0].map(row => this.fromRow(row));
  }

  /**
   * Find bids by bidder
   */
  static async findByBidder(bidderId) {
    return await this.findBy({ bidder_id: bidderId });
  }

  /**
   * Get highest bid for a lot
   */
  static async getHighestBid(lotId) {
    const pool = await getPool();
    const sql = `
      SELECT * FROM Bids 
      WHERE lot_id = ? 
      ORDER BY amount DESC 
      LIMIT 1
    `;
    const result = await pool.query(sql, [lotId]);
    return result[0].length ? this.fromRow(result[0][0]) : null;
  }

  /**
   * Get bid history for a lot
   */
  static async getBidHistory(lotId, limit = 10) {
    const pool = await getPool();
    const sql = `
      SELECT * FROM Bids 
      WHERE lot_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const result = await pool.query(sql, [lotId, limit]);
    return result[0].map(row => this.fromRow(row));
  }

  /**
   * Create bid with validation
   */
  static async create(bidData) {
    const bid = new Bid(bidData);
    const errors = bid.validate();
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return await bid.save();
  }

  /**
   * Check if this is the highest bid
   */
  async isHighest() {
    const highestBid = await Bid.getHighestBid(this.lotId);
    return highestBid && highestBid.id === this.id;
  }

  /**
   * Get bid rank (1 = highest)
   */
  async getRank() {
    const bids = await Bid.findByLot(this.lotId);
    return bids.findIndex(bid => bid.id === this.id) + 1;
  }
}

module.exports = Bid;
