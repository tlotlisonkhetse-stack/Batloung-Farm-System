
import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import "./App.css";

function Reports() {
    const [sales, setSales] = useState({});
    const [purchases, setPurchases] = useState({});
    const [stock, setStock] = useState([]);
    const [outstanding, setOutstanding] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadReports = async () => {
        setLoading(true);
        setError("");

        try {
            const results = await Promise.allSettled([
                apiRequest("/reports/sales"),
                apiRequest("/reports/purchases"),
                apiRequest("/stock"),
                apiRequest("/payments/outstanding")
            ]);

            if (results[0].status === "fulfilled") {
                const data = results[0].value;
                setSales(data.report || {});
            } else {
                console.error("Sales report:", results[0].reason);
            }

            if (results[1].status === "fulfilled") {
                const data = results[1].value;
                setPurchases(data.report || {});
            } else {
                console.error("Purchase report:", results[1].reason);
            }

            if (results[2].status === "fulfilled") {
                const data = results[2].value;
                setStock(
                    Array.isArray(data)
                        ? data
                        : data.stock || data.stockReport || []
                );
            } else {
                console.error("Stock report:", results[2].reason);
            }

            if (results[3].status === "fulfilled") {
                const data = results[3].value;
                setOutstanding(
                    Array.isArray(data)
                        ? data
                        : data.outstandingBalances ||
                          data.outstanding ||
                          []
                );
            } else {
                console.error("Outstanding report:", results[3].reason);
            }

            if (results.every(result => result.status === "rejected")) {
                setError("Unable to load reports. Please check your server.");
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const totalSales = Number(sales.Total_Revenue || 0);
    const totalPurchases = Number(purchases.Total_Purchase_Cost || 0);

    const totalStock = stock.reduce(
        (sum, item) =>
            sum + Number(item.Quantity_Available || 0),
        0
    );

    const totalOutstanding = outstanding.reduce(
        (sum, item) =>
            sum + Number(item.Outstanding_Balance || 0),
        0
    );

    const money = value =>
        `M ${Number(value || 0).toLocaleString("en-LS", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    return (
        <div className="reports-page">

            <div className="page-header">
                <div>
                    <p className="page-eyebrow">
                        BATLOUNG FARM DISTRIBUTION SYSTEM
                    </p>
                    <h1>Reports & Analytics</h1>
                    <p>
                        Monitor farm performance, sales,
                        purchases and inventory.
                    </p>
                </div>

                <button
                    className="refresh-btn"
                    onClick={loadReports}
                >
                    ↻ Refresh Reports
                </button>
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            {loading ? (
                <p className="report-loading">
                    Loading reports...
                </p>
            ) : (
                <>

                    <div className="reports-summary">

                        <div className="report-card">
                            <span>💰</span>
                            <p>Total Sales</p>
                            <h2>{money(totalSales)}</h2>
                        </div>

                        <div className="report-card">
                            <span>🛒</span>
                            <p>Total Purchases</p>
                            <h2>{money(totalPurchases)}</h2>
                        </div>

                        <div className="report-card">
                            <span>📦</span>
                            <p>Available Packages</p>
                            <h2>{totalStock.toLocaleString()}</h2>
                        </div>

                        <div className="report-card">
                            <span>⏳</span>
                            <p>Outstanding Balance</p>
                            <h2>{money(totalOutstanding)}</h2>
                        </div>

                    </div>

                    <div className="report-section">

                        <div className="report-section-heading">
                            <div>
                                <h2>Sales Report</h2>
                                <p>
                                    Summary of recorded farm sales.
                                </p>
                            </div>

                            <span>
                                {Number(sales.Total_Sales || 0)} Records
                            </span>
                        </div>

                        <div className="report-table-wrap">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr>
                                        <td>Total Sales Records</td>
                                        <td>
                                            {Number(sales.Total_Sales || 0)}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>Total Sales Revenue</td>
                                        <td>{money(totalSales)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>

                    <div className="report-section">

                        <div className="report-section-heading">
                            <div>
                                <h2>Purchase Report</h2>
                                <p>
                                    Summary of recorded farm purchases.
                                </p>
                            </div>

                            <span>
                                {Number(purchases.Total_Purchases || 0)} Records
                            </span>
                        </div>

                        <div className="report-table-wrap">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr>
                                        <td>Total Purchase Records</td>
                                        <td>
                                            {Number(purchases.Total_Purchases || 0)}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>Total Purchase Cost</td>
                                        <td>{money(totalPurchases)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>

                    <div className="report-section">

                        <div className="report-section-heading">
                            <div>
                                <h2>Inventory Report</h2>
                                <p>
                                    Current fruit stock by package size.
                                </p>
                            </div>

                            <span>
                                {stock.length} Stock Items
                            </span>
                        </div>

                        {stock.length === 0 ? (
                            <p className="report-empty">
                                No inventory records available.
                            </p>
                        ) : (
                            <div className="report-table-wrap">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Fruit</th>
                                            <th>Package Size</th>
                                            <th>Quantity Available</th>
                                            <th>Stock Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {stock.map((item, index) => {
                                            const quantity = Number(
                                                item.Quantity_Available || 0
                                            );

                                            return (
                                                <tr key={item.Stock_ID || index}>
                                                    <td>{item.Fruit_Name || "-"}</td>
                                                    <td>{item.Package_Size || "-"}</td>
                                                    <td>{quantity}</td>
                                                    <td>
                                                        {quantity <= 0
                                                            ? "Out of Stock"
                                                            : quantity <= 10
                                                            ? "Low Stock"
                                                            : "In Stock"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>

                </>
            )}

        </div>
    );
}

export default Reports;
