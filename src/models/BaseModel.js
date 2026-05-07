/**
 * src/models/BaseModel.js
 * Base ORM model class with common CRUD operations
 */

const { getPool } = require('../db/pool');

class BaseModel {
  constructor(tableName, fields = {}) {
    this.tableName = tableName;
    this.fields = fields;
    this.pool = null;
  }

  /**
   * Get database connection pool
   */
  async getConnection() {
    if (!this.pool) {
      this.pool = await getPool();
    }
    return this.pool;
  }

  /**
   * Convert database row to model instance
   */
  static fromRow(row) {
    throw new Error('fromRow method must be implemented in child class');
  }

  /**
   * Convert model to database row
   */
  toRow() {
    const row = {};
    Object.keys(this.fields).forEach(key => {
      if (this[key] !== undefined) {
        row[this.fields[key]] = this[key];
      }
    });
    return row;
  }

  /**
   * CREATE - Insert new record
   */
  async save() {
    const pool = await this.getConnection();
    const row = this.toRow();
    
    const fields = Object.keys(row);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(row);

    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;

    const result = await pool.query(sql, values);
    this.id = result[0].insertId || this.id;
    return this;
  }

  /**
   * UPDATE - Update existing record
   */
  async update() {
    const pool = await this.getConnection();
    const row = this.toRow();
    
    const fields = Object.keys(row).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...fields.map(field => row[field]), this.id];

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = ?
    `;

    await pool.query(sql, values);
    return this;
  }

  /**
   * CREATE or UPDATE (Upsert)
   */
  async saveOrUpdate() {
    if (this.id) {
      return await this.update();
    } else {
      return await this.save();
    }
  }

  /**
   * DELETE - Remove record
   */
  async delete() {
    const pool = await this.getConnection();
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await pool.query(sql, [this.id]);
    return true;
  }

  /**
   * READ ALL - Find all records
   */
  static async findAll() {
    const pool = await getPool();
    const sql = `SELECT * FROM ${this.prototype.tableName}`;
    const result = await pool.query(sql);
    return result[0].map(row => this.fromRow(row));
  }

  /**
   * READ ONE - Find by ID
   */
  static async findById(id) {
    const pool = await getPool();
    const sql = `SELECT * FROM ${this.prototype.tableName} WHERE id = ?`;
    const result = await pool.query(sql, [id]);
    return result[0].length ? this.fromRow(result[0][0]) : null;
  }

  /**
   * Find by custom criteria
   */
  static async findBy(criteria) {
    const pool = await getPool();
    const whereClause = Object.keys(criteria).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(criteria);
    const sql = `SELECT * FROM ${this.prototype.tableName} WHERE ${whereClause}`;
    const result = await pool.query(sql, values);
    return result[0].map(row => this.fromRow(row));
  }

  /**
   * Execute custom query
   */
  static async query(sql, params = []) {
    const pool = await getPool();
    const result = await pool.query(sql, params);
    return result[0];
  }
}

module.exports = BaseModel;
