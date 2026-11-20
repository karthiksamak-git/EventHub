import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Start in the loading state only when a session token exists, so a signed-out
    // visitor never renders an unnecessary spinner.
    const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        authAPI.getMe()
            .then(res => setUser(res.data.user))
            .catch(() => localStorage.removeItem('token'))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const res = await authAPI.login({ email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return res.data.user;
    };

    const register = async (data) => {
        const res = await authAPI.register(data);
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuth: !!user,
            login,
            register,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
