/**
 * src/controllers/ormController.js
 * Controller demonstrating ORM functionality
 */

const AuctionORMService = require('../services/orm/AuctionORMService');

class ORMController {
  /**
   * Demonstrate all ORM functionality
   */
  static async demonstrate(req, res) {
    try {
      console.log('🚀 Starting ORM demonstration...');
      
      const results = await AuctionORMService.demonstrateAll();
      
      res.json({
        success: true,
        message: 'ORM demonstration completed',
        results: results
      });
    } catch (error) {
      console.error('❌ ORM demonstration failed:', error);
      res.status(500).json({
        success: false,
        message: 'ORM demonstration failed',
        error: error.message
      });
    }
  }

  /**
   * Demonstrate CRUD operations only
   */
  static async demonstrateCRUD(req, res) {
    try {
      console.log('🔧 Starting CRUD demonstration...');
      
      const results = {
        userCRUD: await AuctionORMService.demonstrateUserCRUD(),
        lotCRUD: await AuctionORMService.demonstrateLotCRUD(),
        bidCRUD: await AuctionORMService.demonstrateBidCRUD()
      };
      
      res.json({
        success: true,
        message: 'CRUD operations demonstrated',
        results: results
      });
    } catch (error) {
      console.error('❌ CRUD demonstration failed:', error);
      res.status(500).json({
        success: false,
        message: 'CRUD demonstration failed',
        error: error.message
      });
    }
  }

  /**
   * Demonstrate transactional operations
   */
  static async demonstrateTransactions(req, res) {
    try {
      console.log('🔄 Starting transaction demonstration...');
      
      const results = await AuctionORMService.demonstrateTransactionalOperations();
      
      res.json({
        success: true,
        message: 'Transactional operations demonstrated',
        results: results
      });
    } catch (error) {
      console.error('❌ Transaction demonstration failed:', error);
      res.status(500).json({
        success: false,
        message: 'Transaction demonstration failed',
        error: error.message
      });
    }
  }

  /**
   * Demonstrate business operations
   */
  static async demonstrateBusiness(req, res) {
    try {
      console.log('💼 Starting business operations demonstration...');
      
      const results = await AuctionORMService.demonstrateBusinessOperations();
      
      res.json({
        success: true,
        message: 'Business operations demonstrated',
        results: results
      });
    } catch (error) {
      console.error('❌ Business operations demonstration failed:', error);
      res.status(500).json({
        success: false,
        message: 'Business operations demonstration failed',
        error: error.message
      });
    }
  }

  /**
   * Demonstrate entity relationships
   */
  static async demonstrateRelationships(req, res) {
    try {
      console.log('🔗 Starting relationships demonstration...');
      
      const results = await AuctionORMService.demonstrateRelationships();
      
      res.json({
        success: true,
        message: 'Entity relationships demonstrated',
        results: results
      });
    } catch (error) {
      console.error('❌ Relationships demonstration failed:', error);
      res.status(500).json({
        success: false,
        message: 'Relationships demonstration failed',
        error: error.message
      });
    }
  }
}

module.exports = ORMController;
