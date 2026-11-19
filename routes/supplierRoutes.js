
const express = require("express");

const router = express.Router();

// Import supplier controller functions
const {
    addSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} = require("../controllers/supplierController");

// Add a supplier
router.post("/", addSupplier);

// View all suppliers
router.get("/", getAllSuppliers);

// View one supplier
router.get("/:id", getSupplierById);

// Update a supplier
router.put("/:id", updateSupplier);

// Delete a supplier
router.delete("/:id", deleteSupplier);

module.exports = router;
