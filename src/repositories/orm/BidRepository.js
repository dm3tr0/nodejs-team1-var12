/**
 * src/repositories/orm/BidRepository.js
 * ORM-based Bid Repository with full CRUD operations
 * Demonstrates Object-Relational Mapping principles
 */

const Bid = require('../../models/Bid');
const Lot = require('../../models/Lot');
const User = require('../../models/User');
const { getPool } = require('../../db/pool');

class BidRepository {
  /**
   * CREATE - Create a new bid (with validation)
   */
  static async create(bidData) {
    console.log(`💰 Creating bid: ${bidData.amount}`);
    
    try {
      const bid = await Bid.create(bidData);
      console.log(`✅ Bid created successfully: ${bid.id}`);
      return bid;
    } catch (error) {
      console.error(`❌ Failed to create bid: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find all bids
   */
  static async findAll() {
    console.log('💰 Fetching all bids');
    
    try {
      const bids = await Bid.findAll();
      
      // Load relationships for each bid
      for (const bid of bids) {
        bid._lot = await bid.getLot();
        bid._bidder = await bid.getBidder();
      }
      
      console.log(`✅ Found ${bids.length} bids`);
      return bids;
    } catch (error) {
      console.error(`❌ Failed to fetch bids: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find bid by ID with relationships
   */
  static async findById(id) {
    console.log(`🔍 Finding bid: ${id}`);
    
    try {
      // Since bids don't have a simple ID (composite key), we need a different approach
      // For now, let's implement a method to find by lot and bidder
      throw new Error('Bids use composite key. Use findByLotAndBidder instead.');
    } catch (error) {
      console.error(`❌ Failed to find bid: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find bid by lot and bidder (composite key)
   */
  static async findByLotAndBidder(lotId, bidderId) {
    console.log(`🔍 Finding bid for lot ${lotId} by bidder ${bidderId}`);
    
    try {
      const pool = await getPool();
      const sql = `
        SELECT * FROM Bids 
        WHERE lot_id = ? AND bidder_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const result = await pool.query(sql, [lotId, bidderId]);
      
      if (result[0].length) {
        const bid = Bid.fromRow(result[0][0]);
        bid._lot = await bid.getLot();
        bid._bidder = await bid.getBidder();
        console.log(`✅ Found bid: ${bid.amount}`);
        return bid;
      } else {
        console.log(`❌ Bid not found for lot ${lotId} by bidder ${bidderId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Failed to find bid: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find bids by lot
   */
  static async findByLot(lotId) {
    console.log(`🏷️ Finding bids for lot: ${lotId}`);
    
    try {
      const bids = await Bid.findByLot(lotId);
      
      // Load relationships for each bid
      for (const bid of bids) {
        bid._lot = await bid.getLot();
        bid._bidder = await bid.getBidder();
      }
      
      console.log(`✅ Found ${bids.length} bids for lot`);
      return bids;
    } catch (error) {
      console.error(`❌ Failed to find bids by lot: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find bids by bidder
   */
  static async findByBidder(bidderId) {
    console.log(`👤 Finding bids for bidder: ${bidderId}`);
    
    try {
      const bids = await Bid.findByBidder(bidderId);
      
      // Load relationships for each bid
      for (const bid of bids) {
        bid._lot = await bid.getLot();
        bid._bidder = await bid.getBidder();
      }
      
      console.log(`✅ Found ${bids.length} bids for bidder`);
      return bids;
    } catch (error) {
      console.error(`❌ Failed to find bids by bidder: ${error.message}`);
      throw error;
    }
  }

  /**
   * UPDATE - Update existing bid (limited fields allowed)
   */
  static async update(lotId, bidderId, updateData) {
    console.log(`✏️ Updating bid for lot ${lotId} by bidder ${bidderId}`);
    
    try {
      const bid = await this.findByLotAndBidder(lotId, bidderId);
      if (!bid) {
        throw new Error('Bid not found');
      }

      // Only allow certain fields to be updated
      const allowedFields = ['amount'];
      const updates = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      Object.assign(bid, updates);
      await bid.update();
      
      console.log(`✅ Bid updated successfully`);
      return bid;
    } catch (error) {
      console.error(`❌ Failed to update bid: ${error.message}`);
      throw error;
    }
  }

  /**
   * DELETE - Delete bid
   */
  static async delete(lotId, bidderId) {
    console.log(`🗑️ Deleting bid for lot ${lotId} by bidder ${bidderId}`);
    
    try {
      const bid = await this.findByLotAndBidder(lotId, bidderId);
      if (!bid) {
        throw new Error('Bid not found');
      }

      await bid.delete();
      console.log(`✅ Bid deleted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete bid: ${error.message}`);
      throw error;
    }
  }

  /**
   * AGGREGATE - Get highest bid for a lot
   */
  static async getHighestBid(lotId) {
    console.log(`🏆 Getting highest bid for lot: ${lotId}`);
    
    try {
      const bid = await Bid.getHighestBid(lotId);
      
      if (bid) {
        bid._lot = await bid.getLot();
        bid._bidder = await bid.getBidder();
        console.log(`✅ Found highest bid: ${bid.amount}`);
      } else {
        console.log(`❌ No bids found for lot: ${lotId}`);
      }
      
      return bid;
    } catch (error) {
      console.error(`❌ Failed to get highest bid: ${error.message}`);
      throw error;
    }
  }

  /**
   * AGGREGATE - Get bid history for a lot
   */
  static async getBidHistory(lotId, limit = 10) {
    console.log(`📜 Getting bid history for lot: ${lotId}`);
    
    try {
      const bids = await Bid.getBidHistory(lotId, limit);
      
      // Load relationships for each bid
      for (const bid of bids) {
        bid._lot = await bid.getLot();
        bid._bidder = await bid.getBidder();
        bid._rank = await bid.getRank();
      }
      
      console.log(`✅ Retrieved ${bids.length} bid records`);
      return bids;
    } catch (error) {
      console.error(`❌ Failed to get bid history: ${error.message}`);
      throw error;
    }
  }

  /**
   * RELATIONSHIP - Get bids with lot and bidder information
   */
  static async getBidsWithFullInfo(lotId) {
    console.log(`📋 Getting bids with full info for lot: ${lotId}`);
    
    try {
      const pool = await getPool();
      const sql = `
        SELECT 
          b.*,
          l.title as lot_title,
          l.description as lot_description,
          u.name as bidder_name,
          u.email as bidder_email
        FROM Bids b
        JOIN Lots l ON b.lot_id = l.id
        JOIN Users u ON b.bidder_id = u.id
        WHERE b.lot_id = ?
        ORDER BY b.amount DESC, b.created_at ASC
      `;
      
      const result = await pool.query(sql, [lotId]);
      const bids = result[0].map(row => ({
        ...Bid.fromRow(row),
        lotTitle: row.lot_title,
        lotDescription: row.lot_description,
        bidderEmail: row.bidder_email
      }));
      
      console.log(`✅ Retrieved ${bids.length} bids with full info`);
      return bids;
    } catch (error) {
      console.error(`❌ Failed to get bids with full info: ${error.message}`);
      throw error;
    }
  }

  /**
   * AGGREGATE - Get bid statistics for a lot
   */
  static async getBidStatistics(lotId) {
    console.log(`📊 Getting bid statistics for lot: ${lotId}`);
    
    try {
      const pool = await getPool();
      const sql = `
        SELECT 
          COUNT(*) as totalBids,
          COUNT(DISTINCT bidder_id) as uniqueBidders,
          MIN(amount) as lowestBid,
          MAX(amount) as highestBid,
          AVG(amount) as avgBidAmount,
          SUM(amount) as totalBidAmount
        FROM Bids
        WHERE lot_id = ?
      `;
      
      const result = await pool.query(sql, [lotId]);
      const stats = result[0][0];
      
      // Convert to numbers
      Object.keys(stats).forEach(key => {
        if (key !== 'totalBids' && key !== 'uniqueBidders') {
          stats[key] = Number(stats[key]) || 0;
        }
      });
      
      console.log(`✅ Retrieved bid statistics for lot`);
      return stats;
    } catch (error) {
      console.error(`❌ Failed to get bid statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * SEARCH - Find bids by amount range
   */
  static async findByAmountRange(minAmount, maxAmount) {
    console.log(`💰 Finding bids between ${minAmount} and ${maxAmount}`);
    
    try {
      const pool = await getPool();
      const sql = `
        SELECT * FROM Bids 
        WHERE amount >= ? AND amount <= ?
        ORDER BY amount DESC
      `;
      const result = await pool.query(sql, [minAmount, maxAmount]);
      const bids = result[0].map(row => Bid.fromRow(row));
      
      // Load relationships
      for (const bid of bids) {
        bid._lot = await bid.getLot();
        bid._bidder = await bid.getBidder();
      }
      
      console.log(`✅ Found ${bids.length} bids in amount range`);
      return bids;
    } catch (error) {
      console.error(`❌ Failed to find bids by amount range: ${error.message}`);
      throw error;
    }
  }

  /**
   * BATCH OPERATION - Create multiple bids
   */
  static async batchCreate(bidsData) {
    console.log(`📦 Batch creating ${bidsData.length} bids`);
    
    try {
      const results = [];
      
      for (const bidData of bidsData) {
        const bid = await this.create(bidData);
        results.push(bid);
      }
      
      console.log(`✅ Successfully created ${results.length} bids`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to batch create bids: ${error.message}`);
      throw error;
    }
  }

  /**
   * BUSINESS OPERATION - Get competitive bidding analysis
   */
  static async getCompetitiveAnalysis(lotId) {
    console.log(`📈 Getting competitive analysis for lot: ${lotId}`);
    
    try {
      const bids = await this.findByLot(lotId);
      const statistics = await this.getBidStatistics(lotId);
      
      // Analyze bidding patterns
      const analysis = {
        totalBids: statistics.totalBids,
        uniqueBidders: statistics.uniqueBidders,
        priceRange: {
          lowest: statistics.lowestBid,
          highest: statistics.highestBid,
          average: statistics.avgBidAmount
        },
        competition: {
          level: statistics.uniqueBidders > 5 ? 'High' : 
                 statistics.uniqueBidders > 2 ? 'Medium' : 'Low',
          bidFrequency: statistics.totalBids / statistics.uniqueBidders || 0
        },
        timeline: bids.length > 0 ? {
          firstBid: bids[bids.length - 1].createdAt,
          lastBid: bids[0].createdAt,
          duration: new Date(bids[0].createdAt) - new Date(bids[bids.length - 1].createdAt)
        } : null
      };
      
      console.log(`✅ Retrieved competitive analysis`);
      return analysis;
    } catch (error) {
      console.error(`❌ Failed to get competitive analysis: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BidRepository;
