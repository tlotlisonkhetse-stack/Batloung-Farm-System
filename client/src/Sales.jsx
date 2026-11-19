
import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function Sales() {
    const [vendors, setVendors] = useState([]);
    const [fruits, setFruits] = useState([]);
    const [prices, setPrices] = useState([]);
    const [stock, setStock] = useState([]);
    const [sales, setSales] = useState([]);

    const [vendorId, setVendorId] = useState("");
    const [saleDate, setSaleDate] = useState(
        new Date().toLocaleDateString("en-CA")
    );
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [paymentStatus, setPaymentStatus] = useState("PAID");

    const [items, setItems] = useState([
        { Fruit_ID: "", Package_Size: "SMALL", Quantity: 1 }
    ]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [selectedSale, setSelectedSale] = useState(null);

    // GET ARRAYS FROM API RESPONSES
    const getRecords = (data, key) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.[key])) return data[key];
        return [];
    };

    // LOAD SALES PAGE DATA
    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const results = await Promise.all([
                apiRequest("/vendors"),
                apiRequest("/fruits"),
                apiRequest("/prices"),
                apiRequest("/stock"),
                apiRequest("/sales")
            ]);

            // Remove repeated vendor names from the dropdown.
            const vendorRecords = getRecords(results[0], "vendors");
            const uniqueVendors = Array.from(
                new Map(
                    vendorRecords.map((vendor) => [
                        String(vendor.Vendor_Name || "").trim().toLowerCase(),
                        vendor
                    ])
                ).values()
            );

            setVendors(uniqueVendors);
            setFruits(getRecords(results[1], "fruits"));
            setPrices(getRecords(results[2], "prices"));
            setStock(getRecords(results[3], "stock"));
            setSales(getRecords(results[4], "sales"));

        } catch (err) {
            setError(err.message || "Could not load sales information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // GET SELLING PRICE FOR A FRUIT AND PACKAGE SIZE
    const getPrice = (fruitId, packageSize) => {
        const price = prices.find(
            (p) =>
                Number(p.Fruit_ID) === Number(fruitId) &&
                p.Package_Size === packageSize &&
                (p.Is_Active === true ||
                    p.Is_Active === 1 ||
                    p.Is_Active === "1")
        );

        return price ? Number(price.Selling_Price) : 0;
    };

    // GET AVAILABLE STOCK
    const getAvailableStock = (fruitId, packageSize) => {
        // The stock API returns Fruit_Name rather than Fruit_ID.
        const selectedFruit = fruits.find(
            (fruit) => Number(fruit.Fruit_ID) === Number(fruitId)
        );

        if (!selectedFruit) return 0;

        const record = stock.find(
            (s) =>
                String(s.Fruit_Name || "").trim().toLowerCase() ===
                    String(selectedFruit.Fruit_Name || "").trim().toLowerCase() &&
                s.Package_Size === packageSize
        );

        return record ? Number(record.Quantity_Available) : 0;
    };

    // CALCULATE ITEM SUBTOTAL
    const getSubtotal = (item) => {
        return (
            getPrice(item.Fruit_ID, item.Package_Size) *
            Number(item.Quantity || 0)
        );
    };

    // CALCULATE TOTAL SALE AMOUNT
    const totalAmount = items.reduce(
        (total, item) => total + getSubtotal(item),
        0
    );

    // UPDATE AN ITEM
    const updateItem = (index, field, value) => {
        setItems((currentItems) =>
            currentItems.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    // ADD ANOTHER ITEM
    const addItem = () => {
        setItems((currentItems) => [
            ...currentItems,
            { Fruit_ID: "", Package_Size: "SMALL", Quantity: 1 }
        ]);
    };

    // REMOVE AN ITEM
    const removeItem = (index) => {
        if (items.length === 1) return;

        setItems((currentItems) =>
            currentItems.filter((_, i) => i !== index)
        );
    };

    // CHECK STOCK FOR ALL ITEMS, INCLUDING REPEATED FRUIT/SIZE ROWS
    const checkStock = () => {
        const requested = {};

        items.forEach((item) => {
            const key = `${item.Fruit_ID}-${item.Package_Size}`;
            requested[key] = (requested[key] || 0) + Number(item.Quantity);
        });

        for (const key of Object.keys(requested)) {
            const [fruitId, packageSize] = key.split("-");
            const available = getAvailableStock(fruitId, packageSize);

            if (requested[key] > available) {
                const fruit = fruits.find(
                    (f) => Number(f.Fruit_ID) === Number(fruitId)
                );

                return `${fruit?.Fruit_Name || "Selected fruit"} (${packageSize}) has only ${available} packages available.`;
            }
        }

        return "";
    };

    // SAVE SALE
    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!vendorId) {
            setError("Please select a vendor.");
            return;
        }

        if (!saleDate) {
            setError("Please select the sale date.");
            return;
        }

        if (items.some((item) => !item.Fruit_ID)) {
            setError("Please select a fruit for every item.");
            return;
        }

        if (
            items.some(
                (item) =>
                    !Number.isInteger(Number(item.Quantity)) ||
                    Number(item.Quantity) <= 0
            )
        ) {
            setError("Every item must have a quantity greater than zero.");
            return;
        }

        if (items.some((item) => getPrice(item.Fruit_ID, item.Package_Size) <= 0)) {
            setError("A selling price is missing or inactive for one of your selected items. Check Packaging Prices.");
            return;
        }

        const stockError = checkStock();

        if (stockError) {
            setError(stockError);
            return;
        }

        const saleData = {
            Vendor_ID: Number(vendorId),
            Sale_Date: saleDate,
            Payment_Method: paymentMethod,
            Payment_Status: paymentStatus,
            items: items.map((item) => ({
                Fruit_ID: Number(item.Fruit_ID),
                Package_Size: item.Package_Size,
                Quantity: Number(item.Quantity)
            }))
        };

        setSaving(true);

        try {
            const result = await apiRequest("/sales", {
                method: "POST",
                body: JSON.stringify(saleData)
            });

            setMessage(
                `Sale #${result.Sale_ID} saved successfully. Total: M ${Number(result.Total_Amount).toFixed(2)}`
            );

            setVendorId("");
            setPaymentMethod("CASH");
            setPaymentStatus("PAID");
            setItems([
                { Fruit_ID: "", Package_Size: "SMALL", Quantity: 1 }
            ]);

            await loadData();

        } catch (err) {
            setError(err.message || "Could not save sale.");
        } finally {
            setSaving(false);
        }
    };

    // VIEW SALE DETAILS
    const viewSale = async (id) => {
        setError("");
        setMessage("");

        try {
            const result = await apiRequest(`/sales/${id}`);
            setSelectedSale(result);
        } catch (err) {
            setError(err.message || "Could not load sale details.");
        }
    };

    const closeDetails = () => {
        setSelectedSale(null);
    };

    const formatMoney = (amount) =>
        `M ${Number(amount || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const getStatusClass = (status) => {
        if (status === "PAID") return "sales-status paid";
        if (status === "PARTIALLY_PAID") return "sales-status partial";
        return "sales-status unpaid";
    };

    const totalSalesValue = sales.reduce(
        (total, sale) => total + Number(sale.Total_Amount || 0),
        0
    );

    const today = new Date().toLocaleDateString("en-CA");

    const todaySales = sales.filter(
        (sale) =>
            String(sale.Sale_Date).slice(0, 10) === today
    ).length;

    const outstandingAmount = sales.reduce((total, sale) => {
        if (sale.Payment_Status === "UNPAID") {
            return total + Number(sale.Total_Amount || 0);
        }

        if (sale.Payment_Status === "PARTIALLY_PAID") {
            return total + Number(sale.Total_Amount || 0);
        }

        return total;
    }, 0);

    if (loading) {
        return (
            <div className="sales-page">
                <p>Loading sales information...</p>
            </div>
        );
    }

    return (
        <div className="sales-page">

            <style>{`
                .sales-page {
                    color: #26372a;
                }

                .sales-heading {
                    margin-bottom: 24px;
                }

                .sales-heading h1 {
                    font-size: 27px;
                    margin: 0 0 8px;
                    color: #234b2c;
                }

                .sales-heading p {
                    color: #718071;
                    font-size: 13px;
                    margin: 0;
                }

                .sales-summary {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 16px;
                    margin-bottom: 25px;
                }

                .sales-summary-card {
                    background: white;
                    border: 1px solid #e5ece4;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 3px 12px rgba(30, 60, 35, 0.04);
                }

                .sales-summary-card span {
                    display: block;
                    color: #758276;
                    font-size: 12px;
                    margin-bottom: 10px;
                }

                .sales-summary-card strong {
                    display: block;
                    font-size: 23px;
                    color: #285b34;
                }

                .sales-card {
                    background: white;
                    border: 1px solid #e5ece4;
                    border-radius: 12px;
                    padding: 22px;
                    margin-bottom: 24px;
                    box-shadow: 0 3px 12px rgba(30, 60, 35, 0.04);
                }

                .sales-card h2 {
                    font-size: 17px;
                    margin: 0 0 7px;
                    color: #294d30;
                }

                .sales-card-description {
                    font-size: 12px;
                    color: #849084;
                    margin: 0 0 22px;
                }

                .sales-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 17px;
                    margin-bottom: 22px;
                }

                .sales-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .sales-field label {
                    color: #435545;
                    font-size: 12px;
                    font-weight: 600;
                }

                .sales-field input,
                .sales-field select {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 12px;
                    border: 1px solid #dce6dc;
                    border-radius: 7px;
                    background: #fff;
                    outline: none;
                    font-size: 13px;
                    color: #344536;
                }

                .sales-field input:focus,
                .sales-field select:focus {
                    border-color: #43834d;
                    box-shadow: 0 0 0 2px rgba(67, 131, 77, 0.08);
                }

                .sales-item {
                    border: 1px solid #e4ebe2;
                    background: #fbfdfb;
                    border-radius: 10px;
                    padding: 17px;
                    margin-bottom: 14px;
                }

                .sales-item-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .sales-item-top strong {
                    font-size: 13px;
                    color: #315a37;
                }

                .sales-remove {
                    border: 0;
                    background: #fff0ef;
                    color: #b34b42;
                    padding: 7px 11px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                }

                .sales-item-grid {
                    display: grid;
                    grid-template-columns: 1.4fr 1fr 0.8fr 1fr;
                    gap: 13px;
                }

                .sales-subtotal {
                    margin-top: 13px;
                    text-align: right;
                    font-size: 12px;
                    color: #637365;
                    font-weight: 600;
                }

                .sales-add {
                    border: 1px solid #347443;
                    background: #f2f8f2;
                    color: #347443;
                    padding: 10px 15px;
                    border-radius: 7px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                }

                .sales-add:hover {
                    background: #e7f2e7;
                }

                .sales-total {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #edf6ed;
                    border: 1px solid #dcebdc;
                    border-radius: 9px;
                    padding: 18px;
                    margin: 20px 0;
                }

                .sales-total span {
                    color: #46664a;
                    font-size: 13px;
                    font-weight: 600;
                }

                .sales-total strong {
                    color: #236333;
                    font-size: 23px;
                }

                .sales-save {
                    border: none;
                    background: #286b39;
                    color: white;
                    padding: 13px 22px;
                    border-radius: 7px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13px;
                }

                .sales-save:hover {
                    background: #1e542d;
                }

                .sales-save:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .sales-alert {
                    padding: 12px 15px;
                    border-radius: 7px;
                    margin-bottom: 17px;
                    font-size: 13px;
                }

                .sales-alert.success {
                    background: #eaf6eb;
                    color: #28653a;
                }

                .sales-alert.error {
                    background: #fff0ee;
                    color: #a43f37;
                }

                .sales-table-wrap {
                    overflow-x: auto;
                }

                .sales-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 650px;
                }

                .sales-table th {
                    text-align: left;
                    padding: 13px 12px;
                    background: #f4f8f3;
                    color: #58705a;
                    font-size: 11px;
                    font-weight: 700;
                }

                .sales-table td {
                    padding: 14px 12px;
                    border-bottom: 1px solid #edf1ec;
                    color: #536354;
                    font-size: 12px;
                }

                .sales-status {
                    display: inline-block;
                    padding: 6px 9px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 700;
                }

                .sales-status.paid {
                    color: #28713b;
                    background: #e2f2e4;
                }

                .sales-status.partial {
                    color: #926b20;
                    background: #fff3d9;
                }

                .sales-status.unpaid {
                    color: #b83d35;
                    background: #ffe6e4;
                }

                .sales-view {
                    border: none;
                    background: #edf5ed;
                    color: #347443;
                    padding: 7px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                }

                .sales-detail-box {
                    background: #f8fbf7;
                    border: 1px solid #e2ebe0;
                    padding: 16px;
                    border-radius: 9px;
                    margin-top: 15px;
                }

                .sales-detail-box h3 {
                    margin-top: 0;
                    color: #315a37;
                    font-size: 15px;
                }

                .sales-empty {
                    text-align: center;
                    color: #849084;
                    padding: 28px 10px;
                    font-size: 13px;
                }

                @media (max-width: 750px) {
                    .sales-summary {
                        grid-template-columns: 1fr;
                    }

                    .sales-form-grid {
                        grid-template-columns: 1fr;
                    }

                    .sales-item-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .sales-card {
                        padding: 16px;
                    }

                    .sales-total strong {
                        font-size: 19px;
                    }
                }

                @media (max-width: 430px) {
                    .sales-item-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="sales-heading">
                <h1>Sales Management</h1>
                <p>
                    Record customer sales, manage payments and monitor
                    your farm's sales performance.
                </p>
            </div>

            {error && (
                <div className="sales-alert error">{error}</div>
            )}

            {message && (
                <div className="sales-alert success">{message}</div>
            )}

            <div className="sales-summary">
                <div className="sales-summary-card">
                    <span>Total Sales Records</span>
                    <strong>{sales.length}</strong>
                </div>

                <div className="sales-summary-card">
                    <span>Total Sales Value</span>
                    <strong>{formatMoney(totalSalesValue)}</strong>
                </div>

                <div className="sales-summary-card">
                    <span>Sales Today</span>
                    <strong>{todaySales}</strong>
                </div>
            </div>

            <div className="sales-card">
                <h2>Record New Sale</h2>
                <p className="sales-card-description">
                    Select a vendor and add the fruit packages being sold.
                    Prices and totals are calculated automatically.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="sales-form-grid">

                        <div className="sales-field">
                            <label>Vendor</label>
                            <select
                                value={vendorId}
                                onChange={(e) => setVendorId(e.target.value)}
                            >
                                <option value="">Select vendor</option>
                                {vendors.map((vendor) => (
                                    <option
                                        key={vendor.Vendor_ID}
                                        value={vendor.Vendor_ID}
                                    >
                                        {vendor.Vendor_Name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="sales-field">
                            <label>Sale Date</label>
                            <input
                                type="date"
                                value={saleDate}
                                onChange={(e) => setSaleDate(e.target.value)}
                            />
                        </div>

                        <div className="sales-field">
                            <label>Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) =>
                                    setPaymentMethod(e.target.value)
                                }
                            >
                                <option value="CASH">Cash</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                                <option value="CREDIT">Credit</option>
                            </select>
                        </div>

                        <div className="sales-field">
                            <label>Payment Status</label>
                            <select
                                value={paymentStatus}
                                onChange={(e) =>
                                    setPaymentStatus(e.target.value)
                                }
                            >
                                <option value="PAID">Paid</option>
                                <option value="PARTIALLY_PAID">
                                    Partially Paid
                                </option>
                                <option value="UNPAID">Unpaid</option>
                            </select>
                        </div>

                    </div>

                    <h2>Sale Items</h2>
                    <p className="sales-card-description">
                        Add one or more fruit packages to this sale.
                    </p>

                    {items.map((item, index) => (
                        <div className="sales-item" key={index}>
                            <div className="sales-item-top">
                                <strong>Item {index + 1}</strong>

                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        className="sales-remove"
                                        onClick={() => removeItem(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="sales-item-grid">

                                <div className="sales-field">
                                    <label>Fruit</label>
                                    <select
                                        value={item.Fruit_ID}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "Fruit_ID",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="">Select fruit</option>
                                        {fruits.map((fruit) => (
                                            <option
                                                key={fruit.Fruit_ID}
                                                value={fruit.Fruit_ID}
                                            >
                                                {fruit.Fruit_Name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sales-field">
                                    <label>Package Size</label>
                                    <select
                                        value={item.Package_Size}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "Package_Size",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="SMALL">Small</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="LARGE">Large</option>
                                    </select>
                                </div>

                                <div className="sales-field">
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.Quantity}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "Quantity",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="sales-field">
                                    <label>Unit Price (M)</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={
                                            item.Fruit_ID
                                                ? getPrice(
                                                    item.Fruit_ID,
                                                    item.Package_Size
                                                ).toFixed(2)
                                                : "0.00"
                                        }
                                    />
                                </div>

                            </div>

                            <div className="sales-subtotal">
                                Available stock: {
                                    item.Fruit_ID
                                        ? getAvailableStock(
                                            item.Fruit_ID,
                                            item.Package_Size
                                        )
                                        : 0
                                } packages
                                {" | "}
                                Subtotal: {formatMoney(getSubtotal(item))}
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        className="sales-add"
                        onClick={addItem}
                    >
                        + Add Item
                    </button>

                    <div className="sales-total">
                        <span>Total Sale Amount</span>
                        <strong>{formatMoney(totalAmount)}</strong>
                    </div>

                    <button
                        type="submit"
                        className="sales-save"
                        disabled={saving}
                    >
                        {saving ? "Saving Sale..." : "Save Sale"}
                    </button>
                </form>
            </div>

            <div className="sales-card">
                <h2>Sales History</h2>
                <p className="sales-card-description">
                    View recorded sales and their payment information.
                </p>

                <div className="sales-table-wrap">
                    <table className="sales-table">
                        <thead>
                            <tr>
                                <th>Sale ID</th>
                                <th>Date</th>
                                <th>Vendor</th>
                                <th>Total Amount</th>
                                <th>Payment Method</th>
                                <th>Status</th>
                                <th>Details</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="sales-empty">
                                        No sales have been recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale.Sale_ID}>
                                        <td>#{sale.Sale_ID}</td>
                                        <td>
                                            {String(sale.Sale_Date).slice(0, 10)}
                                        </td>
                                        <td>
                                            {sale.Vendor_Name ||
                                                `Vendor #${sale.Vendor_ID}`}
                                        </td>
                                        <td>
                                            {formatMoney(sale.Total_Amount)}
                                        </td>
                                        <td>
                                            {String(sale.Payment_Method || "")
                                                .replace("_", " ")}
                                        </td>
                                        <td>
                                            <span className={getStatusClass(
                                                sale.Payment_Status
                                            )}>
                                                {String(
                                                    sale.Payment_Status || "UNPAID"
                                                ).replace("_", " ")}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="sales-view"
                                                onClick={() =>
                                                    viewSale(sale.Sale_ID)
                                                }
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {selectedSale && (
                    <div className="sales-detail-box">
                        <div className="sales-item-top">
                            <h3>
                                Sale #{selectedSale.sale?.Sale_ID} Details
                            </h3>

                            <button
                                className="sales-remove"
                                onClick={closeDetails}
                            >
                                Close
                            </button>
                        </div>

                        <p>
                            <strong>Vendor:</strong>{" "}
                            {selectedSale.sale?.Vendor_Name ||
                                `Vendor #${selectedSale.sale?.Vendor_ID}`}
                        </p>

                        <p>
                            <strong>Total:</strong>{" "}
                            {formatMoney(selectedSale.sale?.Total_Amount)}
                        </p>

                        <div className="sales-table-wrap">
                            <table className="sales-table">
                                <thead>
                                    <tr>
                                        <th>Fruit</th>
                                        <th>Package Size</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {(selectedSale.items || []).map(
                                        (item, index) => (
                                            <tr key={index}>
                                                <td>{item.Fruit_Name}</td>
                                                <td>{item.Package_Size}</td>
                                                <td>{item.Quantity}</td>
                                                <td>
                                                    {formatMoney(item.Unit_Price)}
                                                </td>
                                                <td>
                                                    {formatMoney(item.Subtotal)}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Sales;
