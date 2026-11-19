
const db = require("../config/db");

// 1. ADD A NEW VENDOR
const addVendor = async (req, res) => {
    try {
        const { Vendor_Name, Phone, Address, Email } = req.body;

        if (!Vendor_Name || !Phone) {
            return res.status(400).json({
                message: "Vendor name and phone are required"
            });
        }

        const sql = `
            INSERT INTO Vendors (Vendor_Name, Phone, Address, Email)
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            Vendor_Name,
            Phone,
            Address || null,
            Email || null
        ]);

        res.status(201).json({
            message: "Vendor added successfully",
            Vendor_ID: result.insertId
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Failed to add vendor"
        });
    }
};


// 2. GET ALL VENDORS
const getAllVendors = async (req, res) => {
    try {
        const [vendors] = await db.execute(
            "SELECT * FROM Vendors ORDER BY Vendor_ID DESC"
        );

        res.status(200).json({
            count: vendors.length,
            vendors: vendors
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Failed to retrieve vendors"
        });
    }
};


// 3. GET ONE VENDOR
const getVendorById = async (req, res) => {
    try {
        const { id } = req.params;

        const [vendors] = await db.execute(
            "SELECT * FROM Vendors WHERE Vendor_ID = ?",
            [id]
        );

        if (vendors.length === 0) {
            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        res.status(200).json(vendors[0]);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Failed to retrieve vendor"
        });
    }
};


// 4. UPDATE VENDOR
const updateVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const { Vendor_Name, Phone, Address, Email } = req.body;

        if (!Vendor_Name || !Phone) {
            return res.status(400).json({
                message: "Vendor name and phone are required"
            });
        }

        const sql = `
            UPDATE Vendors
            SET Vendor_Name = ?, Phone = ?, Address = ?, Email = ?
            WHERE Vendor_ID = ?
        `;

        const [result] = await db.execute(sql, [
            Vendor_Name,
            Phone,
            Address || null,
            Email || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        res.status(200).json({
            message: "Vendor updated successfully"
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Failed to update vendor"
        });
    }
};


// 5. DELETE VENDOR
const deleteVendor = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            "DELETE FROM Vendors WHERE Vendor_ID = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        res.status(200).json({
            message: "Vendor deleted successfully"
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Could not delete vendor. This vendor may have existing sales."
        });
    }
};


// EXPORT FUNCTIONS
module.exports = {
    addVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    deleteVendor
};

