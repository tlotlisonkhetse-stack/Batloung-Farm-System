
const db = require("../config/db");

// Allowed package sizes
const allowedSizes = ["SMALL", "MEDIUM", "LARGE"];

// 1. ADD A NEW PACKAGING PRICE
const addPrice = async (req, res) => {
    try {
        const { Fruit_ID, Package_Size, Selling_Price } = req.body;

        if (
            !Number.isInteger(Number(Fruit_ID)) ||
            Number(Fruit_ID) <= 0 ||
            !allowedSizes.includes(Package_Size) ||
            Selling_Price === undefined ||
            Selling_Price === null ||
            Selling_Price === "" ||
            !Number.isFinite(Number(Selling_Price)) ||
            Number(Selling_Price) <= 0
        ) {
            return res.status(400).json({
                message: "Provide a valid fruit ID, package size and selling price in Maloti"
            });
        }

        // Check whether the fruit exists
        const [fruits] = await db.execute(
            "SELECT Fruit_ID FROM Fruits WHERE Fruit_ID = ?",
            [Number(Fruit_ID)]
        );

        if (fruits.length === 0) {
            return res.status(404).json({
                message: "Fruit not found"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO Packaging_Prices
            (Fruit_ID, Package_Size, Selling_Price)
            VALUES (?, ?, ?)`,
            [Number(Fruit_ID), Package_Size, Number(Selling_Price)]
        );

        res.status(201).json({
            message: "Selling price added successfully",
            Price_ID: result.insertId,
            Currency: "LSL",
            Currency_Symbol: "M"
        });

    } catch (error) {
        console.error(error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "A price already exists for this fruit and package size. Update the existing price instead."
            });
        }

        res.status(500).json({
            message: "Failed to add selling price"
        });
    }
};


// 2. GET ALL PACKAGING PRICES
const getAllPrices = async (req, res) => {
    try {
        const [prices] = await db.execute(`
            SELECT
                Packaging_Prices.Price_ID,
                Fruits.Fruit_Name,
                Packaging_Prices.Fruit_ID,
                Packaging_Prices.Package_Size,
                Packaging_Prices.Selling_Price,
                Packaging_Prices.Is_Active
            FROM Packaging_Prices
            JOIN Fruits
            ON Packaging_Prices.Fruit_ID = Fruits.Fruit_ID
            ORDER BY Fruits.Fruit_Name, Packaging_Prices.Package_Size
        `);

        res.status(200).json({
            Currency: "Lesotho Loti (LSL)",
            count: prices.length,
            prices: prices
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve selling prices"
        });
    }
};


// 3. GET ONE PACKAGING PRICE
const getPriceById = async (req, res) => {
    try {
        const { id } = req.params;

        const [prices] = await db.execute(`
            SELECT
                Packaging_Prices.*,
                Fruits.Fruit_Name
            FROM Packaging_Prices
            JOIN Fruits
            ON Packaging_Prices.Fruit_ID = Fruits.Fruit_ID
            WHERE Packaging_Prices.Price_ID = ?
        `, [id]);

        if (prices.length === 0) {
            return res.status(404).json({
                message: "Selling price not found"
            });
        }

        res.status(200).json({
            Currency: "LSL",
            price: prices[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve selling price"
        });
    }
};


// 4. UPDATE A PACKAGING PRICE
const updatePrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { Selling_Price } = req.body;

        if (
            Selling_Price === undefined ||
            Selling_Price === null ||
            Selling_Price === "" ||
            !Number.isFinite(Number(Selling_Price)) ||
            Number(Selling_Price) <= 0
        ) {
            return res.status(400).json({
                message: "Enter a valid selling price in Maloti"
            });
        }

        const [result] = await db.execute(
            `UPDATE Packaging_Prices
             SET Selling_Price = ?
             WHERE Price_ID = ?`,
            [Number(Selling_Price), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Selling price not found"
            });
        }

        res.status(200).json({
            message: "Selling price updated successfully"
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to update selling price"
        });
    }
};


// 5. ACTIVATE OR DEACTIVATE A PRICE
const updatePriceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { Is_Active } = req.body;

        if (
            Is_Active !== true &&
            Is_Active !== false &&
            Is_Active !== 1 &&
            Is_Active !== 0
        ) {
            return res.status(400).json({
                message: "Is_Active must be true or false"
            });
        }

        const [result] = await db.execute(
            `UPDATE Packaging_Prices
             SET Is_Active = ?
             WHERE Price_ID = ?`,
            [Is_Active ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Selling price not found"
            });
        }

        res.status(200).json({
            message: Is_Active
                ? "Selling price activated successfully"
                : "Selling price deactivated successfully"
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to update price status"
        });
    }
};


// EXPORT FUNCTIONS
module.exports = {
    addPrice,
    getAllPrices,
    getPriceById,
    updatePrice,
    updatePriceStatus
};
