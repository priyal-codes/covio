/* eslint-disable react/only-export-components */
import { createContext, useContext, useState } from "react";
import axios, { HttpStatusCode } from "axios";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "http://localhost:8000/api/v1/users"
});

export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);
    const [userData, setUserData] = useState(authContext);

    const handleRegister = async (name, username, password) => {
        const request = await client.post("/register", {
            name: name,
            username: username,
            password: password
        });
        if (request.status === HttpStatusCode.CREATED || request.status === 201) {
            return request.data.message;
        }
        return "User Registered successfully!";
    };

    const handleLogin = async (username, password) => {
        const request = await client.post("/login", {
            username: username,
            password: password
        });
        
        if (request.status === 200) {
            localStorage.setItem("token", request.data.token);
        }
    };

    const data = {
        userData, setUserData, handleRegister, handleLogin
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
