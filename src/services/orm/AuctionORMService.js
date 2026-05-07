/**
 * src/services/orm/AuctionORMService.js
 * ORM-based service demonstrating all required functionality:
 * - CRUD operations for all entities
 * - Transactional operations with commit/rollback
 * - Business operations with proper error handling
 * - Entity relationships (one-to-many, many-to-many)
 */

const LotRepository = require('../../repositories/orm/LotRepository');
const UserRepository = require('../../repositories/orm/UserRepository');
const BidRepository = require('../../repositories/orm/BidRepository');
const AuctionService = require('../../models/AuctionService');

class AuctionORMService {
  /**
   * DEMONSTRATE CRUD OPERATIONS FOR ALL ENTITIES
   */

  // === USER CRUD OPERATIONS ===
  static async demonstrateUserCRUD() {
    console.log('\n🔧 DEMONSTRATING USER CRUD OPERATIONS');
    
    try {
      // CREATE
      console.log('\n📝 CREATE User');
      const newUser = await UserRepository.create({
        id: 'user_' + Date.now(),
        name: 'John Doe',
        email: 'john.doe@example.com'
      });
      console.log('✅ User created:', newUser);

      // READ
      console.log('\n📖 READ User');
      const foundUser = await UserRepository.findById(newUser.id);
      console.log('✅ User found:', foundUser);

      // UPDATE
      console.log('\n✏️ UPDATE User');
      const updatedUser = await UserRepository.update(newUser.id, {
        name: 'John Smith'
      });
      console.log('✅ User updated:', updatedUser);

      // DELETE
      console.log('\n🗑️ DELETE User');
      await UserRepository.delete(newUser.id);
      console.log('✅ User deleted successfully');

      return { success: true, message: 'User CRUD operations completed' };
    } catch (error) {
      console.error('❌ User CRUD failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // === LOT CRUD OPERATIONS ===
  static async demonstrateLotCRUD() {
    console.log('\n🔧 DEMONSTRATING LOT CRUD OPERATIONS');
    
    try {
      // First create a user for the lot
      const user = await UserRepository.create({
        id: 'user_' + Date.now(),
        name: 'Alice Johnson',
        email: 'alice@example.com'
      });

      // CREATE
      console.log('\n📝 CREATE Lot');
      const newLot = await LotRepository.create({
        id: 'lot_' + Date.now(),
        title: 'Vintage Watch',
        description: 'A beautiful vintage watch from 1950',
        startPrice: 1000,
        currentPrice: 1000,
        ownerId: user.id,
        ownerName: user.name,
        keywords: ['vintage', 'watch', 'collectible']
      });
      console.log('✅ Lot created:', newLot);

      // READ
      console.log('\n📖 READ Lot');
      const foundLot = await LotRepository.findById(newLot.id);
      console.log('✅ Lot found:', foundLot);

      // UPDATE
      console.log('\n✏️ UPDATE Lot');
      const updatedLot = await LotRepository.update(newLot.id, {
        description: 'A beautiful vintage watch from 1950 - excellent condition',
        currentPrice: 1200
      });
      console.log('✅ Lot updated:', updatedLot);

      // DELETE (only if no bids exist)
      console.log('\n🗑️ DELETE Lot');
      await LotRepository.delete(newLot.id);
      console.log('✅ Lot deleted successfully');

      // Clean up user
      await UserRepository.delete(user.id);

      return { success: true, message: 'Lot CRUD operations completed' };
    } catch (error) {
      console.error('❌ Lot CRUD failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // === BID CRUD OPERATIONS ===
  static async demonstrateBidCRUD() {
    console.log('\n🔧 DEMONSTRATING BID CRUD OPERATIONS');
    
    try {
      // Setup: Create user and lot
      const user = await UserRepository.create({
        id: 'user_' + Date.now(),
        name: 'Bob Wilson',
        email: 'bob@example.com'
      });

      const lot = await LotRepository.create({
        id: 'lot_' + Date.now(),
        title: 'Rare Book',
        description: 'First edition rare book',
        startPrice: 500,
        currentPrice: 500,
        ownerId: user.id,
        ownerName: user.name
      });

      // CREATE
      console.log('\n📝 CREATE Bid');
      const newBid = await BidRepository.create({
        lotId: lot.id,
        bidderId: user.id,
        bidderName: user.name,
        amount: 600
      });
      console.log('✅ Bid created:', newBid);

      // READ
      console.log('\n📖 READ Bids');
      const foundBids = await BidRepository.findByLot(lot.id);
      console.log('✅ Bids found:', foundBids);

      // UPDATE
      console.log('\n✏️ UPDATE Bid');
      const updatedBid = await BidRepository.update(lot.id, user.id, {
        amount: 700
      });
      console.log('✅ Bid updated:', updatedBid);

      // DELETE
      console.log('\n🗑️ DELETE Bid');
      await BidRepository.delete(lot.id, user.id);
      console.log('✅ Bid deleted successfully');

      // Clean up
      await LotRepository.delete(lot.id);
      await UserRepository.delete(user.id);

      return { success: true, message: 'Bid CRUD operations completed' };
    } catch (error) {
      console.error('❌ Bid CRUD failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * DEMONSTRATE TRANSACTIONAL OPERATIONS
   */
  static async demonstrateTransactionalOperations() {
    console.log('\n🔄 DEMONSTRATING TRANSACTIONAL OPERATIONS');
    
    try {
      // Setup
      const owner = await UserRepository.create({
        id: 'owner_' + Date.now(),
        name: 'Seller User',
        email: 'seller@example.com'
      });

      const bidder = await UserRepository.create({
        id: 'bidder_' + Date.now(),
        name: 'Buyer User',
        email: 'buyer@example.com'
      });

      const lot = await LotRepository.create({
        id: 'lot_tx_' + Date.now(),
        title: 'Transaction Test Item',
        description: 'Item for testing transactions',
        startPrice: 100,
        currentPrice: 100,
        ownerId: owner.id,
        ownerName: owner.name
      });

      // SUCCESSFUL TRANSACTION
      console.log('\n✅ SUCCESSFUL TRANSACTION');
      try {
        const successfulBid = await LotRepository.placeBid(lot.id, {
          bidderId: bidder.id,
          bidderName: bidder.name,
          amount: 150
        });
        console.log('✅ Transaction committed - Bid placed:', successfulBid);
      } catch (error) {
        console.error('❌ Transaction failed:', error.message);
      }

      // FAILED TRANSACTION (should rollback)
      console.log('\n❌ FAILED TRANSACTION (DEMONSTRATING ROLLBACK)');
      try {
        await LotRepository.placeBid(lot.id, {
          bidderId: owner.id, // Owner cannot bid - should fail
          bidderName: owner.name,
          amount: 200
        });
        console.log('❌ This should not execute - transaction should fail');
      } catch (error) {
        console.log('✅ Transaction rolled back as expected:', error.message);
      }

      // Verify rollback worked
      const currentLot = await LotRepository.findById(lot.id);
      console.log('🔍 Current lot price after transactions:', currentLot.currentPrice);

      // Clean up
      await LotRepository.delete(lot.id);
      await UserRepository.delete(owner.id);
      await UserRepository.delete(bidder.id);

      return { success: true, message: 'Transactional operations completed' };
    } catch (error) {
      console.error('❌ Transactional operations failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * DEMONSTRATE BUSINESS OPERATIONS
   */
  static async demonstrateBusinessOperations() {
    console.log('\n💼 DEMONSTRATING BUSINESS OPERATIONS');
    
    try {
      // Setup
      const owner = await UserRepository.create({
        id: 'business_owner_' + Date.now(),
        name: 'Business Owner',
        email: 'owner@business.com'
      });

      const bidder1 = await UserRepository.create({
        id: 'business_bidder1_' + Date.now(),
        name: 'Business Bidder 1',
        email: 'bidder1@business.com'
      });

      const bidder2 = await UserRepository.create({
        id: 'business_bidder2_' + Date.now(),
        name: 'Business Bidder 2',
        email: 'bidder2@business.com'
      });

      const lot = await LotRepository.create({
        id: 'business_lot_' + Date.now(),
        title: 'Business Auction Item',
        description: 'High-value business item',
        startPrice: 1000,
        currentPrice: 1000,
        ownerId: owner.id,
        ownerName: owner.name
      });

      // AUCTION WITH MULTIPLE BIDS
      console.log('\n🏷️ AUCTION WITH MULTIPLE BIDS');
      const bid1 = await LotRepository.placeBid(lot.id, {
        bidderId: bidder1.id,
        bidderName: bidder1.name,
        amount: 1200
      });

      const bid2 = await LotRepository.placeBid(lot.id, {
        bidderId: bidder2.id,
        bidderName: bidder2.name,
        amount: 1500
      });

      const bid3 = await LotRepository.placeBid(lot.id, {
        bidderId: bidder1.id,
        bidderName: bidder1.name,
        amount: 1800
      });

      console.log('✅ Bids placed:', { bid1: bid1.amount, bid2: bid2.amount, bid3: bid3.amount });

      // COMPLETE AUCTION
      console.log('\n🏁 COMPLETING AUCTION');
      const auctionResult = await LotRepository.completeAuction(lot.id);
      console.log('✅ Auction completed:', auctionResult);

      // CANCEL AUCTION (create new lot for demo)
      const cancelLot = await LotRepository.create({
        id: 'cancel_lot_' + Date.now(),
        title: 'Cancellation Test Item',
        description: 'Item to test cancellation',
        startPrice: 500,
        currentPrice: 500,
        ownerId: owner.id,
        ownerName: owner.name
      });

      // Place a bid first
      await LotRepository.placeBid(cancelLot.id, {
        bidderId: bidder1.id,
        bidderName: bidder1.name,
        amount: 600
      });

      console.log('\n❌ CANCELLING AUCTION');
      const cancelResult = await LotRepository.cancelAuction(cancelLot.id, 'Seller decided to cancel');
      console.log('✅ Auction cancelled:', cancelResult);

      // Clean up
      await LotRepository.delete(lot.id);
      await LotRepository.delete(cancelLot.id);
      await UserRepository.delete(owner.id);
      await UserRepository.delete(bidder1.id);
      await UserRepository.delete(bidder2.id);

      return { success: true, message: 'Business operations completed' };
    } catch (error) {
      console.error('❌ Business operations failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * DEMONSTRATE ENTITY RELATIONSHIPS
   */
  static async demonstrateRelationships() {
    console.log('\n🔗 DEMONSTRATING ENTITY RELATIONSHIPS');
    
    try {
      // Create users
      const user1 = await UserRepository.create({
        id: 'rel_user1_' + Date.now(),
        name: 'Relationship User 1',
        email: 'rel1@example.com'
      });

      const user2 = await UserRepository.create({
        id: 'rel_user2_' + Date.now(),
        name: 'Relationship User 2',
        email: 'rel2@example.com'
      });

      // Create lots (one-to-many: user -> lots)
      const lot1 = await LotRepository.create({
        id: 'rel_lot1_' + Date.now(),
        title: 'User 1 Lot 1',
        description: 'First lot from user 1',
        startPrice: 100,
        currentPrice: 100,
        ownerId: user1.id,
        ownerName: user1.name
      });

      const lot2 = await LotRepository.create({
        id: 'rel_lot2_' + Date.now(),
        title: 'User 1 Lot 2',
        description: 'Second lot from user 1',
        startPrice: 200,
        currentPrice: 200,
        ownerId: user1.id,
        ownerName: user1.name
      });

      // Place bids (many-to-many: users <-> lots through bids)
      const bid1 = await LotRepository.placeBid(lot1.id, {
        bidderId: user2.id,
        bidderName: user2.name,
        amount: 150
      });

      const bid2 = await LotRepository.placeBid(lot2.id, {
        bidderId: user2.id,
        bidderName: user2.name,
        amount: 250
      });

      // DEMONSTRATE RELATIONSHIPS
      console.log('\n👤 USER -> LOTS (One-to-Many)');
      const user1Lots = await UserRepository.getUserLotsWithBids(user1.id);
      console.log(`✅ User ${user1.name} has ${user1Lots.length} lots:`, user1Lots.map(l => l.title));

      console.log('\n💰 USER -> BIDS (One-to-Many)');
      const user2Bids = await UserRepository.getUserBidHistory(user2.id);
      console.log(`✅ User ${user2.name} has ${user2Bids.length} bids:`, user2Bids.map(b => `${b.amount} on ${b._lot.title}`));

      console.log('\n🏷️ LOT -> BIDS (One-to-Many)');
      const lot1Bids = await LotRepository.getLotWithBidHistory(lot1.id);
      console.log(`✅ Lot ${lot1.title} has ${lot1Bids.bidHistory.length} bids:`, lot1Bids.bidHistory.map(b => b.amount));

      console.log('\n👥 LOT -> OWNER (Many-to-One)');
      const lot1WithOwner = await LotRepository.findById(lot1.id);
      console.log(`✅ Lot ${lot1.title} is owned by:`, lot1WithOwner._owner.name);

      console.log('\n🎯 BID -> LOT & BIDDER (Many-to-One)');
      const bidWithRelations = await BidRepository.findByLotAndBidder(lot1.id, user2.id);
      if (bidWithRelations) {
        console.log(`✅ Bid ${bidWithRelations.amount} is on lot:`, bidWithRelations._lot.title);
        console.log(`✅ Bid ${bidWithRelations.amount} is by bidder:`, bidWithRelations._bidder.name);
      }

      // Clean up
      await LotRepository.delete(lot1.id);
      await LotRepository.delete(lot2.id);
      await UserRepository.delete(user1.id);
      await UserRepository.delete(user2.id);

      return { success: true, message: 'Relationships demonstrated successfully' };
    } catch (error) {
      console.error('❌ Relationship demonstration failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * COMPREHENSIVE DEMONSTRATION
   */
  static async demonstrateAll() {
    console.log('🎯 COMPREHENSIVE ORM DEMONSTRATION');
    console.log('=====================================');

    const results = {
      userCRUD: await this.demonstrateUserCRUD(),
      lotCRUD: await this.demonstrateLotCRUD(),
      bidCRUD: await this.demonstrateBidCRUD(),
      transactions: await this.demonstrateTransactionalOperations(),
      businessOps: await this.demonstrateBusinessOperations(),
      relationships: await this.demonstrateRelationships()
    };

    console.log('\n📊 DEMONSTRATION RESULTS');
    console.log('========================');
    Object.entries(results).forEach(([key, result]) => {
      console.log(`${key}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!result.success) {
        console.log(`  Error: ${result.error}`);
      }
    });

    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n🎯 OVERALL: ${successCount}/${totalCount} demonstrations successful`);
    
    return results;
  }
}

module.exports = AuctionORMService;
