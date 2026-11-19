
const express = require("express");

const router = express.Router();

// Import stock controller functions
const {
    getAllStock,
    getStockByFruit,
    getLowStock
} = require("../controllers/stockController");

// View all stock
router.get("/", getAllStock);

// View low stock items
router.get("/low-stock", getLowStock);

// View stock for one fruit
router.get("/fruit/:id", getStockByFruit);

module.exports = router;
