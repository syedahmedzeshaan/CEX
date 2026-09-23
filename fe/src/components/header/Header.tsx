import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { getAssets } from "../../services/api";

import type { Asset } from "../../types/asset";

import "./Header.css";

type Props = {
    symbol: string;
    onSymbolChange: (symbol: string) => void;
};

export default function Header({
    symbol,
    onSymbolChange
}: Props) {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAssets() {
            try {
                const data = await getAssets();
                setAssets(data);
            } catch (error) {
                console.error("Failed to load assets:", error);
            } finally {
                setLoading(false);
            }
        }

        loadAssets();
    }, []);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <header className="header">
            <div className="header-left">
                <h1>CEX</h1>
            </div>

            <div className="market-selector">
                <select
                    value={symbol}
                    onChange={event =>
                        onSymbolChange(event.target.value)
                    }
                    disabled={loading}
                >
                    {loading ? (
                        <option value={symbol}>
                            Loading...
                        </option>
                    ) : (
                        assets.map(asset => (
                            <option
                                key={asset.id}
                                value={asset.symbol}
                            >
                                {asset.symbol}/USD
                            </option>
                        ))
                    )}
                </select>
            </div>

            <nav className="header-right">
                <NavLink to="/">
                    Trade
                </NavLink>

                {isAuthenticated && (
                    <>
                        <NavLink to="/orders">
                            Orders
                        </NavLink>

                        <NavLink to="/account">
                            Account
                        </NavLink>

                        <button
                            type="button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </>
                )}

                {!isAuthenticated && (
                    <>
                        <NavLink to="/login">
                            Sign In
                        </NavLink>

                        <NavLink to="/signup">
                            Sign Up
                        </NavLink>
                    </>
                )}
            </nav>
        </header>
    );
}