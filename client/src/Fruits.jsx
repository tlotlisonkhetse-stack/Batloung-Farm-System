
import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function Fruits() {
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingFruit, setEditingFruit] = useState(null);

  const [formData, setFormData] = useState({
    Fruit_Name: "",
    Description: "",
    Status: "ACTIVE"
  });

  const loadFruits = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/fruits");
      setFruits(data.fruits || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFruits();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openAddForm = () => {
    setEditingFruit(null);

    setFormData({
      Fruit_Name: "",
      Description: "",
      Status: "ACTIVE"
    });

    setShowForm(true);
  };

  const handleEdit = (fruit) => {
    setEditingFruit(fruit);

    setFormData({
      Fruit_Name: fruit.Fruit_Name,
      Description: fruit.Description || "",
      Status: fruit.Status === "INACTIVE" ? "INACTIVE" : "ACTIVE"
    });

    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingFruit) {
        await apiRequest(`/fruits/${editingFruit.Fruit_ID}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });

        alert("Fruit updated successfully!");
      } else {
        await apiRequest("/fruits", {
          method: "POST",
          body: JSON.stringify(formData)
        });

        alert("Fruit added successfully!");
      }

      setShowForm(false);
      setEditingFruit(null);

      setFormData({
        Fruit_Name: "",
        Description: "",
        Status: "ACTIVE"
      });

      await loadFruits();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (fruit) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${fruit.Fruit_Name}?`
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/fruits/${fruit.Fruit_ID}`, {
        method: "DELETE"
      });

      alert("Fruit deleted successfully!");
      await loadFruits();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredFruits = fruits.filter((fruit) =>
    fruit.Fruit_Name.toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = fruits.filter(
    (fruit) => fruit.Status === "ACTIVE"
  ).length;

  return (
    <div className="suppliers-page">
      <div className="page-heading">
        <div>
          <h2>Fruit Management</h2>
          <p>Manage the fruits distributed by Batloung Farm.</p>
        </div>

        <button className="primary-button" onClick={openAddForm}>
          + Add Fruit
        </button>
      </div>

      <div className="supplier-summary">
        <div>
          <h2>{fruits.length}</h2>
          <p>Total Registered Fruits</p>
        </div>

        <div>
          <h2>{availableCount}</h2>
          <p>Available Fruits</p>
        </div>
      </div>

      {showForm && (
        <div className="content-card">
          <h3>{editingFruit ? "Edit Fruit" : "Add New Fruit"}</h3>

          <form className="supplier-form" onSubmit={handleSubmit}>
            <div>
              <label>Fruit Name</label>
              <input
                type="text"
                name="Fruit_Name"
                value={formData.Fruit_Name}
                onChange={handleChange}
                placeholder="Enter fruit name"
                required
              />
            </div>

            <div>
              <label>Description</label>
              <input
                type="text"
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                placeholder="Enter fruit description"
              />
            </div>

            {editingFruit && (
              <div>
                <label>Availability</label>
                <select
                  name="Status"
                  value={formData.Status}
                  onChange={handleChange}
                >
                  <option value="ACTIVE">Available</option>
                  <option value="INACTIVE">Unavailable</option>
                </select>
              </div>
            )}

            <div className="supplier-form-actions">
              <button type="submit" className="primary-button">
                {editingFruit ? "Update Fruit" : "Save Fruit"}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowForm(false);
                  setEditingFruit(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="content-card supplier-table-card">
        <div className="card-heading">
          <h3>Registered Fruits</h3>

          <input
            type="text"
            placeholder="Search fruits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p>Loading fruits...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fruit Name</th>
                  <th>Description</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredFruits.map((fruit) => (
                  <tr key={fruit.Fruit_ID}>
                    <td>#{fruit.Fruit_ID}</td>
                    <td>{fruit.Fruit_Name}</td>
                    <td>{fruit.Description || "Not provided"}</td>

                    <td>
                      <span
                        className={
                          fruit.Status === "ACTIVE"
                            ? "status-available"
                            : "status-unavailable"
                        }
                      >
                        {fruit.Status === "ACTIVE"
                          ? "Available"
                          : "Unavailable"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(fruit)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(fruit)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredFruits.length === 0 && (
                  <tr>
                    <td colSpan="5">No fruits found.</td>
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

export default Fruits;
