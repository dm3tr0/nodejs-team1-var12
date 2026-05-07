/**
 * src/models/AuctionService.js
 * Business operations with transactional support
 * Demonstrates commit on success and rollback on failure
 */

const TransactionManager = require('./TransactionManager');
const Lot = require('./Lot');
const Bid = require('./Bid');
const User = require('./User');
const { getPool } = require('../db/pool');

class AuctionService {
  /**
   * Place a bid on a lot (business operation with transaction)
   * This demonstrates:
   * - Transaction management
   * - Business rule validation
   * - Atomic operations (UPDATE lot + INSERT bid)
   * - Commit on success, rollback on failure
   */
  static async placeBid(lotId, bidData) {
    return await TransactionManager.execute(async (transaction) => {
      console.log(`🔄 Starting bid placement for lot ${lotId}`);

      // 1. Get and lock the lot for update
      const lotResult = await transaction.query(
        'SELECT * FROM Lots WHERE id = ? FOR UPDATE',
        [lotId]
      );

      if (!lotResult[0].length) {
        throw new Error('Lot not found');
      }

      const lot = Lot.fromRow(lotResult[0][0]);

      // 2. Business validations
      if (lot.status !== 'active') {
        throw new Error('Bidding is not active for this lot');
      }

      if (lot.ownerId === bidData.bidderId) {
        throw new Error('Owner cannot bid on their own lot');
      }

      const bidAmount = Number(bidData.amount);
      if (!Number.isInteger(bidAmount) || bidAmount <= lot.currentPrice) {
        throw new Error(`Bid must be greater than current price (${lot.currentPrice})`);
      }

      // 3. Get bidder information
      const bidder = await User.findById(bidData.bidderId);
      if (!bidder) {
        throw new Error('Bidder not found');
      }

      // 4. Update lot's current price
      lot.currentPrice = bidAmount;
      await transaction.updateModel(lot);

      // 5. Create the bid record
      const bid = new Bid({
        lotId: lot.id,
        bidderId: bidData.bidderId,
        bidderName: bidder.name,
        amount: bidAmount,
        createdAt: new Date()
      });

      await transaction.saveModel(bid);

      console.log(`✅ Successfully placed bid ${bidAmount} on lot ${lotId}`);
      return bid;
    });
  }

  /**
   * Create a new lot with initial data (transactional)
   */
  static async createLot(lotData, ownerData) {
    return await TransactionManager.execute(async (transaction) => {
      console.log(`🔄 Creating new lot: ${lotData.title}`);

      // 1. Ensure user exists or create new user
      let owner = await User.findById(ownerData.id);
      if (!owner) {
        owner = new User(ownerData);
        await transaction.saveModel(owner);
        console.log(`✅ Created new owner: ${owner.name}`);
      }

      // 2. Create the lot
      const lot = new Lot({
        ...lotData,
        ownerId: owner.id,
        ownerName: owner.name,
        currentPrice: lotData.startPrice,
        status: 'active'
      });

      await transaction.saveModel(lot);
      console.log(`✅ Created lot: ${lot.title}`);

      return lot;
    });
  }

  /**
   * Complete an auction and determine winner (transactional)
   */
  static async completeAuction(lotId) {
    return await TransactionManager.execute(async (transaction) => {
      console.log(`🔄 Completing auction for lot ${lotId}`);

      // 1. Get the lot
      const lot = await Lot.findById(lotId);
      if (!lot) {
        throw new Error('Lot not found');
      }

      if (lot.status !== 'active') {
        throw new Error('Auction is not active');
      }

      // 2. Get highest bid
      const highestBid = await Bid.getHighestBid(lotId);
      
      // 3. Update lot status
      lot.status = 'completed';
      await transaction.updateModel(lot);

      // 4. Create winner notification (simulated)
      if (highestBid) {
        console.log(`🏆 Auction won by ${highestBid.bidderName} with bid ${highestBid.amount}`);
        
        // In a real system, you might create a notification record
        const notificationData = {
          type: 'auction_won',
          userId: highestBid.bidderId,
          lotId: lot.id,
          amount: highestBid.amount,
          message: `Congratulations! You won the auction for "${lot.title}" with a bid of ${highestBid.amount}`
        };
        
        console.log('📧 Winner notification created:', notificationData);
      } else {
        console.log(`📝 Auction completed with no bids for lot ${lot.title}`);
      }

      return { lot, winner: highestBid };
    });
  }

  /**
   * Cancel an auction and refund bids (transactional)
   */
  static async cancelAuction(lotId, reason) {
    return await TransactionManager.execute(async (transaction) => {
      console.log(`🔄 Cancelling auction for lot ${lotId}`);

      // 1. Get the lot
      const lot = await Lot.findById(lotId);
      if (!lot) {
        throw new Error('Lot not found');
      }

      if (lot.status !== 'active') {
        throw new Error('Auction is not active');
      }

      // 2. Get all bids for refund processing
      const bids = await Bid.findByLot(lotId);
      
      // 3. Update lot status
      lot.status = 'cancelled';
      await transaction.updateModel(lot);

      // 4. Process refunds (simulated)
      for (const bid of bids) {
        console.log(`💰 Processing refund for ${bid.bidderName}: ${bid.amount}`);
        
        // In a real system, you would:
        // - Create refund records
        // - Update payment systems
        // - Send notifications
        
        const refundData = {
          bidId: bid.id,
          userId: bid.bidderId,
          amount: bid.amount,
          reason: reason || 'Auction cancelled',
          processedAt: new Date()
        };
        
        console.log('💳 Refund processed:', refundData);
      }

      return { lot, refundedBids: bids.length };
    });
  }

  /**
   * Transfer lot ownership (transactional)
   */
  static async transferLot(lotId, newOwnerId) {
    return await TransactionManager.execute(async (transaction) => {
      console.log(`🔄 Transferring lot ${lotId} to new owner ${newOwnerId}`);

      // 1. Get the lot
      const lot = await Lot.findById(lotId);
      if (!lot) {
        throw new Error('Lot not found');
      }

      // 2. Get new owner
      const newOwner = await User.findById(newOwnerId);
      if (!newOwner) {
        throw new Error('New owner not found');
      }

      // 3. Update lot ownership
      const oldOwnerId = lot.ownerId;
      lot.ownerId = newOwner.id;
      lot.ownerName = newOwner.name;
      
      await transaction.updateModel(lot);

      // 4. Create transfer record (simulated)
      const transferData = {
        lotId: lot.id,
        fromOwnerId: oldOwnerId,
        toOwnerId: newOwner.id,
        transferredAt: new Date()
      };
      
      console.log('📋 Ownership transferred:', transferData);

      return { lot, oldOwnerId, newOwner };
    });
  }

  /**
   * Batch update multiple lots (transactional)
   */
  static async batchUpdateLots(lotUpdates) {
    return await TransactionManager.execute(async (transaction) => {
      console.log(`🔄 Batch updating ${lotUpdates.length} lots`);

      const results = [];
      
      for (const update of lotUpdates) {
        const lot = await Lot.findById(update.id);
        if (!lot) {
          throw new Error(`Lot ${update.id} not found`);
        }

        // Update only allowed fields
        const allowedFields = ['status', 'currentPrice', 'description'];
        for (const field of allowedFields) {
          if (update[field] !== undefined) {
            lot[field] = update[field];
          }
        }

        await transaction.updateModel(lot);
        results.push(lot);
        console.log(`✅ Updated lot ${lot.id}: ${lot.title}`);
      }

      return results;
    });
  }

  /**
   * Get auction statistics (read-only, no transaction needed)
   */
  static async getAuctionStatistics() {
    const pool = await getPool();
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as totalLots,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeLots,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedLots,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledLots,
        AVG(start_price) as avgStartPrice,
        AVG(current_price) as avgCurrentPrice
      FROM Lots
    `);

    const bidStats = await pool.query(`
      SELECT 
        COUNT(*) as totalBids,
        COUNT(DISTINCT lot_id) as lotsWithBids,
        COUNT(DISTINCT bidder_id) as uniqueBidders,
        AVG(amount) as avgBidAmount,
        MAX(amount) as highestBid
      FROM Bids
    `);

    return {
      lots: stats[0][0],
      bids: bidStats[0][0]
    };
  }
}

module.exports = AuctionService;
