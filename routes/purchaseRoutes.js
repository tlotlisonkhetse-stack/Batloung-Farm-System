
const express = require("express");

const router = express.Router();

// Import purchase controller functions
const {
    addPurchase,
    getAllPurchases,
    getPurchaseById
} = require("../controllers/purchaseController");

// Record a new purchase
router.post("/", addPurchase);

// View all purchases
router.get("/", getAllPurchases);

// View one purchase with its items
router.get("/:id", getPurchaseById);

module.exports = router;
