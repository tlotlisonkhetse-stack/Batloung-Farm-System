
import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function Stock() {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadStock();
    }, []);

    const loadStock = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest("/stock");

            setStock(data.stock || []);
        } catch (err) {
            setError(err.message || "Unable to load stock.");
        } finally {
            setLoading(false);
        }
    };

    const totalPackages = stock.reduce(
        (total, item) => total + Number(item.Quantity_Available || 0),
        0
    );

    const lowStock = stock.filter(
        (item) =>
            Number(item.Quantity_Available) > 0 &&
            Number(item.Quantity_Available) <= 10
    ).length;

    const outOfStock = stock.filter(
        (item) => Number(item.Quantity_Available) === 0
    ).length;

    const getStatus = (quantity) => {
        if (Number(quantity) === 0) {
            return { label: "Out of Stock", className: "stock-out" };
        }

        if (Number(quantity) <= 10) {
            return { label: "Low Stock", className: "stock-low" };
        }

        return { label: "In Stock", className: "stock-good" };
    };

    return (
        <div className="page-content">

            <div className="page-header">
                <div>
                    <h1>Stock Management</h1>
                    <p>
                        Monitor available fruit packages and manage
                        your farm inventory.
                    </p>
                </div>

                <button onClick={loadStock} className="stock-refresh">
                    ↻ Refresh Stock
                </button>
            </div>

            <div className="stock-summary">

                <div className="stock-card">
                    <span>📦</span>
                    <p>Total Packages</p>
                    <h2>{totalPackages}</h2>
                </div>

                <div className="stock-card">
                    <span>🍎</span>
                    <p>Stock Items</p>
                    <h2>{stock.length}</h2>
                </div>

                <div className="stock-card">
                    <span>⚠️</span>
                    <p>Low Stock Items</p>
                    <h2>{lowStock}</h2>
                </div>

                <div className="stock-card">
                    <span>❌</span>
                    <p>Out of Stock</p>
                    <h2>{outOfStock}</h2>
                </div>

            </div>

            <div className="stock-table-container">

                <div className="stock-table-header">
                    <div>
                        <h2>Available Inventory</h2>
                        <p>Current fruit packaging quantities</p>
                    </div>
                </div>

                {loading ? (
                    <p className="stock-message">
                        Loading stock information...
                    </p>
                ) : error ? (
                    <p className="stock-error">{error}</p>
                ) : stock.length === 0 ? (
                    <p className="stock-message">
                        No stock records available.
                    </p>
                ) : (

                    <div className="stock-table-scroll">
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>Fruit</th>
                                    <th>Package Size</th>
                                    <th>Available Quantity</th>
                                    <th>Stock Status</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>

                            <tbody>
                                {stock.map((item) => {
                                    const status = getStatus(
                                        item.Quantity_Available
                                    );

                                    return (
                                        <tr key={item.Stock_ID}>
                                            <td>
                                                <strong>
                                                    {item.Fruit_Name}
                                                </strong>
                                            </td>

                                            <td>
                                                {item.Package_Size}
                                            </td>

                                            <td>
                                                <strong>
                                                    {item.Quantity_Available}
                                                </strong>{" "}
                                                packages
                                            </td>

                                            <td>
                                                <span className={`stock-status ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </td>

                                            <td>
                                                {item.Last_Updated
                                                    ? new Date(
                                                        item.Last_Updated
                                                    ).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                )}

            </div>

            <p className="stock-note">
                <strong>Stock information:</strong> Quantities are
                retrieved directly from the Batloung Farm database.
                Items with 10 or fewer packages are classified as
                low stock.
            </p>

            <style>{`
                .stock-summary {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 18px;
                    margin: 25px 0;
                }

                .stock-card {
                    background: white;
                    padding: 22px;
                    border-radius: 12px;
                    border: 1px solid #e5eee5;
                    box-shadow: 0 3px 12px rgba(0,0,0,0.04);
                }

                .stock-card span {
                    font-size: 25px;
                }

                .stock-card p {
                    color: #718071;
                    margin: 12px 0 5px;
                    font-size: 13px;
                }

                .stock-card h2 {
                    color: #205c35;
                    margin: 0;
                    font-size: 27px;
                }

                .stock-table-container {
                    background: white;
                    border: 1px solid #e5eee5;
                    border-radius: 12px;
                    padding: 22px;
                    margin-top: 20px;
                }

                .stock-table-header {
                    margin-bottom: 20px;
                }

                .stock-table-header h2 {
                    margin: 0 0 6px;
                    color: #205c35;
                }

                .stock-table-header p {
                    color: #718071;
                    margin: 0;
                    font-size: 13px;
                }

                .stock-table-scroll {
                    overflow-x: auto;
                }

                .stock-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 650px;
                }

                .stock-table th {
                    background: #f1f7f1;
                    color: #315b3c;
                    text-align: left;
                    padding: 14px;
                    font-size: 12px;
                }

                .stock-table td {
                    padding: 15px 14px;
                    border-bottom: 1px solid #edf1ed;
                    font-size: 13px;
                    color: #455345;
                }

                .stock-status {
                    display: inline-block;
                    padding: 6px 11px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: bold;
                }

                .stock-good {
                    background: #e2f2e4;
                    color: #28713b;
                }

                .stock-low {
                    background: #fff1d6;
                    color: #94620a;
                }

                .stock-out {
                    background: #ffe6e4;
                    color: #b83d35;
                }

                .stock-refresh {
                    background: #205c35;
                    color: white;
                    border: none;
                    padding: 11px 17px;
                    border-radius: 7px;
                    cursor: pointer;
                    font-weight: bold;
                }

                .stock-refresh:hover {
                    background: #174629;
                }

                .stock-message {
                    padding: 25px;
                    text-align: center;
                    color: #718071;
                }

                .stock-error {
                    padding: 15px;
                    color: #b83d35;
                }

                .stock-note {
                    color: #718071;
                    font-size: 12px;
                    margin-top: 18px;
                }

                @media (max-width: 900px) {
                    .stock-summary {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 500px) {
                    .stock-summary {
                        grid-template-columns: 1fr;
                    }

                    .stock-table-container {
                        padding: 14px;
                    }
                }
            `}</style>

        </div>
    );
}

export default Stock;
