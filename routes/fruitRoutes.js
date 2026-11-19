
const express = require("express");

const router = express.Router();

// Import fruit controller functions
const {
    addFruit,
    getAllFruits,
    getFruitById,
    updateFruit,
    deleteFruit
} = require("../controllers/fruitController");

// Add a fruit
router.post("/", addFruit);

// View all fruits
router.get("/", getAllFruits);

// View one fruit
router.get("/:id", getFruitById);

// Update a fruit
router.put("/:id", updateFruit);

// Delete a fruit
router.delete("/:id", deleteFruit);

module.exports = router;
