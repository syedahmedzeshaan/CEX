import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../../services/api";
import "./Signup.css";

export default function Signup() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        event: React.FormEvent
    ) {
        event.preventDefault();

        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await signup(username, password);
            navigate("/login");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Signup failed"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="signup-page">
            <div className="signup-card">
                <h2>Create Account</h2>

                <form onSubmit={handleSubmit}>
                    <label>
                        Username
                        <input
                            type="text"
                            value={username}
                            onChange={event =>
                                setUsername(event.target.value)
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
                                setPassword(event.target.value)
                            }
                            autoComplete="new-password"
                        />
                    </label>

                    <label>
                        Confirm Password
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={event =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            autoComplete="new-password"
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
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to="/login">
                        Sign In
                    </Link>
                </p>
            </div>
        </main>
    );
}