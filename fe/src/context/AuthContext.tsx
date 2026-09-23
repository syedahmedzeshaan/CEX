import {
    createContext,
    useContext,
    useState
} from "react";

type AuthContextType = {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
};

const AuthContext =
    createContext<AuthContextType | null>(null);

export function AuthProvider({
    children
}: {
    children: React.ReactNode;
}) {
    const [isAuthenticated, setIsAuthenticated] =
        useState(
            () => !!localStorage.getItem("token")
        );

    function login(token: string) {
        localStorage.setItem("token", token);
        setIsAuthenticated(true);
    }

    function logout() {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}