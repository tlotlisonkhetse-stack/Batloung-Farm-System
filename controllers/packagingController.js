
const db = require("../config/db");

// GET PACKAGING INFORMATION
const getPackagingData = async (req, res) => {
    try {
        const [fruits] = await db.execute(`
            SELECT
                f.Fruit_ID,
                f.Fruit_Name,
                COALESCE(rs.Quantity_Available, 0) AS Raw_Stock
            FROM Fruits f
            LEFT JOIN Raw_Stock rs
                ON f.Fruit_ID = rs.Fruit_ID
            ORDER BY f.Fruit_Name
        `);

        const [capacities] = await db.execute(`
            SELECT
                pc.Fruit_ID,
                f.Fruit_Name,
                pc.Package_Size,
                pc.Fruits_Per_Package
            FROM Packaging_Capacities pc
            JOIN Fruits f
                ON pc.Fruit_ID = f.Fruit_ID
            WHERE pc.Is_Active = TRUE
            ORDER BY f.Fruit_Name,
                FIELD(pc.Package_Size, 'SMALL', 'MEDIUM', 'LARGE')
        `);

        res.status(200).json({
            fruits,
            capacities
        });

    } catch (error) {
        console.error("GET PACKAGING DATA ERROR:", error);

        res.status(500).json({
            message: "Failed to load packaging information."
        });
    }
};


// CREATE PACKAGING RECORD
const createPackaging = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const {
            Fruit_ID,
            Package_Size,
            Packages_Produced
        } = req.body;

        const fruitId = Number(Fruit_ID);
        const packagesProduced = Number(Packages_Produced);

        const validSizes = ["SMALL", "MEDIUM", "LARGE"];

        if (
            !Number.isInteger(fruitId) ||
            fruitId <= 0 ||
            !validSizes.includes(Package_Size) ||
            !Number.isInteger(packagesProduced) ||
            packagesProduced <= 0
        ) {
            return res.status(400).json({
                message: "Please provide a valid fruit, package size and package quantity."
            });
        }

        await connection.beginTransaction();

        // Get packaging capacity
        const [capacityRows] = await connection.execute(
            `SELECT Fruits_Per_Package
             FROM Packaging_Capacities
             WHERE Fruit_ID = ?
             AND Package_Size = ?
             AND Is_Active = TRUE`,
            [fruitId, Package_Size]
        );

        if (capacityRows.length === 0) {
            throw new Error("Packaging capacity was not found for this fruit and package size.");
        }

        const fruitsPerPackage = Number(
            capacityRows[0].Fruits_Per_Package
        );

        const fruitsUsed = packagesProduced * fruitsPerPackage;

        // Lock and check raw stock
        const [stockRows] = await connection.execute(
            `SELECT Quantity_Available
             FROM Raw_Stock
             WHERE Fruit_ID = ?
             FOR UPDATE`,
            [fruitId]
        );

        if (stockRows.length === 0) {
            throw new Error("No raw stock record exists for this fruit.");
        }

        const availableRawStock = Number(
            stockRows[0].Quantity_Available
        );

        if (availableRawStock < fruitsUsed) {
            throw new Error(
                `Insufficient raw stock. Available: ${availableRawStock}, required: ${fruitsUsed}.`
            );
        }

        // Deduct raw fruit
        await connection.execute(
            `UPDATE Raw_Stock
             SET Quantity_Available = Quantity_Available - ?
             WHERE Fruit_ID = ?`,
            [fruitsUsed, fruitId]
        );

        // Add finished packages to packaged stock
        await connection.execute(
            `INSERT INTO Stock
             (Fruit_ID, Package_Size, Quantity_Available)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
             Quantity_Available =
             Quantity_Available + VALUES(Quantity_Available),
             Last_Updated = CURRENT_TIMESTAMP`,
            [fruitId, Package_Size, packagesProduced]
        );

        // Record packaging activity
        await connection.execute(
            `INSERT INTO Packaging_Records
             (Fruit_ID, Package_Size, Packages_Produced, Fruits_Used)
             VALUES (?, ?, ?, ?)`,
            [
                fruitId,
                Package_Size,
                packagesProduced,
                fruitsUsed
            ]
        );

        await connection.commit();

        res.status(201).json({
            message: "Packaging completed successfully!",
            Fruit_ID: fruitId,
            Package_Size,
            Packages_Produced: packagesProduced,
            Fruits_Used: fruitsUsed,
            Remaining_Raw_Stock: availableRawStock - fruitsUsed
        });

    } catch (error) {
        await connection.rollback();

        console.error("CREATE PACKAGING ERROR:", error);

        res.status(400).json({
            message: error.message || "Failed to complete packaging."
        });

    } finally {
        connection.release();
    }
};


// GET PACKAGING HISTORY
const getPackagingHistory = async (req, res) => {
    try {
        const [history] = await db.execute(`
            SELECT
                pr.Packaging_ID,
                pr.Fruit_ID,
                f.Fruit_Name,
                pr.Package_Size,
                pr.Packages_Produced,
                pr.Fruits_Used,
                pr.Packaging_Date
            FROM Packaging_Records pr
            JOIN Fruits f
                ON pr.Fruit_ID = f.Fruit_ID
            ORDER BY pr.Packaging_ID DESC
        `);

        res.status(200).json(history);

    } catch (error) {
        console.error("GET PACKAGING HISTORY ERROR:", error);

        res.status(500).json({
            message: "Failed to retrieve packaging history."
        });
    }
};


module.exports = {
    getPackagingData,
    createPackaging,
    getPackagingHistory
};
