
import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [formData, setFormData] = useState({
    Supplier_Name: "",
    Phone: "",
    Address: ""
  });

  // LOAD SUPPLIERS
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/suppliers");
      setSuppliers(data.suppliers);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // HANDLE FORM INPUTS
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // OPEN FORM FOR ADDING
  const openAddForm = () => {
    setEditingSupplier(null);

    setFormData({
      Supplier_Name: "",
      Phone: "",
      Address: ""
    });

    setShowForm(true);
  };

  // OPEN FORM FOR EDITING
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);

    setFormData({
      Supplier_Name: supplier.Supplier_Name,
      Phone: supplier.Phone,
      Address: supplier.Address || ""
    });

    setShowForm(true);
  };

  // SAVE NEW OR UPDATED SUPPLIER
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingSupplier) {
        await apiRequest(`/suppliers/${editingSupplier.Supplier_ID}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });

        alert("Supplier updated successfully!");

      } else {
        await apiRequest("/suppliers", {
          method: "POST",
          body: JSON.stringify(formData)
        });

        alert("Supplier added successfully!");
      }

      setFormData({
        Supplier_Name: "",
        Phone: "",
        Address: ""
      });

      setEditingSupplier(null);
      setShowForm(false);

      await loadSuppliers();

    } catch (err) {
      setError(err.message);
    }
  };

  // DELETE SUPPLIER
  const handleDelete = async (supplier) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${supplier.Supplier_Name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/suppliers/${supplier.Supplier_ID}`, {
        method: "DELETE"
      });

      alert("Supplier deleted successfully!");

      await loadSuppliers();

    } catch (err) {
      setError(err.message);
    }
  };

  // SEARCH SUPPLIERS
  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.Supplier_Name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="suppliers-page">

      {/* PAGE HEADING */}
      <div className="page-heading">
        <div>
          <h2>Supplier Management</h2>
          <p>
            Manage your farm suppliers and their contact information.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Supplier
        </button>
      </div>


      {/* ADD OR EDIT FORM */}
      {showForm && (
        <div className="content-card">

          <h3>
            {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
          </h3>

          <form className="supplier-form" onSubmit={handleSubmit}>

            <div>
              <label>Supplier Name</label>

              <input
                type="text"
                name="Supplier_Name"
                value={formData.Supplier_Name}
                onChange={handleChange}
                placeholder="Enter supplier name"
                required
              />
            </div>

            <div>
              <label>Phone Number</label>

              <input
                type="tel"
                name="Phone"
                value={formData.Phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div>
              <label>Address</label>

              <input
                type="text"
                name="Address"
                value={formData.Address}
                onChange={handleChange}
                placeholder="Enter supplier address"
              />
            </div>

            <div className="supplier-form-actions">

              <button
                type="submit"
                className="primary-button"
              >
                {editingSupplier ? "Update Supplier" : "Save Supplier"}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSupplier(null);
                }}
              >
                Cancel
              </button>

            </div>

          </form>
        </div>
      )}


      {/* SUPPLIER SUMMARY */}
      <div className="supplier-summary">

        <div>
          <h2>{suppliers.length}</h2>
          <p>Registered Suppliers</p>
        </div>

        <div>
          <h2>🇱🇸</h2>
          <p>Lesotho Suppliers</p>
        </div>

      </div>


      {/* SUPPLIER TABLE */}
      <div className="content-card supplier-table-card">

        <div className="card-heading">
          <h3>Registered Suppliers</h3>

          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p>Loading suppliers...</p>}

        {error && (
          <p className="error-message">{error}</p>
        )}

        {!loading && (
          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.Supplier_ID}>

                    <td>#{supplier.Supplier_ID}</td>
                    <td>{supplier.Supplier_Name}</td>
                    <td>{supplier.Phone}</td>
                    <td>{supplier.Address || "Not provided"}</td>

                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(supplier)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(supplier)}
                      >
                        Delete
                      </button>
                    </td>

                  </tr>
                ))}

                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan="5">No suppliers found.</td>
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

export default Suppliers;
