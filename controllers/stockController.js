
const db = require("../config/db");

// 1. GET ALL STOCK
const getAllStock = async (req, res) => {
    try {
        const [stock] = await db.execute(`
            SELECT
                Stock.Stock_ID,
                Fruits.Fruit_Name,
                Stock.Package_Size,
                Stock.Quantity_Available,
                Stock.Last_Updated
            FROM Stock
            JOIN Fruits
            ON Stock.Fruit_ID = Fruits.Fruit_ID
            ORDER BY Fruits.Fruit_Name, Stock.Package_Size
        `);

        res.status(200).json({
            count: stock.length,
            stock: stock
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve stock"
        });
    }
};


// 2. GET STOCK FOR ONE FRUIT
const getStockByFruit = async (req, res) => {
    try {
        const { id } = req.params;

        const [stock] = await db.execute(`
            SELECT
                Stock.Stock_ID,
                Fruits.Fruit_Name,
                Stock.Package_Size,
                Stock.Quantity_Available,
                Stock.Last_Updated
            FROM Stock
            JOIN Fruits
            ON Stock.Fruit_ID = Fruits.Fruit_ID
            WHERE Stock.Fruit_ID = ?
            ORDER BY Stock.Package_Size
        `, [id]);

        res.status(200).json({
            count: stock.length,
            stock: stock
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve fruit stock"
        });
    }
};


// 3. GET LOW STOCK ITEMS
const getLowStock = async (req, res) => {
    try {
        const threshold = Number(req.query.threshold) || 10;

        if (!Number.isInteger(threshold) || threshold < 0) {
            return res.status(400).json({
                message: "Stock threshold must be a non-negative whole number"
            });
        }

        const [stock] = await db.execute(`
            SELECT
                Stock.Stock_ID,
                Fruits.Fruit_Name,
                Stock.Package_Size,
                Stock.Quantity_Available,
                Stock.Last_Updated
            FROM Stock
            JOIN Fruits
            ON Stock.Fruit_ID = Fruits.Fruit_ID
            WHERE Stock.Quantity_Available <= ?
            ORDER BY Stock.Quantity_Available ASC
        `, [threshold]);

        res.status(200).json({
            threshold: threshold,
            count: stock.length,
            lowStock: stock
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve low stock items"
        });
    }
};


// EXPORT FUNCTIONS
module.exports = {
    getAllStock,
    getStockByFruit,
    getLowStock
};
