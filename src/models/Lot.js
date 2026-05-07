/**
 * src/models/Lot.js
 * Lot entity model with ORM patterns and relationships
 */

const BaseModel = require('./BaseModel');

class Lot extends BaseModel {
  constructor(data = {}) {
    super('Lots', {
      id: 'id',
      title: 'title',
      description: 'description',
      startPrice: 'start_price',
      currentPrice: 'current_price',
      ownerId: 'owner_id',
      ownerName: 'owner_name',
      status: 'status',
      keywords: 'keywords',
      imageUrl: 'image_url',
      createdAt: 'created_at'
    });
    
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.startPrice = data.startPrice;
    this.currentPrice = data.currentPrice;
    this.ownerId = data.ownerId;
    this.ownerName = data.ownerName;
    this.status = data.status || 'active';
    this.keywords = data.keywords || [];
    this.imageUrl = data.imageUrl;
    this.createdAt = data.createdAt || new Date();
    
    // Relationship cache
    this._owner = null;
    this._bids = null;
  }

  /**
   * Convert database row to Lot instance
   */
  static fromRow(row) {
    const lot = new Lot({
      id: row.id,
      title: row.title,
      description: row.description,
      startPrice: Number(row.start_price),
      currentPrice: Number(row.current_price),
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      status: row.status,
      keywords: this.parseKeywords(row.keywords),
      imageUrl: row.image_url,
      createdAt: row.created_at
    });
    return lot;
  }

  /**
   * Convert keywords array to JSON string
   */
  toRow() {
    const row = super.toRow();
    if (this.keywords && Array.isArray(this.keywords)) {
      row.keywords = JSON.stringify(this.keywords);
    }
    return row;
  }

  /**
   * Parse keywords from JSON string
   */
  static parseKeywords(raw) {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  /**
   * Validation rules
   */
  validate() {
    const errors = [];
    
    if (!this.title || this.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }
    
    if (!this.startPrice || this.startPrice <= 0) {
      errors.push('Start price must be greater than 0');
    }
    
    if (!this.ownerId) {
      errors.push('Owner ID is required');
    }
    
    if (!this.ownerName || this.ownerName.trim().length < 2) {
      errors.push('Owner name must be at least 2 characters long');
    }
    
    if (!['active', 'completed', 'cancelled'].includes(this.status)) {
      errors.push('Status must be active, completed, or cancelled');
    }
    
    return errors;
  }

  /**
   * Get lot owner (many-to-one relationship)
   */
  async getOwner() {
    if (!this._owner) {
      const User = require('./User');
      this._owner = await User.findById(this.ownerId);
    }
    return this._owner;
  }

  /**
   * Get lot bids (one-to-many relationship)
   */
  async getBids() {
    if (!this._bids) {
      const Bid = require('./Bid');
      this._bids = await Bid.findBy({ lot_id: this.id });
    }
    return this._bids;
  }

  /**
   * Get highest bid
   */
  async getHighestBid() {
    const bids = await this.getBids();
    return bids.length > 0 ? bids.reduce((max, bid) => bid.amount > max.amount ? bid : max) : null;
  }

  /**
   * Get display price (current price or start price if no bids)
   */
  async getDisplayPrice() {
    const bids = await this.getBids();
    return bids.length > 0 ? this.currentPrice : this.startPrice;
  }

  /**
   * Find active lots
   */
  static async findActive() {
    const pool = await getPool();
    const sql = 'SELECT * FROM Lots WHERE status = ? ORDER BY created_at DESC';
    const result = await pool.query(sql, ['active']);
    return result[0].map(row => this.fromRow(row));
  }

  /**
   * Find lots by owner
   */
  static async findByOwner(ownerId) {
    return await this.findBy({ owner_id: ownerId });
  }

  /**
   * Search lots by keywords
   */
  static async searchByKeywords(searchTerm) {
    const pool = await getPool();
    const sql = `
      SELECT * FROM Lots 
      WHERE status = 'active' AND (
        title LIKE ? OR 
        description LIKE ? OR 
        keywords LIKE ?
      )
      ORDER BY created_at DESC
    `;
    const searchTermPattern = `%${searchTerm}%`;
    const result = await pool.query(sql, [searchTermPattern, searchTermPattern, searchTermPattern]);
    return result[0].map(row => this.fromRow(row));
  }

  /**
   * Create lot with validation
   */
  static async create(lotData) {
    const lot = new Lot(lotData);
    const errors = lot.validate();
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return await lot.save();
  }

  /**
   * Update lot with validation
   */
  async updateData(lotData) {
    Object.assign(this, lotData);
    const errors = this.validate();
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return await this.update();
  }

  /**
   * Complete the auction
   */
  async complete() {
    this.status = 'completed';
    return await this.update();
  }

  /**
   * Cancel the auction
   */
  async cancel() {
    this.status = 'cancelled';
    return await this.update();
  }

  /**
   * Get lot statistics
   */
  async getStatistics() {
    const bids = await this.getBids();
    const highestBid = await this.getHighestBid();
    
    return {
      totalBids: bids.length,
      uniqueBidders: [...new Set(bids.map(bid => bid.bidderId))].length,
      highestBid: highestBid ? highestBid.amount : 0,
      currentPrice: this.currentPrice,
      priceIncrease: this.currentPrice - this.startPrice
    };
  }
}

module.exports = Lot;
