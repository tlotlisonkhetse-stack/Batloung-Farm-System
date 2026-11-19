
const express = require("express");

const router = express.Router();

// Import report controller functions
const {
    getSalesReport,
    getPurchaseReport,
    getStockReport,
    getProfitReport,
    getVendorDebtReport
} = require("../controllers/reportController");

// View sales report
router.get("/sales", getSalesReport);

// View purchase report
router.get("/purchases", getPurchaseReport);

// View stock report
router.get("/stock", getStockReport);

// View profit summary
router.get("/profit", getProfitReport);

// View vendor debt report
router.get("/vendor-debts", getVendorDebtReport);

module.exports = router;
