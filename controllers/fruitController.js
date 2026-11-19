
const db = require("../config/db");

// 1. ADD A NEW FRUIT
const addFruit = async (req, res) => {
    try {
        const { Fruit_Name, Description } = req.body;

        if (!Fruit_Name) {
            return res.status(400).json({
                message: "Fruit name is required"
            });
        }

        const sql = `
            INSERT INTO Fruits (Fruit_Name, Description)
            VALUES (?, ?)
        `;

        const [result] = await db.execute(sql, [
            Fruit_Name,
            Description || null
        ]);

        res.status(201).json({
            message: "Fruit added successfully",
            Fruit_ID: result.insertId
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Failed to add fruit"
        });
    }
};


// 2. GET ALL FRUITS
const getAllFruits = async (req, res) => {
    try {
        const [fruits] = await db.execute(
            "SELECT * FROM Fruits ORDER BY Fruit_ID DESC"
        );

        res.status(200).json({
            count: fruits.length,
            fruits: fruits
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Failed to retrieve fruits"
        });
    }
};


// 3. GET ONE FRUIT
const getFruitById = async (req, res) => {
    try {
        const { id } = req.params;

        const [fruits] = await db.execute(
            "SELECT * FROM Fruits WHERE Fruit_ID = ?",
            [id]
        );

        if (fruits.length === 0) {
            return res.status(404).json({
                message: "Fruit not found"
            });
        }

        res.status(200).json(fruits[0]);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Failed to retrieve fruit"
        });
    }
};


// 4. UPDATE FRUIT
const updateFruit = async (req, res) => {
    try {
        const { id } = req.params;
        const { Fruit_Name, Description, Status } = req.body;

        if (!Fruit_Name) {
            return res.status(400).json({
                message: "Fruit name is required"
            });
        }

        const availability = Status || "AVAILABLE";

        if (!["AVAILABLE", "UNAVAILABLE"].includes(availability)) {
            return res.status(400).json({
                message: "Availability must be AVAILABLE or UNAVAILABLE"
            });
        }

        const sql = `
            UPDATE Fruits
            SET Fruit_Name = ?, Description = ?, Status = ?
            WHERE Fruit_ID = ?
        `;

        const [result] = await db.execute(sql, [
            Fruit_Name,
            Description || null,
            availability,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Fruit not found"
            });
        }

        res.status(200).json({
            message: "Fruit updated successfully"
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Failed to update fruit"
        });
    }
};


// 5. DELETE FRUIT
const deleteFruit = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            "DELETE FROM Fruits WHERE Fruit_ID = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Fruit not found"
            });
        }

        res.status(200).json({
            message: "Fruit deleted successfully"
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: "Could not delete fruit. It may be linked to existing records."
        });
    }
};


// EXPORT FUNCTIONS
module.exports = {
    addFruit,
    getAllFruits,
    getFruitById,
    updateFruit,
    deleteFruit
};
