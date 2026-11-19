
import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function Packaging() {
    const [fruits, setFruits] = useState([]);
    const [capacities, setCapacities] = useState([]);
    const [history, setHistory] = useState([]);

    const [fruitId, setFruitId] = useState("");
    const [packageSize, setPackageSize] = useState("SMALL");
    const [packagesProduced, setPackagesProduced] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // LOAD PACKAGING INFORMATION
    const loadPackagingData = async () => {
        try {
            const data = await apiRequest("/packaging");
            const historyData = await apiRequest("/packaging/history");

            setFruits(data.fruits || []);
            setCapacities(data.capacities || []);
            setHistory(Array.isArray(historyData) ? historyData : []);

        } catch (err) {
            setError(err.message || "Failed to load packaging information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPackagingData();
    }, []);

    // SELECTED FRUIT
    const selectedFruit = fruits.find(
        fruit => Number(fruit.Fruit_ID) === Number(fruitId)
    );

    // AVAILABLE RAW STOCK
    const rawStock = Number(selectedFruit?.Raw_Stock || 0);

    // SELECTED PACKAGING CAPACITY
    const selectedCapacity = capacities.find(
        item =>
            Number(item.Fruit_ID) === Number(fruitId) &&
            item.Package_Size === packageSize
    );

    const fruitsPerPackage = Number(
        selectedCapacity?.Fruits_Per_Package || 0
    );

    // CALCULATE FRUIT REQUIRED
    const totalFruitsRequired =
        Number(packagesProduced || 0) * fruitsPerPackage;

    const remainingFruit = rawStock - totalFruitsRequired;

    // SAVE PACKAGING
    const handlePackaging = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!fruitId || !packagesProduced) {
            setError("Please select a fruit and enter the package quantity.");
            return;
        }

        if (
            !Number.isInteger(Number(packagesProduced)) ||
            Number(packagesProduced) <= 0
        ) {
            setError("Package quantity must be a positive whole number.");
            return;
        }

        if (totalFruitsRequired > rawStock) {
            setError("Not enough raw fruit available for this packaging.");
            return;
        }

        try {
            setSaving(true);

            const result = await apiRequest("/packaging", {
                method: "POST",
                body: JSON.stringify({
                    Fruit_ID: Number(fruitId),
                    Package_Size: packageSize,
                    Packages_Produced: Number(packagesProduced)
                })
            });

            setMessage(result.message || "Packaging completed successfully!");

            setPackagesProduced("");

            await loadPackagingData();

        } catch (err) {
            setError(err.message || "Packaging failed.");
        } finally {
            setSaving(false);
        }
    };

    // LOADING SCREEN
    if (loading) {
        return (
            <div className="page-container packaging-page">
                <p>Loading packaging information...</p>
            </div>
        );
    }

    return (
        <div className="page-container packaging-page">

            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h1>📦 Packaging Management</h1>
                    <p>
                        Convert raw fruits into ready-to-sell packages.
                    </p>
                </div>
            </div>

            {/* MESSAGES */}
            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="dashboard-grid">

                <div className="dashboard-card">
                    <h3>🍎 Available Fruits</h3>
                    <h2>{fruits.length}</h2>
                </div>

                <div className="dashboard-card">
                    <h3>📦 Packaging Records</h3>
                    <h2>{history.length}</h2>
                </div>

                <div className="dashboard-card">
                    <h3>🌱 Total Raw Stock</h3>
                    <h2>
                        {fruits.reduce(
                            (total, fruit) =>
                                total + Number(fruit.Raw_Stock || 0),
                            0
                        )}
                    </h2>
                </div>

            </div>

            {/* PACKAGING FORM */}
            <div className="content-card">

                <h2>Produce Packages</h2>

                <form onSubmit={handlePackaging}>

                    <div className="form-group">
                        <label>Select Fruit</label>

                        <select
                            value={fruitId}
                            onChange={(e) => setFruitId(e.target.value)}
                            required
                        >
                            <option value="">Choose a fruit</option>

                            {fruits.map(fruit => (
                                <option
                                    key={fruit.Fruit_ID}
                                    value={fruit.Fruit_ID}
                                >
                                    {fruit.Fruit_Name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* RAW STOCK */}
                    <div className="stock-information">
                        <strong>Available Raw Fruit:</strong>
                        <span>{rawStock} units</span>
                    </div>

                    <div className="form-group">
                        <label>Package Size</label>

                        <select
                            value={packageSize}
                            onChange={(e) => setPackageSize(e.target.value)}
                            required
                        >
                            <option value="SMALL">Small</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LARGE">Large</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Number of Packages to Produce</label>

                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={packagesProduced}
                            onChange={(e) => setPackagesProduced(e.target.value)}
                            placeholder="Enter package quantity"
                            required
                        />
                    </div>

                    {/* PACKAGING CALCULATION */}
                    <div className="packaging-summary">

                        <h3>Packaging Calculation</h3>

                        <p>
                            Fruit per package:
                            <strong>
                                {fruitsPerPackage} units
                            </strong>
                        </p>

                        <p>
                            Total fruit required:
                            <strong>
                                {totalFruitsRequired} units
                            </strong>
                        </p>

                        <p>
                            Remaining raw fruit:
                            <strong>
                                {remainingFruit >= 0 ? remainingFruit : 0} units
                            </strong>
                        </p>

                    </div>

                    <button
                        type="submit"
                        disabled={
                            saving ||
                            !fruitId ||
                            !packagesProduced ||
                            totalFruitsRequired > rawStock ||
                            !fruitsPerPackage
                        }
                    >
                        {saving ? "Processing..." : "Complete Packaging"}
                    </button>

                </form>

            </div>

            {/* PACKAGING HISTORY */}
            <div className="content-card">

                <h2>Packaging History</h2>

                <div className="table-container">

                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Fruit</th>
                                <th>Package Size</th>
                                <th>Packages Produced</th>
                                <th>Fruit Used</th>
                                <th>Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {history.length > 0 ? (
                                history.map(record => (
                                    <tr key={record.Packaging_ID}>
                                        <td>{record.Packaging_ID}</td>
                                        <td>{record.Fruit_Name}</td>
                                        <td>{record.Package_Size}</td>
                                        <td>{record.Packages_Produced}</td>
                                        <td>{record.Fruits_Used}</td>
                                        <td>
                                            {new Date(
                                                record.Packaging_Date
                                            ).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">
                                        No packaging records available yet.
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

export default Packaging;
