const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

// IMPORT ROUTES
const supplierRoutes = require("./routes/supplierRoutes");
const fruitRoutes = require("./routes/fruitRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const salesRoutes = require("./routes/salesRoutes");
const stockRoutes = require("./routes/stockRoutes");
const priceRoutes = require("./routes/priceRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const packagingRoutes = require("./routes/packagingRoutes");

// CREATE EXPRESS APPLICATION
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// HOME ROUTE
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to Batloung Farm Distribution System!",
        status: "Server is running successfully",
        country: "Lesotho",
        currency: "Lesotho Loti (LSL)"
    });
});

// BASIC API TEST
app.get("/api/test", (req, res) => {
    res.status(200).json({
        message: "Batloung Farm API is working!"
    });
});

// DATABASE CONNECTION TEST
app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS result");

        res.status(200).json({
            message: "MySQL database connected successfully!",
            databaseTest: rows[0].result
        });

    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// SUPPLIER ROUTES
app.use("/api/suppliers", supplierRoutes);

// FRUIT ROUTES
app.use("/api/fruits", fruitRoutes);

// VENDOR ROUTES
app.use("/api/vendors", vendorRoutes);

// PURCHASE ROUTES
app.use("/api/purchases", purchaseRoutes);

// SALES ROUTES
app.use("/api/sales", salesRoutes);

// STOCK ROUTES
app.use("/api/stock", stockRoutes);

// PACKAGING PRICE ROUTES
app.use("/api/prices", priceRoutes);

// PAYMENT ROUTES
app.use("/api/payments", paymentRoutes);

// REPORT ROUTES
app.use("/api/reports", reportRoutes);

// PACKAGING ROUTES
app.use("/api/packaging", packagingRoutes);

// 404 ROUTE
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

// START SERVER (only when running on your own computer, not on Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Batloung Farm server running on port ${PORT}`);
    });
}

// EXPORT THE APP (Vercel needs this)
module.exports = app;
