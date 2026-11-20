
const db = require("../config/db");

// 1. GET ALL STOCK
const getAllStock = async (req, res) => {
    try {
        const [stock] = await db.execute(`
            SELECT
                stock.Stock_ID,
                fruits.Fruit_Name,
                stock.Package_Size,
                stock.Quantity_Available,
                stock.Last_Updated
            FROM stock
            JOIN fruits
            ON stock.Fruit_ID = fruits.Fruit_ID
            ORDER BY fruits.Fruit_Name, stock.Package_Size
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
                stock.Stock_ID,
                fruits.Fruit_Name,
                stock.Package_Size,
                stock.Quantity_Available,
                stock.Last_Updated
            FROM stock
            JOIN fruits
            ON stock.Fruit_ID = fruits.Fruit_ID
            WHERE stock.Fruit_ID = ?
            ORDER BY stock.Package_Size
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
                stock.Stock_ID,
                fruits.Fruit_Name,
                stock.Package_Size,
                stock.Quantity_Available,
                stock.Last_Updated
            FROM stock
            JOIN fruits
            ON stock.Fruit_ID = fruits.Fruit_ID
            WHERE stock.Quantity_Available <= ?
            ORDER BY stock.Quantity_Available ASC
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
