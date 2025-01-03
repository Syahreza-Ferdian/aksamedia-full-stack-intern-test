import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { getFromLocalStorage, removeFromLocalStorage, saveToLocalStorage } from "../Helper/localStorageHelper";

const AuthContext = createContext();

const api = axios.create({
    baseURL: "https://aksamedia-syahreza-be-test.vercel.app/api/api",
    headers: {
        "Content-Type": "application/json",
    },
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [authMessage, setAuthMessage] = useState("");

    useEffect(() => {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        } else {
            localStorage.removeItem("user");
        }
    }, [user]);

    const login = async (username, password) => {
        try {
            const response = await api.post("/login", { username, password });

            if (response.data.status === "success") {
                const { token, admin } = response.data.data;
                const userData = { username, admin, name: "Admin"};

                saveToLocalStorage("token", token);
                
                setUser(userData);
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                setAuthMessage("");
                return true;
            } else {
                setAuthMessage(response.data.message || "Login failed.");
                return false;
            }
        } catch (error) {
            setAuthMessage(error.response?.data?.message || "An unexpected error occurred.");
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        removeFromLocalStorage("user");
        removeFromLocalStorage("token");

        delete api.defaults.headers.common["Authorization"];
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, authMessage }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};