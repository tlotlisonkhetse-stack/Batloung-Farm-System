
const express = require("express");

const router = express.Router();

// Import payment controller functions
const {
    addPayment,
    getAllPayments,
    getPaymentsBySale,
    getOutstandingBalances
} = require("../controllers/paymentController");

// Record a new payment
router.post("/", addPayment);

// View all payments
router.get("/", getAllPayments);

// View outstanding vendor balances
router.get("/outstanding", getOutstandingBalances);

// View payments for one sale
router.get("/sale/:id", getPaymentsBySale);

module.exports = router;
