import { useState } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";

import { login } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./Login.css";

export default function Login() {
    const navigate = useNavigate();
    const { login: authenticate } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        event: React.FormEvent
    ) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await login(
                username,
                password
            );

            authenticate(response.token);

            navigate("/");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Login failed"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-page">
            <div className="login-card">
                <h2>Sign In</h2>

                <form onSubmit={handleSubmit}>
                    <label>
                        Username

                        <input
                            type="text"
                            value={username}
                            onChange={event =>
                                setUsername(
                                    event.target.value
                                )
                            }
                            autoComplete="username"
                        />
                    </label>

                    <label>
                        Password

                        <input
                            type="password"
                            value={password}
                            onChange={event =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            autoComplete="current-password"
                        />
                    </label>

                    {error && (
                        <p className="auth-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing In..."
                            : "Sign In"}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account?{" "}
                    <Link to="/signup">
                        Sign Up
                    </Link>
                </p>
            </div>
        </main>
    );
}