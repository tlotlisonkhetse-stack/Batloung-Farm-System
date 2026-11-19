import { useEffect, useState } from "react";
import { apiRequest } from "./api";

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const [formData, setFormData] = useState({
    Vendor_Name: "",
    Phone: "",
    Address: "",
    Email: ""
  });

  // LOAD VENDORS
  const loadVendors = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/vendors");
      setVendors(data.vendors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  // HANDLE INPUTS
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // OPEN ADD FORM
  const openAddForm = () => {
    setEditingVendor(null);

    setFormData({
      Vendor_Name: "",
      Phone: "",
      Address: "",
      Email: ""
    });

    setShowForm(true);
  };

  // OPEN EDIT FORM
  const handleEdit = (vendor) => {
    setEditingVendor(vendor);

    setFormData({
      Vendor_Name: vendor.Vendor_Name,
      Phone: vendor.Phone,
      Address: vendor.Address || "",
      Email: vendor.Email || ""
    });

    setShowForm(true);
  };

  // SAVE VENDOR
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingVendor) {
        await apiRequest(`/vendors/${editingVendor.Vendor_ID}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });

        alert("Vendor updated successfully!");
      } else {
        await apiRequest("/vendors", {
          method: "POST",
          body: JSON.stringify(formData)
        });

        alert("Vendor added successfully!");
      }

      setShowForm(false);
      setEditingVendor(null);

      await loadVendors();
    } catch (err) {
      setError(err.message);
    }
  };

  // DELETE VENDOR
  const handleDelete = async (vendor) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${vendor.Vendor_Name}?`
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/vendors/${vendor.Vendor_ID}`, {
        method: "DELETE"
      });

      alert("Vendor deleted successfully!");
      await loadVendors();
    } catch (err) {
      setError(err.message);
    }
  };

  // SEARCH VENDORS
  const filteredVendors = vendors.filter((vendor) =>
    (vendor.Vendor_Name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="suppliers-page vendors-page">

      {/* PAGE HEADING */}
      <div className="page-heading">
        <div>
          <h2>Vendor Management</h2>
          <p>Manage customers who purchase fruits from Batloung Farm.</p>
        </div>

        <button className="primary-button" onClick={openAddForm}>
          + Add Vendor
        </button>
      </div>

      {/* VENDOR SUMMARY */}
      <div className="supplier-summary">
        <div>
          <h2>{vendors.length}</h2>
          <p>Total Registered Vendors</p>
        </div>

        <div>
          <h2>{filteredVendors.length}</h2>
          <p>Matching Vendors</p>
        </div>
      </div>

      {/* ADD / EDIT FORM */}
      {showForm && (
        <div className="content-card">
          <h3>{editingVendor ? "Edit Vendor" : "Register New Vendor"}</h3>

          <form className="supplier-form" onSubmit={handleSubmit}>
            <div>
              <label>Vendor Name</label>
              <input
                type="text"
                name="Vendor_Name"
                value={formData.Vendor_Name}
                onChange={handleChange}
                placeholder="Enter vendor name"
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
                placeholder="Enter vendor address"
              />
            </div>

            <div>
              <label>Email Address</label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>

            <div className="supplier-form-actions">
              <button type="submit" className="primary-button">
                {editingVendor ? "Update Vendor" : "Save Vendor"}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowForm(false);
                  setEditingVendor(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REGISTERED VENDORS TABLE */}
      <div className="content-card supplier-table-card">
        <div className="card-heading">
          <h3>Registered Vendors</h3>

          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p>Loading vendors...</p>}

        {error && <p className="error-message">{error}</p>}

        {!loading && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vendor Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.Vendor_ID}>
                    <td>#{vendor.Vendor_ID}</td>
                    <td>{vendor.Vendor_Name}</td>
                    <td>{vendor.Phone}</td>
                    <td>{vendor.Address || "Not provided"}</td>
                    <td>{vendor.Email || "Not provided"}</td>

                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(vendor)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(vendor)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan="6">No vendors found.</td>
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

export default Vendors;
