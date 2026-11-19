const express = require("express");
const router = express.Router();

const {
    getPackagingData,
    createPackaging,
    getPackagingHistory
} = require("../controllers/packagingController");

// Get fruits, raw stock and packaging capacities
router.get("/", getPackagingData);

// Create a packaging record
router.post("/", createPackaging);

// Get packaging history
router.get("/history", getPackagingHistory);

module.exports = router;