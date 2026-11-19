
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "./api";

function Purchases() {
  const [suppliers, setSuppliers] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Prevent rapid duplicate submissions
  const submitting = useRef(false);

  const [formData, setFormData] = useState({
    Supplier_ID: "",
    Purchase_Date: new Date().toISOString().split("T")[0],
    Payment_Method: "CASH",
    Payment_Status: "PAID"
  });

  const [items, setItems] = useState([
    {
      Fruit_ID: "",
      Crate_Quantity: "",
      Unit_Cost_Per_Crate: ""
    }
  ]);

  // LOAD SUPPLIERS, FRUITS AND PURCHASES
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [supplierData, fruitData, purchaseData] =
        await Promise.all([
          apiRequest("/suppliers"),
          apiRequest("/fruits"),
          apiRequest("/purchases")
        ]);

      setSuppliers(supplierData.suppliers || []);
      setFruits(fruitData.fruits || []);

      // Backend returns purchases as a direct array
      setPurchases(
        Array.isArray(purchaseData)
          ? purchaseData
          : purchaseData.purchases || []
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // UPDATE PURCHASE INFORMATION
  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // UPDATE ITEM INFORMATION
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;

    // Prevent selecting the same fruit twice
    if (name === "Fruit_ID" && value !== "") {
      const alreadySelected = items.some(
        (item, i) =>
          i !== index && item.Fruit_ID === value
      );

      if (alreadySelected) {
        setError("Each fruit can only be added once. Update its existing row instead.");
        return;
      }
    }

    setError("");

    const updatedItems = [...items];

    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value
    };

    setItems(updatedItems);
  };

  // ADD ANOTHER FRUIT
  const addItem = () => {
    setItems([
      ...items,
      {
        Fruit_ID: "",
        Crate_Quantity: "",
        Unit_Cost_Per_Crate: ""
      }
    ]);
  };

  // REMOVE AN ITEM
  const removeItem = (index) => {
    if (items.length === 1) return;

    setItems(items.filter((_, i) => i !== index));
    setError("");
  };

  // CALCULATE TOTAL PURCHASE AMOUNT
  const totalAmount = items.reduce((total, item) => {
    return total +
      (
        Number(item.Crate_Quantity || 0) *
        Number(item.Unit_Cost_Per_Crate || 0)
      );
  }, 0);

  // FORMAT MONEY
  const formatMoney = (amount) => {
    return `M ${Number(amount || 0).toLocaleString("en-LS", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // SAVE PURCHASE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting.current) return;

    setError("");
    setSuccess("");

    if (!formData.Supplier_ID) {
      setError("Please select a supplier.");
      return;
    }

    const invalidItem = items.some((item) =>
      !item.Fruit_ID ||
      !item.Crate_Quantity ||
      !Number.isInteger(Number(item.Crate_Quantity)) ||
      Number(item.Crate_Quantity) <= 0 ||
      item.Unit_Cost_Per_Crate === "" ||
      !Number.isFinite(Number(item.Unit_Cost_Per_Crate)) ||
      Number(item.Unit_Cost_Per_Crate) < 0
    );

    if (invalidItem) {
      setError(
        "Please select a fruit, enter a valid crate quantity and cost per crate."
      );
      return;
    }

    const selectedFruitIds = items.map(
      (item) => item.Fruit_ID
    );

    if (new Set(selectedFruitIds).size !== selectedFruitIds.length) {
      setError("Please remove duplicate fruit entries.");
      return;
    }

    try {
      submitting.current = true;
      setSaving(true);

      const purchaseItems = items.map((item) => ({
        Fruit_ID: Number(item.Fruit_ID),
        Crate_Quantity: Number(item.Crate_Quantity),
        Unit_Cost_Per_Crate: Number(item.Unit_Cost_Per_Crate)
      }));

      await apiRequest("/purchases", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          Supplier_ID: Number(formData.Supplier_ID),
          Total_Amount: totalAmount,
          items: purchaseItems
        })
      });

      setSuccess(
        "Purchase recorded successfully! Raw fruit stock has been updated."
      );

      setFormData({
        Supplier_ID: "",
        Purchase_Date: new Date().toISOString().split("T")[0],
        Payment_Method: "CASH",
        Payment_Status: "PAID"
      });

      setItems([
        {
          Fruit_ID: "",
          Crate_Quantity: "",
          Unit_Cost_Per_Crate: ""
        }
      ]);

      await loadData();

    } catch (err) {
      setError(err.message);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="suppliers-page">

      <div className="page-heading">
        <div>
          <h2>Purchase Management</h2>
          <p>
            Purchase fruits in crates from registered suppliers
            and manage raw fruit inventory.
          </p>
        </div>
      </div>

      {/* PURCHASE SUMMARY */}
      <div className="supplier-summary">
        <div>
          <h2>{purchases.length}</h2>
          <p>Total Purchase Records</p>
        </div>

        <div>
          <h2>
            {formatMoney(
              purchases.reduce(
                (total, purchase) =>
                  total + Number(purchase.Total_Amount || 0),
                0
              )
            )}
          </h2>
          <p>Total Purchase Value</p>
        </div>
      </div>

      {/* NEW PURCHASE FORM */}
      <div className="content-card">
        <h3>Record New Purchase</h3>

        {error && (
          <p className="error-message">{error}</p>
        )}

        {success && (
          <p className="success-message">{success}</p>
        )}

        <form onSubmit={handleSubmit}>

          <div className="supplier-form">

            <div>
              <label>Supplier</label>

              <select
                name="Supplier_ID"
                value={formData.Supplier_ID}
                onChange={handleFormChange}
                required
              >
                <option value="">Select supplier</option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier.Supplier_ID}
                    value={supplier.Supplier_ID}
                  >
                    {supplier.Supplier_Name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Purchase Date</label>

              <input
                type="date"
                name="Purchase_Date"
                value={formData.Purchase_Date}
                onChange={handleFormChange}
                required
              />
            </div>

            <div>
              <label>Payment Method</label>

              <select
                name="Payment_Method"
                value={formData.Payment_Method}
                onChange={handleFormChange}
              >
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            <div>
              <label>Payment Status</label>

              <select
                name="Payment_Status"
                value={formData.Payment_Status}
                onChange={handleFormChange}
              >
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">
                  Partially Paid
                </option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

          </div>

          {/* PURCHASE ITEMS */}
          <div className="card-heading">
            <h3>Fruit Crates</h3>

            <button
              type="button"
              className="primary-button"
              onClick={addItem}
            >
              + Add Fruit
            </button>
          </div>

          <p style={{ color: "#64748b", marginBottom: "15px" }}>
            Enter the number of crates purchased and the cost
            of each crate. The system calculates the fruit
            quantities using the configured crate capacities.
          </p>

          {items.map((item, index) => (
            <div
              key={index}
              className="content-card"
              style={{ marginBottom: "15px" }}
            >

              <div className="card-heading">
                <h4>Fruit Item {index + 1}</h4>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  Remove
                </button>
              </div>

              <div className="supplier-form">

                <div>
                  <label>Fruit</label>

                  <select
                    name="Fruit_ID"
                    value={item.Fruit_ID}
                    onChange={(e) =>
                      handleItemChange(index, e)
                    }
                    required
                  >
                    <option value="">Select fruit</option>

                    {fruits.map((fruit) => (
                      <option
                        key={fruit.Fruit_ID}
                        value={fruit.Fruit_ID}
                        disabled={items.some(
                          (selectedItem, i) =>
                            i !== index &&
                            selectedItem.Fruit_ID === String(fruit.Fruit_ID)
                        )}
                      >
                        {fruit.Fruit_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Number of Crates</label>

                  <input
                    type="number"
                    name="Crate_Quantity"
                    min="1"
                    step="1"
                    value={item.Crate_Quantity}
                    onChange={(e) =>
                      handleItemChange(index, e)
                    }
                    placeholder="Enter crates"
                    required
                  />
                </div>

                <div>
                  <label>Cost Per Crate (M)</label>

                  <input
                    type="number"
                    name="Unit_Cost_Per_Crate"
                    min="0"
                    step="0.01"
                    value={item.Unit_Cost_Per_Crate}
                    onChange={(e) =>
                      handleItemChange(index, e)
                    }
                    placeholder="Enter crate cost"
                    required
                  />
                </div>

              </div>

              <p style={{
                textAlign: "right",
                marginTop: "15px",
                fontWeight: "bold"
              }}>
                Subtotal: {formatMoney(
                  Number(item.Crate_Quantity || 0) *
                  Number(item.Unit_Cost_Per_Crate || 0)
                )}
              </p>

            </div>
          ))}

          {/* TOTAL */}
          <div className="content-card">

            <div className="card-heading">
              <h3>Total Purchase Amount</h3>

              <h2>{formatMoney(totalAmount)}</h2>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? "Saving Purchase..." : "Save Purchase"}
            </button>

          </div>

        </form>
      </div>

      {/* PURCHASE HISTORY */}
      <div className="content-card supplier-table-card">

        <div className="card-heading">
          <h3>Purchase History</h3>
          <span>{purchases.length} records</span>
        </div>

        {loading ? (
          <p>Loading purchase records...</p>
        ) : (
          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase.Purchase_ID}>
                    <td>#{purchase.Purchase_ID}</td>

                    <td>
                      {new Date(
                        purchase.Purchase_Date
                      ).toLocaleDateString("en-GB")}
                    </td>

                    <td>
                      {purchase.Supplier_Name ||
                        `Supplier #${purchase.Supplier_ID}`}
                    </td>

                    <td>
                      {formatMoney(purchase.Total_Amount)}
                    </td>

                    <td>{purchase.Payment_Method}</td>

                    <td>{purchase.Payment_Status}</td>
                  </tr>
                ))}

                {purchases.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      No purchase records found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Purchases;
