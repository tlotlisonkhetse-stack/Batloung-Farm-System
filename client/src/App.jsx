
import { useEffect, useState } from "react";
import "./App.css";
import { apiRequest } from "./api";

import Suppliers from "./Suppliers";
import Fruits from "./Fruits";
import Vendors from "./Vendors";
import Purchases from "./Purchases";
import Sales from "./Sales";
import Stock from "./Stock";
import Pricing from "./Pricing";
import Packaging from "./Packaging";
import Payments from "./Payments";
import Reports from "./Reports";

function App() {
    const [activePage, setActivePage] = useState("Dashboard");
    const [searchTerm, setSearchTerm] = useState("");

    const [dashboard, setDashboard] = useState({
        totalSales: 0,
        totalPurchases: 0,
        stockItems: 0,
        outstanding: 0
    });

    const menuItems = [
        { name: "Dashboard", icon: "📊", group: "Overview" },
        { name: "Suppliers", icon: "🚜", group: "Management" },
        { name: "Fruits", icon: "🍎", group: "Management" },
        { name: "Vendors", icon: "👥", group: "Management" },
        { name: "Purchases", icon: "🛒", group: "Operations" },
        { name: "Sales", icon: "💰", group: "Operations" },
        { name: "Stock", icon: "📦", group: "Operations" },
        { name: "Packaging", icon: "🌱", group: "Operations" },
        { name: "Packaging Prices", icon: "🏷️", group: "Management" },
        { name: "Payments", icon: "💳", group: "Finance" },
        { name: "Reports", icon: "📈", group: "Finance" }
    ];

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const results = await Promise.allSettled([
                apiRequest("/reports/sales"),
                apiRequest("/reports/purchases"),
                apiRequest("/stock"),
                apiRequest("/payments/outstanding")
            ]);

            const salesData =
                results[0].status === "fulfilled"
                    ? results[0].value
                    : {};

            const purchasesData =
                results[1].status === "fulfilled"
                    ? results[1].value
                    : {};

            const stockData =
                results[2].status === "fulfilled"
                    ? results[2].value
                    : {};

            const outstandingData =
                results[3].status === "fulfilled"
                    ? results[3].value
                    : {};

            const sales = Number(
                salesData.report?.Total_Revenue || 0
            );

            const purchases = Number(
                purchasesData.report?.Total_Purchase_Cost || 0
            );

            const stockRecords = Array.isArray(stockData)
                ? stockData
                : stockData.stock || stockData.stockReport || [];

            const totalStock = stockRecords.reduce(
                (total, item) =>
                    total + Number(item.Quantity_Available || 0),
                0
            );

            const outstandingRecords = Array.isArray(outstandingData)
                ? outstandingData
                : outstandingData.outstandingBalances ||
                  outstandingData.outstanding ||
                  [];

            const totalOutstanding = outstandingRecords.reduce(
                (total, item) =>
                    total + Number(item.Outstanding_Balance || 0),
                0
            );

            setDashboard({
                totalSales: sales,
                totalPurchases: purchases,
                stockItems: totalStock,
                outstanding: totalOutstanding
            });
        } catch (error) {
            console.error("Dashboard loading error:", error);
        }
    };

    const navigateTo = (page) => {
        setActivePage(page);
        setSearchTerm("");
    };

    const filteredMenuItems = menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatMoney = (amount) =>
        Number(amount || 0).toLocaleString("en-LS", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    const renderPage = () => {
        switch (activePage) {
            case "Suppliers":
                return <Suppliers />;

            case "Fruits":
                return <Fruits />;

            case "Vendors":
                return <Vendors />;

            case "Purchases":
                return <Purchases />;

            case "Sales":
                return <Sales />;

            case "Stock":
                return <Stock />;

            case "Packaging":
                return <Packaging />;

            case "Packaging Prices":
                return <Pricing />;

            case "Payments":
                return <Payments />;

            case "Reports":
                return <Reports />;

            case "Dashboard":
                return (
                    <div className="dashboard-content">

                        {/* WELCOME SECTION */}
                        <section className="welcome-banner">
                            <div className="welcome-text">
                                <span className="welcome-tag">
                                    🌿 FARM MANAGEMENT OVERVIEW
                                </span>

                                <h1>
                                    Welcome to Batloung Farm
                                </h1>

                                <p>
                                    Your farm operations, stock,
                                    purchases and sales — all
                                    managed in one place.
                                </p>

                                <p className="welcome-subtext">
                                    Growing and distributing fresh
                                    produce across Lesotho.
                                </p>
                            </div>

                            <div className="welcome-icon">
                                🌱
                            </div>
                        </section>

                        {/* SUMMARY CARDS */}
                        <section className="stats-grid">

                            <div className="stat-card sales-stat">
                                <div className="stat-top">
                                    <div className="stat-icon green">
                                        💰
                                    </div>
                                    <span className="stat-label">
                                        SALES
                                    </span>
                                </div>

                                <p>Total Sales</p>

                                <h2>
                                    M {formatMoney(
                                        dashboard.totalSales
                                    )}
                                </h2>

                                <small>Recorded sales revenue</small>
                            </div>

                            <div className="stat-card purchases-stat">
                                <div className="stat-top">
                                    <div className="stat-icon orange">
                                        🛒
                                    </div>
                                    <span className="stat-label">
                                        PURCHASES
                                    </span>
                                </div>

                                <p>Total Purchases</p>

                                <h2>
                                    M {formatMoney(
                                        dashboard.totalPurchases
                                    )}
                                </h2>

                                <small>Recorded purchase costs</small>
                            </div>

                            <div className="stat-card stock-stat">
                                <div className="stat-top">
                                    <div className="stat-icon blue">
                                        📦
                                    </div>
                                    <span className="stat-label">
                                        INVENTORY
                                    </span>
                                </div>

                                <p>Available Stock</p>

                                <h2>
                                    {dashboard.stockItems.toLocaleString()}
                                </h2>

                                <small>Packages currently in stock</small>
                            </div>

                            <div className="stat-card debt-stat">
                                <div className="stat-top">
                                    <div className="stat-icon red">
                                        💳
                                    </div>
                                    <span className="stat-label">
                                        OUTSTANDING
                                    </span>
                                </div>

                                <p>Outstanding Payments</p>

                                <h2>
                                    M {formatMoney(
                                        dashboard.outstanding
                                    )}
                                </h2>

                                <small>Unpaid vendor balances</small>
                            </div>

                        </section>

                        {/* DASHBOARD LOWER PANELS */}
                        <section className="dashboard-grid">

                            {/* FARM OVERVIEW */}
                            <div className="dashboard-card overview-card">
                                <div className="dashboard-card-heading">
                                    <div>
                                        <span className="section-eyebrow">
                                            YOUR BUSINESS
                                        </span>

                                        <h2>Farm Overview</h2>
                                    </div>

                                    <span className="overview-badge">
                                        🇱🇸 Lesotho
                                    </span>
                                </div>

                                <div className="farm-overview-content">
                                    <div className="overview-illustration">
                                        <span>🌳</span>
                                        <span>🍎</span>
                                        <span>🍊</span>
                                        <span>🍇</span>
                                        <span>🌿</span>
                                    </div>

                                    <h3>
                                        From fresh produce to
                                        packaged products
                                    </h3>

                                    <p>
                                        Track fruits purchased in crates,
                                        manage raw fruit stock, package
                                        your produce and monitor sales
                                        to vendors.
                                    </p>
                                </div>

                                <div className="overview-footer">
                                    <span>🌱</span>
                                    <p>
                                        Batloung Farm Distribution System
                                    </p>
                                </div>
                            </div>

                            {/* QUICK ACTIONS */}
                            <div className="dashboard-card actions-card">
                                <div className="dashboard-card-heading">
                                    <div>
                                        <span className="section-eyebrow">
                                            SHORTCUTS
                                        </span>

                                        <h2>Quick Actions</h2>
                                    </div>

                                    <span className="quick-action-icon">
                                        ⚡
                                    </span>
                                </div>

                                <div className="quick-actions">

                                    <button
                                        onClick={() =>
                                            navigateTo("Purchases")
                                        }
                                    >
                                        <span className="action-icon">
                                            🛒
                                        </span>

                                        <span className="action-text">
                                            <strong>
                                                Record Purchase
                                            </strong>
                                            <small>
                                                Add fruit crates
                                            </small>
                                        </span>

                                        <span className="action-arrow">
                                            →
                                        </span>
                                    </button>

                                    <button
                                        onClick={() =>
                                            navigateTo("Sales")
                                        }
                                    >
                                        <span className="action-icon">
                                            💰
                                        </span>

                                        <span className="action-text">
                                            <strong>
                                                Record Sale
                                            </strong>
                                            <small>
                                                Sell packaged fruits
                                            </small>
                                        </span>

                                        <span className="action-arrow">
                                            →
                                        </span>
                                    </button>

                                    <button
                                        onClick={() =>
                                            navigateTo("Packaging")
                                        }
                                    >
                                        <span className="action-icon">
                                            📦
                                        </span>

                                        <span className="action-text">
                                            <strong>
                                                Produce Packages
                                            </strong>
                                            <small>
                                                Package raw fruits
                                            </small>
                                        </span>

                                        <span className="action-arrow">
                                            →
                                        </span>
                                    </button>

                                    <button
                                        onClick={() =>
                                            navigateTo("Stock")
                                        }
                                    >
                                        <span className="action-icon">
                                            📋
                                        </span>

                                        <span className="action-text">
                                            <strong>
                                                View Inventory
                                            </strong>
                                            <small>
                                                Check available stock
                                            </small>
                                        </span>

                                        <span className="action-arrow">
                                            →
                                        </span>
                                    </button>

                                </div>
                            </div>

                        </section>

                        {/* BOTTOM INFORMATION STRIP */}
                        <section className="dashboard-footer-banner">
                            <span>🌿</span>

                            <div>
                                <strong>
                                    Growing together, delivering freshness.
                                </strong>

                                <p>
                                    Batloung Farm — Made for Lesotho 🇱🇸
                                </p>
                            </div>
                        </section>

                    </div>
                );

            default:
                return (
                    <div className="page-content">
                        <h1>{activePage} Management</h1>

                        <p>
                            The {activePage} section will be
                            connected to your database and API.
                        </p>

                        <div className="placeholder-icon">
                            🌱
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="app-container">

            {/* SIDEBAR */}
            <aside className="sidebar">

                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        🌱
                    </div>

                    <div className="sidebar-brand-text">
                        <h2>Batloung Farm</h2>
                        <p>Distribution System</p>
                    </div>
                </div>

                <div className="sidebar-menu">
                    <p className="menu-heading">
                        MAIN MENU
                    </p>

                    <nav>
                        {menuItems.map((item) => (
                            <button
                                key={item.name}
                                className={
                                    activePage === item.name
                                        ? "menu-item active"
                                        : "menu-item"
                                }
                                onClick={() =>
                                    navigateTo(item.name)
                                }
                            >
                                <span className="menu-icon">
                                    {item.icon}
                                </span>

                                <span className="menu-label">
                                    {item.name}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="sidebar-footer">
                    <div className="sidebar-country">
                        🇱🇸
                        <span>Made for Lesotho</span>
                    </div>

                    <small>
                        Batloung Farm © 2026
                    </small>
                </div>

            </aside>

            {/* MAIN AREA */}
            <main className="main-content">

                {/* TOP HEADER */}
                <header className="topbar">

                    <div className="topbar-title">
                        <span className="topbar-breadcrumb">
                            BATLOUNG FARM / {activePage.toUpperCase()}
                        </span>

                        <h3>{activePage}</h3>

                        <p>
                            Distribution & Inventory Management
                        </p>
                    </div>

                    <div className="topbar-right">

                        {/* MODULE SEARCH */}
                        <div className="module-search">
                            <span className="search-icon">
                                🔎
                            </span>

                            <input
                                type="text"
                                placeholder="Search modules..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                            />

                            {searchTerm.trim() !== "" && (
                                <div className="search-results">
                                    {filteredMenuItems.length > 0 ? (
                                        filteredMenuItems.map((item) => (
                                            <button
                                                key={item.name}
                                                onClick={() =>
                                                    navigateTo(item.name)
                                                }
                                            >
                                                <span>{item.icon}</span>
                                                {item.name}
                                            </button>
                                        ))
                                    ) : (
                                        <p>
                                            No modules found.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="topbar-profile">
                            <div className="profile-country">
                                🇱🇸
                                <span>Lesotho</span>
                            </div>

                            <div className="profile-divider"></div>

                            <div className="profile-avatar">
                                BF
                            </div>

                            <div className="profile-details">
                                <strong>
                                    Batloung Farm
                                </strong>

                                <small>
                                    Administrator
                                </small>
                            </div>

                        </div>
                    </div>

                </header>

                {/* PAGE CONTENT */}
                <div className="content-area">
                    {renderPage()}
                </div>

            </main>

        </div>
    );
}

export default App;
