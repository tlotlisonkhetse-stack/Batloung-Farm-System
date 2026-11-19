
const express = require("express");

const router = express.Router();

// Import vendor controller functions
const {
    addVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    deleteVendor
} = require("../controllers/vendorController");

// Add a vendor
router.post("/", addVendor);

// View all vendors
router.get("/", getAllVendors);

// View one vendor
router.get("/:id", getVendorById);

// Update a vendor
router.put("/:id", updateVendor);

// Delete a vendor
router.delete("/:id", deleteVendor);

module.exports = router;
