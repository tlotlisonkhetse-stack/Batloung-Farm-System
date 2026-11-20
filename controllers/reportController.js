
const db = require("../config/db");

// 1. SALES REPORT
const getSalesReport = async (req, res) => {
    try {
        const [report] = await db.execute(`
            SELECT
                COUNT(*) AS Total_Sales,
                COALESCE(SUM(Total_Amount), 0) AS Total_Revenue
            FROM sales
        `);

        res.status(200).json({
            Currency: "Lesotho Maloti (M)",
            report: report[0]
        });
    } catch (error) {
        res.status(500).json({
            message: "Error generating sales report",
            error: error.message
        });
    }
};

// 2. PURCHASE REPORT
const getPurchaseReport = async (req, res) => {
    try {
        const [report] = await db.execute(`
            SELECT
                COUNT(*) AS Total_Purchases,
                COALESCE(SUM(Total_Amount), 0) AS Total_Purchase_Cost
            FROM purchases
        `);

        res.status(200).json({
            Currency: "Lesotho Maloti (M)",
            report: report[0]
        });
    } catch (error) {
        res.status(500).json({
            message: "Error generating purchase report",
            error: error.message
        });
    }
};

// 3. STOCK REPORT
const getStockReport = async (req, res) => {
    try {
        const [stockReport] = await db.execute(`
            SELECT
                s.Stock_ID,
                f.Fruit_Name,
                s.Package_Size,
                s.Quantity_Available
            FROM stock s
            JOIN fruits f ON s.Fruit_ID = f.Fruit_ID
            ORDER BY f.Fruit_Name, s.Package_Size
        `);

        res.status(200).json({
            count: stockReport.length,
            stockReport
        });
    } catch (error) {
        res.status(500).json({
            message: "Error generating stock report",
            error: error.message
        });
    }
};

// 4. PROFIT REPORT
const getProfitReport = async (req, res) => {
    try {
        const [sales] = await db.execute(`
            SELECT COALESCE(SUM(Total_Amount), 0) AS Total_Revenue
            FROM sales
        `);

        const [purchases] = await db.execute(`
            SELECT COALESCE(SUM(Total_Amount), 0) AS Total_Purchase_Cost
            FROM purchases
        `);

        const revenue = Number(sales[0].Total_Revenue);
        const purchaseCost = Number(purchases[0].Total_Purchase_Cost);

        res.status(200).json({
            Currency: "Lesotho Maloti (M)",
            Total_Revenue: revenue,
            Total_Purchase_Cost: purchaseCost,
            Difference: revenue - purchaseCost,
            Note: "Basic revenue minus purchase cost comparison, not full accounting profit."
        });
    } catch (error) {
        res.status(500).json({
            message: "Error generating profit report",
            error: error.message
        });
    }
};

// 5. VENDOR DEBT REPORT
const getVendorDebtReport = async (req, res) => {
    try {
        const [vendorDebtReport] = await db.execute(`
            SELECT
                s.Sale_ID,
                v.Vendor_Name,
                s.Total_Amount,
                COALESCE(SUM(p.Amount_Paid), 0) AS Total_Paid,
                GREATEST(
                    s.Total_Amount - COALESCE(SUM(p.Amount_Paid), 0),
                    0
                ) AS Outstanding_Balance,
                s.Payment_Status,
                s.Sale_Date
            FROM sales s
            JOIN vendors v ON s.Vendor_ID = v.Vendor_ID
            LEFT JOIN payments p ON s.Sale_ID = p.Sale_ID
            GROUP BY
                s.Sale_ID,
                v.Vendor_Name,
                s.Total_Amount,
                s.Payment_Status,
                s.Sale_Date
            HAVING Outstanding_Balance > 0
            ORDER BY s.Sale_Date DESC
        `);

        res.status(200).json({
            Currency: "Lesotho Maloti (M)",
            count: vendorDebtReport.length,
            vendorDebtReport
        });
    } catch (error) {
        res.status(500).json({
            message: "Error generating vendor debt report",
            error: error.message
        });
    }
};

module.exports = {
    getSalesReport,
    getPurchaseReport,
    getStockReport,
    getProfitReport,
    getVendorDebtReport
};
