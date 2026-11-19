
import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import "./App.css";

function Payments() {
    const [payments, setPayments] = useState([]);
    const [outstanding, setOutstanding] = useState([]);

    const [saleId, setSaleId] = useState("");
    const [amountPaid, setAmountPaid] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const formatMoney = (amount) =>
        `M ${Number(amount || 0).toLocaleString("en-LS", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const loadPayments = async () => {
        try {
            setLoading(true);
            setError("");

            const [paymentData, outstandingData] = await Promise.all([
                apiRequest("/payments"),
                apiRequest("/payments/outstanding")
            ]);

            setPayments(
                Array.isArray(paymentData)
                    ? paymentData
                    : paymentData.payments || []
            );

            setOutstanding(
                Array.isArray(outstandingData)
                    ? outstandingData
                    : outstandingData.outstandingBalances || []
            );

        } catch (err) {
            setError(err.message || "Unable to load payment records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const selectedSale = outstanding.find(
        (sale) => String(sale.Sale_ID) === String(saleId)
    );

    const handlePayment = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!saleId || !amountPaid) {
            setError("Please select a sale and enter the payment amount.");
            return;
        }

        const amount = Number(amountPaid);

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Enter a valid payment amount.");
            return;
        }

        if (
            selectedSale &&
            amount > Number(selectedSale.Outstanding_Balance)
        ) {
            setError("Payment cannot exceed the outstanding balance.");
            return;
        }

        try {
            setSaving(true);

            await apiRequest("/payments", {
                method: "POST",
                body: JSON.stringify({
                    Sale_ID: Number(saleId),
                    Amount_Paid: amount,
                    Payment_Method: paymentMethod
                })
            });

            setMessage("Payment recorded successfully!");

            setSaleId("");
            setAmountPaid("");
            setPaymentMethod("CASH");

            await loadPayments();

        } catch (err) {
            setError(err.message || "Unable to record payment.");
        } finally {
            setSaving(false);
        }
    };

    const totalPaid = payments.reduce(
        (total, payment) =>
            total + Number(payment.Amount_Paid || 0),
        0
    );

    const totalOutstanding = outstanding.reduce(
        (total, sale) =>
            total + Number(sale.Outstanding_Balance || 0),
        0
    );

    return (
        <div className="page-content payments-page">

            <div className="page-heading">
                <div>
                    <h1>Payments Management</h1>
                    <p>
                        Record customer payments and monitor
                        outstanding balances.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadPayments}
                    disabled={loading}
                >
                    ↻ Refresh Payments
                </button>
            </div>

            {error && (
                <div className="payment-alert payment-error">
                    {error}
                </div>
            )}

            {message && (
                <div className="payment-alert payment-success">
                    {message}
                </div>
            )}

            <div className="payment-stats">

                <div className="payment-stat-card">
                    <span>💳</span>
                    <p>Total Payments Recorded</p>
                    <h2>{payments.length}</h2>
                </div>

                <div className="payment-stat-card">
                    <span>💰</span>
                    <p>Total Amount Received</p>
                    <h2>{formatMoney(totalPaid)}</h2>
                </div>

                <div className="payment-stat-card">
                    <span>⏳</span>
                    <p>Outstanding Balance</p>
                    <h2>{formatMoney(totalOutstanding)}</h2>
                </div>

            </div>

            <div className="payment-layout">

                <div className="payment-form-card">
                    <h2>Record a Payment</h2>
                    <p>Enter the details of the customer's payment.</p>

                    <form onSubmit={handlePayment}>

                        <label>Select Sale</label>

                        <select
                            value={saleId}
                            onChange={(e) => setSaleId(e.target.value)}
                            required
                        >
                            <option value="">Choose a sale</option>

                            {outstanding.map((sale) => (
                                <option
                                    key={sale.Sale_ID}
                                    value={sale.Sale_ID}
                                >
                                    Sale #{sale.Sale_ID} - {sale.Vendor_Name}
                                </option>
                            ))}
                        </select>

                        {selectedSale && (
                            <div className="selected-sale-info">
                                <p>
                                    <strong>Sale Total:</strong>{" "}
                                    {formatMoney(selectedSale.Total_Amount)}
                                </p>

                                <p>
                                    <strong>Already Paid:</strong>{" "}
                                    {formatMoney(selectedSale.Total_Paid)}
                                </p>

                                <p>
                                    <strong>Balance Due:</strong>{" "}
                                    {formatMoney(selectedSale.Outstanding_Balance)}
                                </p>
                            </div>
                        )}

                        <label>Amount Paid (M)</label>

                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Enter amount"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            required
                        />

                        <label>Payment Method</label>

                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="CASH">Cash</option>
                            <option value="MOBILE_MONEY">Mobile Money</option>
                            <option value="CREDIT">Credit</option>
                        </select>

                        <button
                            type="submit"
                            disabled={saving || outstanding.length === 0}
                        >
                            {saving ? "Saving Payment..." : "Save Payment"}
                        </button>

                    </form>
                </div>

                <div className="payment-info-card">
                    <h2>Payment Information</h2>

                    <p>
                        Payments are linked to recorded sales.
                        Each payment reduces the outstanding
                        balance of the selected sale.
                    </p>

                    <div className="payment-info-item">
                        <span>💵</span>
                        <div>
                            <strong>Cash Payments</strong>
                            <p>Record payments received in cash.</p>
                        </div>
                    </div>

                    <div className="payment-info-item">
                        <span>📱</span>
                        <div>
                            <strong>Mobile Money</strong>
                            <p>Record mobile money transactions.</p>
                        </div>
                    </div>

                    <div className="payment-info-item">
                        <span>📊</span>
                        <div>
                            <strong>Balance Tracking</strong>
                            <p>Monitor unpaid and partially paid sales.</p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="payment-table-card">
                <h2>Outstanding Balances</h2>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Sale ID</th>
                                <th>Vendor</th>
                                <th>Sale Date</th>
                                <th>Total Amount</th>
                                <th>Amount Paid</th>
                                <th>Balance Due</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {outstanding.length > 0 ? (
                                outstanding.map((sale) => (
                                    <tr key={sale.Sale_ID}>
                                        <td>#{sale.Sale_ID}</td>
                                        <td>{sale.Vendor_Name}</td>
                                        <td>
                                            {sale.Sale_Date
                                                ? new Date(sale.Sale_Date).toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td>{formatMoney(sale.Total_Amount)}</td>
                                        <td>{formatMoney(sale.Total_Paid)}</td>
                                        <td>{formatMoney(sale.Outstanding_Balance)}</td>
                                        <td>
                                            <span className="payment-status">
                                                {sale.Payment_Status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7">
                                        No outstanding balances found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="payment-table-card">
                <h2>Payment History</h2>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Sale ID</th>
                                <th>Vendor</th>
                                <th>Amount Paid</th>
                                <th>Payment Method</th>
                                <th>Payment Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {payments.length > 0 ? (
                                payments.map((payment) => (
                                    <tr key={payment.Payment_ID}>
                                        <td>#{payment.Payment_ID}</td>
                                        <td>#{payment.Sale_ID}</td>
                                        <td>{payment.Vendor_Name}</td>
                                        <td>{formatMoney(payment.Amount_Paid)}</td>
                                        <td>{payment.Payment_Method}</td>
                                        <td>
                                            {payment.Payment_Date
                                                ? new Date(payment.Payment_Date).toLocaleDateString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">
                                        No payment history available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

export default Payments;
