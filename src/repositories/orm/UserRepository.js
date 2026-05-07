/**
 * src/repositories/orm/UserRepository.js
 * ORM-based User Repository with full CRUD operations
 * Demonstrates Object-Relational Mapping principles
 */

const User = require('../../models/User');
const Lot = require('../../models/Lot');
const Bid = require('../../models/Bid');
const { getPool } = require('../../db/pool');

class UserRepository {
  /**
   * CREATE - Create a new user (with validation)
   */
  static async create(userData) {
    console.log(`👤 Creating user: ${userData.name}`);
    
    try {
      const user = await User.create(userData);
      console.log(`✅ User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      console.error(`❌ Failed to create user: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find all users
   */
  static async findAll() {
    console.log('👥 Fetching all users');
    
    try {
      const users = await User.findAll();
      console.log(`✅ Found ${users.length} users`);
      return users;
    } catch (error) {
      console.error(`❌ Failed to fetch users: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find user by ID with relationships
   */
  static async findById(id) {
    console.log(`🔍 Finding user: ${id}`);
    
    try {
      const user = await User.findById(id);
      
      if (user) {
        // Load relationships
        user._lots = await user.getLots();
        user._bids = await user.getBids();
        user._statistics = await user.getStatistics();
        
        console.log(`✅ Found user: ${user.name}`);
      } else {
        console.log(`❌ User not found: ${id}`);
      }
      
      return user;
    } catch (error) {
      console.error(`❌ Failed to find user: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find user by email
   */
  static async findByEmail(email) {
    console.log(`📧 Finding user by email: ${email}`);
    
    try {
      const user = await User.findByEmail(email);
      
      if (user) {
        console.log(`✅ Found user: ${user.name}`);
      } else {
        console.log(`❌ User not found with email: ${email}`);
      }
      
      return user;
    } catch (error) {
      console.error(`❌ Failed to find user by email: ${error.message}`);
      throw error;
    }
  }

  /**
   * UPDATE - Update existing user (with validation)
   */
  static async update(id, updateData) {
    console.log(`✏️ Updating user: ${id}`);
    
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      await user.updateData(updateData);
      console.log(`✅ User updated successfully: ${user.name}`);
      return user;
    } catch (error) {
      console.error(`❌ Failed to update user: ${error.message}`);
      throw error;
    }
  }

  /**
   * DELETE - Delete user (with cascade handling)
   */
  static async delete(id) {
    console.log(`🗑️ Deleting user: ${id}`);
    
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has lots or bids (business rule)
      const lots = await user.getLots();
      const bids = await user.getBids();
      
      if (lots.length > 0) {
        throw new Error('Cannot delete user with existing lots');
      }
      
      if (bids.length > 0) {
        throw new Error('Cannot delete user with existing bids');
      }

      await user.delete();
      console.log(`✅ User deleted successfully: ${user.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete user: ${error.message}`);
      throw error;
    }
  }

  /**
   * RELATIONSHIP - Get user's lots with bid information
   */
  static async getUserLotsWithBids(userId) {
    console.log(`🏷️ Getting lots with bids for user: ${userId}`);
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const lots = await user.getLots();
      
      // Load bid information for each lot
      for (const lot of lots) {
        lot._bids = await lot.getBids();
        lot._highestBid = await lot.getHighestBid();
        lot._statistics = await lot.getStatistics();
      }

      console.log(`✅ Retrieved ${lots.length} lots with bid information`);
      return lots;
    } catch (error) {
      console.error(`❌ Failed to get user lots with bids: ${error.message}`);
      throw error;
    }
  }

  /**
   * RELATIONSHIP - Get user's bid history
   */
  static async getUserBidHistory(userId) {
    console.log(`💰 Getting bid history for user: ${userId}`);
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const bids = await user.getBids();
      
      // Load lot information for each bid
      for (const bid of bids) {
        bid._lot = await bid.getLot();
        bid._isWinner = await bid.isHighest();
      }

      console.log(`✅ Retrieved ${bids.length} bids for user`);
      return bids;
    } catch (error) {
      console.error(`❌ Failed to get user bid history: ${error.message}`);
      throw error;
    }
  }

  /**
   * AGGREGATE - Get user statistics
   */
  static async getUserStatistics(userId) {
    console.log(`📊 Getting statistics for user: ${userId}`);
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const statistics = await user.getStatistics();
      console.log(`✅ Retrieved statistics for user: ${user.name}`);
      return statistics;
    } catch (error) {
      console.error(`❌ Failed to get user statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * BUSINESS OPERATION - Check if user can bid on lot
   */
  static async canUserBidOnLot(userId, lotId) {
    console.log(`🔍 Checking if user ${userId} can bid on lot ${lotId}`);
    
    try {
      const user = await User.findById(userId);
      const lot = await Lot.findById(lotId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!lot) {
        throw new Error('Lot not found');
      }

      // Business rules
      const canBid = lot.status === 'active' && lot.ownerId !== userId;
      
      console.log(`✅ User ${user.name} ${canBid ? 'can' : 'cannot'} bid on lot ${lot.title}`);
      return { canBid, user, lot, reason: canBid ? null : 
        lot.status !== 'active' ? 'Lot is not active' : 'User owns this lot' };
    } catch (error) {
      console.error(`❌ Failed to check bid eligibility: ${error.message}`);
      throw error;
    }
  }

  /**
   * SEARCH - Search users by name
   */
  static async searchByName(name) {
    console.log(`🔍 Searching users with name: ${name}`);
    
    try {
      const pool = await getPool();
      const sql = 'SELECT * FROM Users WHERE name LIKE ? ORDER BY name';
      const result = await pool.query(sql, [`%${name}%`]);
      const users = result[0].map(row => User.fromRow(row));
      
      console.log(`✅ Found ${users.length} users matching search`);
      return users;
    } catch (error) {
      console.error(`❌ Failed to search users: ${error.message}`);
      throw error;
    }
  }

  /**
   * BATCH OPERATION - Create multiple users
   */
  static async batchCreate(usersData) {
    console.log(`📦 Batch creating ${usersData.length} users`);
    
    try {
      const results = [];
      
      for (const userData of usersData) {
        const user = await this.create(userData);
        results.push(user);
      }
      
      console.log(`✅ Successfully created ${results.length} users`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to batch create users: ${error.message}`);
      throw error;
    }
  }

  /**
   * AGGREGATE - Get user ranking by bids
   */
  static async getUserRanking() {
    console.log('🏆 Getting user ranking by bids');
    
    try {
      const pool = await getPool();
      const sql = `
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(b.id) as totalBids,
          COUNT(DISTINCT b.lot_id) as uniqueLots,
          AVG(b.amount) as avgBidAmount,
          MAX(b.amount) as highestBid,
          SUM(b.amount) as totalBidAmount
        FROM Users u
        LEFT JOIN Bids b ON u.id = b.bidder_id
        GROUP BY u.id, u.name, u.email
        ORDER BY totalBids DESC, totalBidAmount DESC
      `;
      
      const result = await pool.query(sql);
      const rankings = result[0].map((row, index) => ({
        rank: index + 1,
        user: User.fromRow(row),
        statistics: {
          totalBids: row.totalBids,
          uniqueLots: row.uniqueLots,
          avgBidAmount: Number(row.avgBidAmount) || 0,
          highestBid: Number(row.highestBid) || 0,
          totalBidAmount: Number(row.totalBidAmount) || 0
        }
      }));
      
      console.log(`✅ Retrieved ranking for ${rankings.length} users`);
      return rankings;
    } catch (error) {
      console.error(`❌ Failed to get user ranking: ${error.message}`);
      throw error;
    }
  }
}

module.exports = UserRepository;
