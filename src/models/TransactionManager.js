/**
 * src/models/TransactionManager.js
 * Transaction management for ORM operations
 */

const { getPool } = require('../db/pool');

class TransactionManager {
  constructor() {
    this.connection = null;
    this.isActive = false;
  }

  /**
   * Begin transaction
   */
  async begin() {
    if (this.isActive) {
      throw new Error('Transaction is already active');
    }

    const pool = await getPool();
    this.connection = await pool.getConnection();
    await this.connection.beginTransaction();
    this.isActive = true;
    
    console.log('🔄 Transaction started');
    return this;
  }

  /**
   * Commit transaction
   */
  async commit() {
    if (!this.isActive || !this.connection) {
      throw new Error('No active transaction to commit');
    }

    try {
      await this.connection.commit();
      console.log('✅ Transaction committed successfully');
      return true;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Rollback transaction
   */
  async rollback() {
    if (!this.isActive || !this.connection) {
      throw new Error('No active transaction to rollback');
    }

    try {
      await this.connection.rollback();
      console.log('❌ Transaction rolled back');
      return true;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Clean up connection
   */
  async cleanup() {
    if (this.connection) {
      this.connection.release();
      this.connection = null;
    }
    this.isActive = false;
  }

  /**
   * Execute query within transaction
   */
  async query(sql, params = []) {
    if (!this.isActive || !this.connection) {
      throw new Error('No active transaction');
    }

    return await this.connection.query(sql, params);
  }

  /**
   * Save model within transaction
   */
  async saveModel(model) {
    if (!this.isActive || !this.connection) {
      throw new Error('No active transaction');
    }

    const row = model.toRow();
    const fields = Object.keys(row);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(row);

    const sql = `
      INSERT INTO ${model.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;

    const result = await this.query(sql, values);
    model.id = result[0].insertId || model.id;
    return model;
  }

  /**
   * Update model within transaction
   */
  async updateModel(model) {
    if (!this.isActive || !this.connection) {
      throw new Error('No active transaction');
    }

    const row = model.toRow();
    const fields = Object.keys(row).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...fields.map(field => row[field]), model.id];

    const sql = `
      UPDATE ${model.tableName}
      SET ${setClause}
      WHERE id = ?
    `;

    await this.query(sql, values);
    return model;
  }

  /**
   * Delete model within transaction
   */
  async deleteModel(model) {
    if (!this.isActive || !this.connection) {
      throw new Error('No active transaction');
    }

    const sql = `DELETE FROM ${model.tableName} WHERE id = ?`;
    await this.query(sql, [model.id]);
    return true;
  }

  /**
   * Execute function within transaction
   */
  static async execute(callback) {
    const transaction = new TransactionManager();
    
    try {
      await transaction.begin();
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }
      throw error;
    }
  }

  /**
   * Execute multiple operations atomically
   */
  static async executeAtomic(operations) {
    return await this.execute(async (transaction) => {
      const results = [];
      
      for (const operation of operations) {
        const result = await operation(transaction);
        results.push(result);
      }
      
      return results;
    });
  }
}

module.exports = TransactionManager;
