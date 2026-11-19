
const express = require("express");

const router = express.Router();

// Import price controller functions
const {
    addPrice,
    getAllPrices,
    getPriceById,
    updatePrice,
    updatePriceStatus
} = require("../controllers/priceController");

// Add a new packaging price
router.post("/", addPrice);

// View all packaging prices
router.get("/", getAllPrices);

// Activate or deactivate a price
router.patch("/:id/status", updatePriceStatus);

// View one packaging price
router.get("/:id", getPriceById);

// Update a packaging price
router.put("/:id", updatePrice);

module.exports = router;
