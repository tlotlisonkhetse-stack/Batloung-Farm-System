
const db = require("../config/db");

// 1. RECORD A PAYMENT FROM A VENDOR
const addPayment = async (req, res) => {
    const { Sale_ID, Amount_Paid, Payment_Method } = req.body;

    // Validate payment information
    if (
        !Number.isInteger(Number(Sale_ID)) ||
        Number(Sale_ID) <= 0 ||
        Amount_Paid === undefined ||
        Amount_Paid === null ||
        Amount_Paid === "" ||
        !Number.isFinite(Number(Amount_Paid)) ||
        Number(Amount_Paid) <= 0 ||
        !["CASH", "MOBILE_MONEY", "CREDIT"].includes(Payment_Method)
    ) {
        return res.status(400).json({
            message: "Provide a valid sale ID, positive payment amount in Maloti and payment method"
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Find the sale and lock it during payment processing
        const [sales] = await connection.execute(
            `SELECT Sale_ID, Total_Amount
             FROM Sales
             WHERE Sale_ID = ?
             FOR UPDATE`,
            [Number(Sale_ID)]
        );

        if (sales.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Sale not found"
            });
        }

        const totalAmount = Number(sales[0].Total_Amount);

        // Calculate previous payments
        const [paymentRows] = await connection.execute(
            `SELECT COALESCE(SUM(Amount_Paid), 0) AS Total_Paid
             FROM Payments
             WHERE Sale_ID = ?`,
            [Number(Sale_ID)]
        );

        const previousPayments = Number(paymentRows[0].Total_Paid);
        const amountPaid = Number(Amount_Paid);

        const outstandingBalance = totalAmount - previousPayments;

        // Prevent overpayment
        if (amountPaid > outstandingBalance) {
            await connection.rollback();

            return res.status(400).json({
                message: "Payment exceeds the outstanding balance",
                Outstanding_Balance: outstandingBalance
            });
        }

        // Save payment
        const [result] = await connection.execute(
            `INSERT INTO Payments
             (Sale_ID, Amount_Paid, Payment_Method)
             VALUES (?, ?, ?)`,
            [Number(Sale_ID), amountPaid, Payment_Method]
        );

        const newTotalPaid = previousPayments + amountPaid;
        const newBalance = totalAmount - newTotalPaid;

        let paymentStatus = "PARTIALLY_PAID";

        if (newBalance === 0) {
            paymentStatus = "PAID";
        }

        // Update sale payment status
        await connection.execute(
            `UPDATE Sales
             SET Payment_Status = ?
             WHERE Sale_ID = ?`,
            [paymentStatus, Number(Sale_ID)]
        );

        await connection.commit();

        res.status(201).json({
            message: "Payment recorded successfully",
            Payment_ID: result.insertId,
            Sale_ID: Number(Sale_ID),
            Currency: "LSL",
            Total_Amount: totalAmount,
            Previously_Paid: previousPayments,
            Amount_Paid_Now: amountPaid,
            Total_Paid: newTotalPaid,
            Outstanding_Balance: newBalance,
            Payment_Status: paymentStatus
        });

    } catch (error) {
        await connection.rollback();

        console.error(error.message);

        res.status(500).json({
            message: "Failed to record payment"
        });

    } finally {
        connection.release();
    }
};


// 2. VIEW ALL PAYMENTS
const getAllPayments = async (req, res) => {
    try {
        const [payments] = await db.execute(`
            SELECT
                Payments.Payment_ID,
                Payments.Sale_ID,
                Vendors.Vendor_Name,
                Payments.Amount_Paid,
                Payments.Payment_Method,
                Payments.Payment_Date
            FROM Payments
            JOIN Sales
                ON Payments.Sale_ID = Sales.Sale_ID
            JOIN Vendors
                ON Sales.Vendor_ID = Vendors.Vendor_ID
            ORDER BY Payments.Payment_Date DESC
        `);

        res.status(200).json({
            Currency: "Lesotho Loti (LSL)",
            count: payments.length,
            payments: payments
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve payments"
        });
    }
};


// 3. VIEW PAYMENTS FOR ONE SALE
const getPaymentsBySale = async (req, res) => {
    try {
        const { id } = req.params;

        const [payments] = await db.execute(`
            SELECT *
            FROM Payments
            WHERE Sale_ID = ?
            ORDER BY Payment_Date DESC
        `, [id]);

        res.status(200).json({
            Sale_ID: Number(id),
            count: payments.length,
            payments: payments
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve sale payments"
        });
    }
};


// 4. VIEW OUTSTANDING VENDOR BALANCES
const getOutstandingBalances = async (req, res) => {
    try {
        const [balances] = await db.execute(`
            SELECT
                Sales.Sale_ID,
                Vendors.Vendor_Name,
                Sales.Sale_Date,
                Sales.Total_Amount,
                COALESCE(SUM(Payments.Amount_Paid), 0) AS Total_Paid,
                Sales.Total_Amount -
                    COALESCE(SUM(Payments.Amount_Paid), 0)
                    AS Outstanding_Balance,
                Sales.Payment_Status
            FROM Sales
            JOIN Vendors
                ON Sales.Vendor_ID = Vendors.Vendor_ID
            LEFT JOIN Payments
                ON Sales.Sale_ID = Payments.Sale_ID
            GROUP BY
                Sales.Sale_ID,
                Vendors.Vendor_Name,
                Sales.Sale_Date,
                Sales.Total_Amount,
                Sales.Payment_Status
            HAVING Outstanding_Balance > 0
            ORDER BY Sales.Sale_Date DESC
        `);

        res.status(200).json({
            Currency: "Lesotho Loti (LSL)",
            count: balances.length,
            outstandingBalances: balances
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Failed to retrieve outstanding balances"
        });
    }
};


// EXPORT FUNCTIONS
module.exports = {
    addPayment,
    getAllPayments,
    getPaymentsBySale,
    getOutstandingBalances
};
