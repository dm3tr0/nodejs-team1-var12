/**
 * src/repositories/orm/LotRepository.js
 * ORM-based Lot Repository with full CRUD operations
 * Demonstrates Object-Relational Mapping principles
 */

const Lot = require('../../models/Lot');
const Bid = require('../../models/Bid');
const User = require('../../models/User');
const AuctionService = require('../../models/AuctionService');

class LotRepository {
  /**
   * CREATE - Create a new lot (with validation)
   */
  static async create(lotData) {
    console.log(`🔨 Creating lot: ${lotData.title}`);
    
    try {
      const lot = await Lot.create(lotData);
      console.log(`✅ Lot created successfully: ${lot.id}`);
      return lot;
    } catch (error) {
      console.error(`❌ Failed to create lot: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find all lots with relationships
   */
  static async findAll() {
    console.log('📋 Fetching all lots');
    
    try {
      const lots = await Lot.findAll();
      
      // Load relationships for each lot
      for (const lot of lots) {
        lot._bids = await lot.getBids();
        lot._owner = await lot.getOwner();
      }
      
      console.log(`✅ Found ${lots.length} lots`);
      return lots;
    } catch (error) {
      console.error(`❌ Failed to fetch lots: ${error.message}`);
      throw error;
    }
  }

  /**
   * READ - Find lot by ID with all relationships
   */
  static async findById(id) {
    console.log(`🔍 Finding lot: ${id}`);
    
    try {
      const lot = await Lot.findById(id);
      
      if (lot) {
        // Load all relationships
        lot._bids = await lot.getBids();
        lot._owner = await lot.getOwner();
        lot._highestBid = await lot.getHighestBid();
        
        console.log(`✅ Found lot: ${lot.title}`);
      } else {
        console.log(`❌ Lot not found: ${id}`);
      }
      
      return lot;
    } catch (error) {
      console.error(`❌ Failed to find lot: ${error.message}`);
      throw error;
    }
  }

  /**
   * UPDATE - Update existing lot (with validation)
   */
  static async update(id, updateData) {
    console.log(`✏️ Updating lot: ${id}`);
    
    try {
      const lot = await Lot.findById(id);
      if (!lot) {
        throw new Error('Lot not found');
      }

      await lot.updateData(updateData);
      console.log(`✅ Lot updated successfully: ${lot.title}`);
      return lot;
    } catch (error) {
      console.error(`❌ Failed to update lot: ${error.message}`);
      throw error;
    }
  }

  /**
   * DELETE - Delete lot (with cascade handling)
   */
  static async delete(id) {
    console.log(`🗑️ Deleting lot: ${id}`);
    
    try {
      const lot = await Lot.findById(id);
      if (!lot) {
        throw new Error('Lot not found');
      }

      // Check if lot has bids (business rule)
      const bids = await lot.getBids();
      if (bids.length > 0) {
        throw new Error('Cannot delete lot with existing bids');
      }

      await lot.delete();
      console.log(`✅ Lot deleted successfully: ${lot.title}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete lot: ${error.message}`);
      throw error;
    }
  }

  /**
   * BUSINESS OPERATION - Place bid (transactional)
   * Demonstrates transaction commit on success, rollback on failure
   */
  static async placeBid(lotId, bidData) {
    console.log(`💰 Placing bid on lot: ${lotId}`);
    
    try {
      const bid = await AuctionService.placeBid(lotId, bidData);
      console.log(`✅ Bid placed successfully: ${bid.amount}`);
      return bid;
    } catch (error) {
      console.error(`❌ Failed to place bid: ${error.message}`);
      throw error;
    }
  }

  /**
   * BUSINESS OPERATION - Complete auction (transactional)
   */
  static async completeAuction(lotId) {
    console.log(`🏁 Completing auction: ${lotId}`);
    
    try {
      const result = await AuctionService.completeAuction(lotId);
      console.log(`✅ Auction completed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to complete auction: ${error.message}`);
      throw error;
    }
  }

  /**
   * BUSINESS OPERATION - Cancel auction (transactional)
   */
  static async cancelAuction(lotId, reason) {
    console.log(`❌ Cancelling auction: ${lotId}`);
    
    try {
      const result = await AuctionService.cancelAuction(lotId, reason);
      console.log(`✅ Auction cancelled successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to cancel auction: ${error.message}`);
      throw error;
    }
  }

  /**
   * SEARCH - Find lots by keywords
   */
  static async searchByKeywords(searchTerm) {
    console.log(`🔍 Searching lots with keywords: ${searchTerm}`);
    
    try {
      const lots = await Lot.searchByKeywords(searchTerm);
      console.log(`✅ Found ${lots.length} lots matching search`);
      return lots;
    } catch (error) {
      console.error(`❌ Failed to search lots: ${error.message}`);
      throw error;
    }
  }

  /**
   * FILTER - Find active lots
   */
  static async findActive() {
    console.log('📋 Finding active lots');
    
    try {
      const lots = await Lot.findActive();
      console.log(`✅ Found ${lots.length} active lots`);
      return lots;
    } catch (error) {
      console.error(`❌ Failed to find active lots: ${error.message}`);
      throw error;
    }
  }

  /**
   * FILTER - Find lots by owner
   */
  static async findByOwner(ownerId) {
    console.log(`👤 Finding lots for owner: ${ownerId}`);
    
    try {
      const lots = await Lot.findByOwner(ownerId);
      console.log(`✅ Found ${lots.length} lots for owner`);
      return lots;
    } catch (error) {
      console.error(`❌ Failed to find lots by owner: ${error.message}`);
      throw error;
    }
  }

  /**
   * RELATIONSHIP - Get lot with full bid history
   */
  static async getLotWithBidHistory(lotId) {
    console.log(`📜 Getting lot with bid history: ${lotId}`);
    
    try {
      const lot = await this.findById(lotId);
      if (!lot) {
        return null;
      }

      // Get detailed bid history
      const bidHistory = await Bid.getBidHistory(lotId, 50);
      lot.bidHistory = bidHistory;

      // Get statistics
      lot.statistics = await lot.getStatistics();

      console.log(`✅ Retrieved lot with ${bidHistory.length} bid records`);
      return lot;
    } catch (error) {
      console.error(`❌ Failed to get lot with bid history: ${error.message}`);
      throw error;
    }
  }

  /**
   * AGGREGATE - Get lot statistics
   */
  static async getLotStatistics(lotId) {
    console.log(`📊 Getting statistics for lot: ${lotId}`);
    
    try {
      const lot = await Lot.findById(lotId);
      if (!lot) {
        throw new Error('Lot not found');
      }

      const statistics = await lot.getStatistics();
      console.log(`✅ Retrieved statistics for lot: ${lot.title}`);
      return statistics;
    } catch (error) {
      console.error(`❌ Failed to get lot statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * BATCH OPERATION - Create multiple lots (transactional)
   */
  static async batchCreate(lotsData) {
    console.log(`📦 Batch creating ${lotsData.length} lots`);
    
    try {
      const results = [];
      
      for (const lotData of lotsData) {
        const lot = await this.create(lotData);
        results.push(lot);
      }
      
      console.log(`✅ Successfully created ${results.length} lots`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to batch create lots: ${error.message}`);
      throw error;
    }
  }

  /**
   * BATCH OPERATION - Update multiple lots (transactional)
   */
  static async batchUpdate(lotUpdates) {
    console.log(`📦 Batch updating ${lotUpdates.length} lots`);
    
    try {
      const results = await AuctionService.batchUpdateLots(lotUpdates);
      console.log(`✅ Successfully updated ${results.length} lots`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to batch update lots: ${error.message}`);
      throw error;
    }
  }
}

module.exports = LotRepository;
