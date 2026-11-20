
const db = require("../config/db");

// 1. ADD A NEW SUPPLIER
const addSupplier = async (req, res) => {
    try {
        const { Supplier_Name, Phone, Address } = req.body;

        if (!Supplier_Name || !Phone) {
            return res.status(400).json({
                message: "Supplier name and phone are required"
            });
        }

        const sql = `
            INSERT INTO suppliers (Supplier_Name, Phone, Address)
            VALUES (?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            Supplier_Name,
            Phone,
            Address || null
        ]);

        res.status(201).json({
            message: "Supplier added successfully",
            Supplier_ID: result.insertId
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to add supplier"
        });
    }
};


// 2. GET ALL SUPPLIERS
const getAllSuppliers = async (req, res) => {
    try {
        const [suppliers] = await db.execute(
            "SELECT * FROM suppliers ORDER BY Supplier_ID DESC"
        );

        res.status(200).json({
            count: suppliers.length,
            suppliers: suppliers
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve suppliers"
        });
    }
};


// 3. GET ONE SUPPLIER
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;

        const [suppliers] = await db.execute(
            "SELECT * FROM suppliers WHERE Supplier_ID = ?",
            [id]
        );

        if (suppliers.length === 0) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }

        res.status(200).json(suppliers[0]);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve supplier"
        });
    }
};


// 4. UPDATE SUPPLIER
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { Supplier_Name, Phone, Address } = req.body;

        if (!Supplier_Name || !Phone) {
            return res.status(400).json({
                message: "Supplier name and phone are required"
            });
        }

        const sql = `
            UPDATE suppliers
            SET Supplier_Name = ?, Phone = ?, Address = ?
            WHERE Supplier_ID = ?
        `;

        const [result] = await db.execute(sql, [
            Supplier_Name,
            Phone,
            Address || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }

        res.status(200).json({
            message: "Supplier updated successfully"
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to update supplier"
        });
    }
};


// 5. DELETE SUPPLIER
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            "DELETE FROM suppliers WHERE Supplier_ID = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }

        res.status(200).json({
            message: "Supplier deleted successfully"
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Could not delete supplier. This supplier may have existing purchases."
        });
    }
};


// EXPORT ALL FUNCTIONS
module.exports = {
    addSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
