
const express = require("express");

const router = express.Router();

// Import sales controller functions
const {
    addSale,
    getAllSales,
    getSaleById
} = require("../controllers/salesController");

// Record a new sale
router.post("/", addSale);

// View all sales
router.get("/", getAllSales);

// View one sale with its items
router.get("/:id", getSaleById);

module.exports = router;
