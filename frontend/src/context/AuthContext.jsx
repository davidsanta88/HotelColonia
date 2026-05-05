import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [hotelConfig, setHotelConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/hotel-config');
                setHotelConfig(res.data);
                if (res.data?.nombre) {
                    document.title = res.data.nombre;
                }
                if (res.data?.logo) {
                    let link = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.head.appendChild(link);
                    }
                    link.href = res.data.logo;
                }
            } catch (err) {
                console.error("Error al cargar config global:", err);
            }
        };
        fetchConfig();

        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                const decoded = jwtDecode(token);
                // Check basically expiration
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                    setLoading(false);
                } else {
                    const savedUser = JSON.parse(userData);
                    setUser(savedUser); // Set immediately to prevent PrivateRoute redirect
                    
                    api.get('/auth/me').then(res => {
                        const updatedUser = { ...savedUser, ...res.data };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        setUser(updatedUser);
                    }).catch(e => {
                        console.error("Refresh token error", e);
                        // Keep savedUser if refresh fails but token is not expired
                    }).finally(() => {
                        setLoading(false);
                    });
                }
            } catch (err) {
                logout();
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const data = response.data;
        
        localStorage.setItem('token', data.accessToken);
        
        const userInfo = {
            id: data.id,
            nombre: data.nombre,
            email: data.email,
            rol_id: data.rol_id,
            rol_nombre: data.rol_nombre, 
            permisos: data.permisos
        };

        
        localStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
        return userInfo;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, hotelConfig, setHotelConfig }}>
            {children}
        </AuthContext.Provider>
    );
};
