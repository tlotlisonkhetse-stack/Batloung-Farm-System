
const db = require("../config/db");

// ADD A NEW PURCHASE
const addPurchase = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const {
            Supplier_ID,
            Purchase_Date,
            Payment_Method,
            Payment_Status,
            items
        } = req.body;

        // Validate required fields
        if (!Supplier_ID || !Purchase_Date || !Payment_Method ||
            !Payment_Status || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Please provide all purchase details."
            });
        }

        const validMethods = ["CASH", "MOBILE_MONEY", "CREDIT"];
        const validStatuses = ["PAID", "PARTIALLY_PAID", "UNPAID"];

        if (!validMethods.includes(Payment_Method) ||
            !validStatuses.includes(Payment_Status)) {
            return res.status(400).json({
                message: "Invalid payment method or payment status."
            });
        }

        // Combine repeated fruit entries into one line
        const combinedItems = new Map();

        for (const item of items) {
            const fruitId = Number(item.Fruit_ID);
            const crateQuantity = Number(item.Crate_Quantity);
            const crateCost = Number(item.Unit_Cost_Per_Crate);

            if (!Number.isInteger(fruitId) || fruitId <= 0 ||
                !Number.isInteger(crateQuantity) || crateQuantity <= 0 ||
                !Number.isFinite(crateCost) || crateCost < 0) {
                return res.status(400).json({
                    message: "Invalid fruit, crate quantity, or crate cost."
                });
            }

            if (combinedItems.has(fruitId)) {
                const existing = combinedItems.get(fruitId);

                // Do not combine the same fruit if its crate costs differ
                if (existing.Unit_Cost_Per_Crate !== crateCost) {
                    return res.status(400).json({
                        message: "Use one crate cost for each fruit in a purchase."
                    });
                }

                existing.Crate_Quantity += crateQuantity;
            } else {
                combinedItems.set(fruitId, {
                    Fruit_ID: fruitId,
                    Crate_Quantity: crateQuantity,
                    Unit_Cost_Per_Crate: crateCost
                });
            }
        }

        await connection.beginTransaction();

        // Check that the supplier exists
        const [suppliers] = await connection.execute(
            "SELECT Supplier_ID FROM suppliers WHERE Supplier_ID = ?",
            [Number(Supplier_ID)]
        );

        if (suppliers.length === 0) {
            throw new Error("The selected supplier does not exist.");
        }

        const preparedItems = [];
        let totalAmount = 0;

        // Prepare purchase details using crate capacities
        for (const item of combinedItems.values()) {
            const [capacityRows] = await connection.execute(
                `SELECT Fruits_Per_Crate
                 FROM fruit_crate_capacity
                 WHERE Fruit_ID = ?`,
                [item.Fruit_ID]
            );

            if (capacityRows.length === 0) {
                throw new Error(
                    `Crate capacity has not been configured for fruit ID ${item.Fruit_ID}.`
                );
            }

            const fruitsPerCrate = Number(
                capacityRows[0].Fruits_Per_Crate
            );

            const totalFruits = item.Crate_Quantity * fruitsPerCrate;
            const subtotal =
                item.Crate_Quantity * item.Unit_Cost_Per_Crate;

            totalAmount += subtotal;

            preparedItems.push({
                Fruit_ID: item.Fruit_ID,
                Crate_Quantity: item.Crate_Quantity,
                Fruits_Per_Crate: fruitsPerCrate,
                Total_Fruits: totalFruits,
                Unit_Cost_Per_Crate: item.Unit_Cost_Per_Crate,
                Subtotal: subtotal
            });
        }

        // Create the purchase record
        const [purchaseResult] = await connection.execute(
            `INSERT INTO purchases
             (Supplier_ID, Purchase_Date, Total_Amount,
              Payment_Method, Payment_Status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                Number(Supplier_ID),
                Purchase_Date,
                totalAmount,
                Payment_Method,
                Payment_Status
            ]
        );

        const purchaseId = purchaseResult.insertId;

        // Save each fruit purchase and update raw stock
        for (const item of preparedItems) {
            await connection.execute(
                `INSERT INTO purchase_raw_details
                 (Purchase_ID, Fruit_ID, Crate_Quantity,
                  Fruits_Per_Crate, Unit_Cost_Per_Crate, Subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    purchaseId,
                    item.Fruit_ID,
                    item.Crate_Quantity,
                    item.Fruits_Per_Crate,
                    item.Unit_Cost_Per_Crate,
                    item.Subtotal
                ]
            );

            await connection.execute(
                `INSERT INTO raw_stock
                 (Fruit_ID, Quantity_Available)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE
                 Quantity_Available =
                 Quantity_Available + VALUES(Quantity_Available)`,
                [
                    item.Fruit_ID,
                    item.Total_Fruits
                ]
            );
        }

        await connection.commit();

        return res.status(201).json({
            message: "Purchase recorded successfully! Raw fruit stock has been updated.",
            Purchase_ID: purchaseId,
            Total_Amount: totalAmount
        });

    } catch (error) {
        await connection.rollback();

        console.error("ADD PURCHASE ERROR:", error);

        return res.status(500).json({
            message: error.message || "Failed to record purchase."
        });

    } finally {
        connection.release();
    }
};


// GET ALL PURCHASES
const getAllPurchases = async (req, res) => {
    try {
        const [purchases] = await db.execute(
            `SELECT
                p.*,
                s.Supplier_Name
             FROM purchases p
             LEFT JOIN suppliers s
                ON p.Supplier_ID = s.Supplier_ID
             ORDER BY p.Purchase_ID DESC`
        );

        res.status(200).json(purchases);

    } catch (error) {
        console.error("GET PURCHASES ERROR:", error);

        res.status(500).json({
            message: "Failed to retrieve purchases."
        });
    }
};


// GET ONE PURCHASE
const getPurchaseById = async (req, res) => {
    try {
        const purchaseId = Number(req.params.id);

        if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
            return res.status(400).json({
                message: "Invalid purchase ID."
            });
        }

        const [purchases] = await db.execute(
            `SELECT
                p.*,
                s.Supplier_Name
             FROM purchases p
             LEFT JOIN suppliers s
                ON p.Supplier_ID = s.Supplier_ID
             WHERE p.Purchase_ID = ?`,
            [purchaseId]
        );

        if (purchases.length === 0) {
            return res.status(404).json({
                message: "Purchase not found."
            });
        }

        const [rawItems] = await db.execute(
            `SELECT
                prd.*,
                f.Fruit_Name
             FROM purchase_raw_details prd
             LEFT JOIN fruits f
                ON prd.Fruit_ID = f.Fruit_ID
             WHERE prd.Purchase_ID = ?`,
            [purchaseId]
        );

        const [legacyItems] = await db.execute(
            `SELECT
                pd.*,
                f.Fruit_Name
             FROM purchase_details pd
             LEFT JOIN fruits f
                ON pd.Fruit_ID = f.Fruit_ID
             WHERE pd.Purchase_ID = ?`,
            [purchaseId]
        );

        res.status(200).json({
            ...purchases[0],
            items: rawItems,
            legacyItems: legacyItems
        });

    } catch (error) {
        console.error("GET PURCHASE ERROR:", error);

        res.status(500).json({
            message: "Failed to retrieve purchase."
        });
    }
};


module.exports = {
    addPurchase,
    getAllPurchases,
    getPurchaseById
};
