
const db = require("../config/db");

// 1. RECORD A NEW SALE
const addSale = async (req, res) => {
    const {
        Vendor_ID,
        Sale_Date,
        Payment_Method,
        Payment_Status,
        items
    } = req.body;

    // Validate required information
    if (
        !Number.isInteger(Number(Vendor_ID)) ||
        Number(Vendor_ID) <= 0 ||
        !Sale_Date ||
        !Payment_Method ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            message: "Vendor, sale date, payment method and sale items are required"
        });
    }

    const allowedMethods = ["CASH", "MOBILE_MONEY", "CREDIT"];
    const allowedStatuses = ["PAID", "PARTIALLY_PAID", "UNPAID"];
    const allowedSizes = ["SMALL", "MEDIUM", "LARGE"];

    const status = Payment_Status || "UNPAID";

    if (!allowedMethods.includes(Payment_Method)) {
        return res.status(400).json({
            message: "Invalid payment method"
        });
    }

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid payment status"
        });
    }

    // Validate sale items
    for (const item of items) {
        if (
            !Number.isInteger(Number(item.Fruit_ID)) ||
            Number(item.Fruit_ID) <= 0 ||
            !allowedSizes.includes(item.Package_Size) ||
            !Number.isInteger(item.Quantity) ||
            item.Quantity <= 0
        ) {
            return res.status(400).json({
                message: "Each item must have a valid fruit, package size and positive quantity"
            });
        }
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Check whether vendor exists
        const [vendors] = await connection.execute(
            "SELECT Vendor_ID FROM vendors WHERE Vendor_ID = ?",
            [Vendor_ID]
        );

        if (vendors.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        let totalAmount = 0;
        const saleItems = [];

        // Check prices and stock for every item
        for (const item of items) {

            // Get the active selling price
            const [prices] = await connection.execute(
                `SELECT Selling_Price
                 FROM packaging_prices
                 WHERE Fruit_ID = ?
                 AND Package_Size = ?
                 AND Is_Active = TRUE
                 FOR UPDATE`,
                [item.Fruit_ID, item.Package_Size]
            );

            if (prices.length === 0) {
                throw new Error(
                    `No active selling price found for fruit ID ${item.Fruit_ID} (${item.Package_Size})`
                );
            }

            const unitPrice = Number(prices[0].Selling_Price);

            // Check and lock available stock
            const [stocks] = await connection.execute(
                `SELECT Quantity_Available
                 FROM stock
                 WHERE Fruit_ID = ?
                 AND Package_Size = ?
                 FOR UPDATE`,
                [item.Fruit_ID, item.Package_Size]
            );

            if (stocks.length === 0) {
                throw new Error("Stock record not found for one of the selected fruits");
            }

            if (stocks[0].Quantity_Available < item.Quantity) {
                throw new Error(
                    `Insufficient stock for fruit ID ${item.Fruit_ID} (${item.Package_Size}). Available: ${stocks[0].Quantity_Available}`
                );
            }

            const subtotal = unitPrice * item.Quantity;

            totalAmount += subtotal;

            saleItems.push({
                Fruit_ID: item.Fruit_ID,
                Package_Size: item.Package_Size,
                Quantity: item.Quantity,
                Unit_Price: unitPrice,
                Subtotal: subtotal
            });
        }

        // Create sale record
        const [saleResult] = await connection.execute(
            `INSERT INTO sales
            (Vendor_ID, Sale_Date, Total_Amount, Payment_Method, Payment_Status)
            VALUES (?, ?, ?, ?, ?)`,
            [
                Vendor_ID,
                Sale_Date,
                totalAmount,
                Payment_Method,
                status
            ]
        );

        const saleId = saleResult.insertId;

        // Save sale details and deduct stock
        for (const item of saleItems) {

            await connection.execute(
                `INSERT INTO sales_details
                (Sale_ID, Fruit_ID, Package_Size, Quantity, Unit_Price, Subtotal)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    saleId,
                    item.Fruit_ID,
                    item.Package_Size,
                    item.Quantity,
                    item.Unit_Price,
                    item.Subtotal
                ]
            );

            await connection.execute(
                `UPDATE stock
                 SET Quantity_Available = Quantity_Available - ?
                 WHERE Fruit_ID = ?
                 AND Package_Size = ?`,
                [
                    item.Quantity,
                    item.Fruit_ID,
                    item.Package_Size
                ]
            );
        }

        // Save all changes
        await connection.commit();

        res.status(201).json({
            message: "Sale recorded and stock updated successfully",
            Sale_ID: saleId,
            Total_Amount: totalAmount,
            items: saleItems
        });

    } catch (error) {

        await connection.rollback();

        console.error(error.message);

        res.status(400).json({
            message: error.message || "Failed to record sale"
        });

    } finally {
        connection.release();
    }
};


// 2. GET ALL SALES
const getAllSales = async (req, res) => {
    try {
        const [sales] = await db.execute(`
            SELECT
                sales.*,
                vendors.Vendor_Name
            FROM sales
            JOIN vendors
            ON sales.Vendor_ID = vendors.Vendor_ID
            ORDER BY sales.Sale_ID DESC
        `);

        res.status(200).json({
            count: sales.length,
            sales: sales
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve sales"
        });
    }
};


// 3. GET ONE SALE WITH ITS ITEMS
const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        const [sales] = await db.execute(`
            SELECT
                sales.*,
                vendors.Vendor_Name
            FROM sales
            JOIN vendors
            ON sales.Vendor_ID = vendors.Vendor_ID
            WHERE sales.Sale_ID = ?
        `, [id]);

        if (sales.length === 0) {
            return res.status(404).json({
                message: "Sale not found"
            });
        }

        const [items] = await db.execute(`
            SELECT
                sales_details.*,
                fruits.Fruit_Name
            FROM sales_details
            JOIN fruits
            ON sales_details.Fruit_ID = fruits.Fruit_ID
            WHERE sales_details.Sale_ID = ?
        `, [id]);

        res.status(200).json({
            sale: sales[0],
            items: items
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve sale"
        });
    }
};


// EXPORT FUNCTIONS
module.exports = {
    addSale,
    getAllSales,
    getSaleById
};
