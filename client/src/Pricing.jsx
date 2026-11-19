
import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function Pricing() {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [newPrice, setNewPrice] = useState("");

    useEffect(() => {
        loadPrices();
    }, []);

    const loadPrices = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest("/prices");

            setPrices(
                Array.isArray(data)
                    ? data
                    : data.prices || []
            );
        } catch (err) {
            setError(err.message || "Unable to load prices.");
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (item) => {
        setEditingId(item.Price_ID);
        setNewPrice(item.Selling_Price);
        setError("");
        setSuccess("");
    };

    const savePrice = async (priceId) => {
        const amount = Number(newPrice);

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Please enter a valid price greater than zero.");
            return;
        }

        try {
            await apiRequest(`/prices/${priceId}`, {
                method: "PUT",
                body: JSON.stringify({
                    Selling_Price: amount
                })
            });

            setSuccess("Packaging price updated successfully.");
            setEditingId(null);
            setNewPrice("");

            await loadPrices();
        } catch (err) {
            setError(err.message || "Unable to update price.");
        }
    };

    const cancelEditing = () => {
        setEditingId(null);
        setNewPrice("");
        setError("");
    };

    const activePrices = prices.filter(
        (item) => Number(item.Is_Active) === 1
    );

    return (
        <div className="page-content pricing-page">

            <div className="pricing-header">
                <div>
                    <h1>Packaging Prices</h1>
                    <p>
                        Manage selling prices for your fruit packages.
                    </p>
                </div>

                <button
                    className="pricing-refresh"
                    onClick={loadPrices}
                >
                    ↻ Refresh Prices
                </button>
            </div>

            <div className="pricing-summary">

                <div className="pricing-summary-card">
                    <span>🏷️</span>
                    <p>Total Price Records</p>
                    <h2>{prices.length}</h2>
                </div>

                <div className="pricing-summary-card">
                    <span>✅</span>
                    <p>Available Prices</p>
                    <h2>{activePrices.length}</h2>
                </div>

            </div>

            {success && (
                <div className="pricing-success">
                    {success}
                </div>
            )}

            {error && (
                <div className="pricing-error">
                    {error}
                </div>
            )}

            <div className="pricing-table-container">

                <div className="pricing-table-heading">
                    <h2>Fruit Packaging Prices</h2>
                    <p>
                        All prices are displayed in Lesotho Maloti (M).
                    </p>
                </div>

                {loading ? (
                    <p className="pricing-message">
                        Loading packaging prices...
                    </p>
                ) : prices.length === 0 ? (
                    <p className="pricing-message">
                        No packaging prices found.
                    </p>
                ) : (

                    <div className="pricing-table-scroll">
                        <table className="pricing-table">
                            <thead>
                                <tr>
                                    <th>Fruit</th>
                                    <th>Package Size</th>
                                    <th>Selling Price</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {prices.map((item) => (
                                    <tr key={item.Price_ID}>

                                        <td>
                                            <strong>
                                                {item.Fruit_Name}
                                            </strong>
                                        </td>

                                        <td>
                                            {item.Package_Size}
                                        </td>

                                        <td>
                                            {editingId === item.Price_ID ? (
                                                <input
                                                    className="pricing-input"
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={newPrice}
                                                    onChange={(e) =>
                                                        setNewPrice(e.target.value)
                                                    }
                                                />
                                            ) : (
                                                <strong>
                                                    M {Number(
                                                        item.Selling_Price
                                                    ).toFixed(2)}
                                                </strong>
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    Number(item.Is_Active) === 1
                                                        ? "pricing-active"
                                                        : "pricing-inactive"
                                                }
                                            >
                                                {Number(item.Is_Active) === 1
                                                    ? "Available"
                                                    : "Unavailable"}
                                            </span>
                                        </td>

                                        <td>
                                            {editingId === item.Price_ID ? (
                                                <div className="pricing-actions">
                                                    <button
                                                        className="pricing-save"
                                                        onClick={() =>
                                                            savePrice(item.Price_ID)
                                                        }
                                                    >
                                                        Save
                                                    </button>

                                                    <button
                                                        className="pricing-cancel"
                                                        onClick={cancelEditing}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="pricing-edit"
                                                    onClick={() =>
                                                        startEditing(item)
                                                    }
                                                >
                                                    Edit Price
                                                </button>
                                            )}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

            <div className="pricing-note">
                <strong>Note:</strong> Prices are maintained in Maloti.
                Updating a packaging price affects future sales.
            </div>

            <style>{`
                .pricing-page {
                    color: #294b32;
                }

                .pricing-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    flex-wrap: wrap;
                    margin-bottom: 25px;
                }

                .pricing-header h1 {
                    margin: 0 0 8px;
                }

                .pricing-header p {
                    color: #718071;
                    margin: 0;
                }

                .pricing-refresh,
                .pricing-edit,
                .pricing-save,
                .pricing-cancel {
                    border: none;
                    border-radius: 7px;
                    padding: 10px 15px;
                    cursor: pointer;
                    font-weight: bold;
                }

                .pricing-refresh,
                .pricing-edit,
                .pricing-save {
                    background: #205c35;
                    color: white;
                }

                .pricing-summary {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 18px;
                    margin-bottom: 22px;
                }

                .pricing-summary-card {
                    background: white;
                    padding: 22px;
                    border: 1px solid #e5eee5;
                    border-radius: 12px;
                }

                .pricing-summary-card span {
                    font-size: 25px;
                }

                .pricing-summary-card p {
                    color: #718071;
                    margin: 10px 0 5px;
                    font-size: 13px;
                }

                .pricing-summary-card h2 {
                    margin: 0;
                    color: #205c35;
                }

                .pricing-table-container {
                    background: white;
                    padding: 22px;
                    border: 1px solid #e5eee5;
                    border-radius: 12px;
                }

                .pricing-table-heading {
                    margin-bottom: 20px;
                }

                .pricing-table-heading h2 {
                    margin: 0 0 6px;
                }

                .pricing-table-heading p {
                    margin: 0;
                    color: #718071;
                    font-size: 13px;
                }

                .pricing-table-scroll {
                    overflow-x: auto;
                }

                .pricing-table {
                    width: 100%;
                    min-width: 650px;
                    border-collapse: collapse;
                }

                .pricing-table th {
                    background: #f1f7f1;
                    padding: 14px;
                    text-align: left;
                    color: #315b3c;
                    font-size: 12px;
                }

                .pricing-table td {
                    padding: 14px;
                    border-bottom: 1px solid #edf1ed;
                    font-size: 13px;
                }

                .pricing-active,
                .pricing-inactive {
                    display: inline-block;
                    padding: 6px 11px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: bold;
                }

                .pricing-active {
                    background: #e2f2e4;
                    color: #28713b;
                }

                .pricing-inactive {
                    background: #ffe6e4;
                    color: #b83d35;
                }

                .pricing-input {
                    width: 100px;
                    padding: 9px;
                    border: 1px solid #b8cdbb;
                    border-radius: 6px;
                }

                .pricing-actions {
                    display: flex;
                    gap: 7px;
                }

                .pricing-cancel {
                    background: #e9eee9;
                    color: #405340;
                }

                .pricing-success,
                .pricing-error {
                    padding: 12px 15px;
                    border-radius: 7px;
                    margin-bottom: 15px;
                }

                .pricing-success {
                    background: #e2f2e4;
                    color: #28713b;
                }

                .pricing-error {
                    background: #ffe6e4;
                    color: #b83d35;
                }

                .pricing-message {
                    padding: 25px;
                    text-align: center;
                    color: #718071;
                }

                .pricing-note {
                    margin-top: 18px;
                    color: #718071;
                    font-size: 12px;
                }

                @media (max-width: 600px) {
                    .pricing-summary {
                        grid-template-columns: 1fr;
                    }

                    .pricing-table-container {
                        padding: 14px;
                    }
                }
            `}</style>

        </div>
    );
}

export default Pricing;
