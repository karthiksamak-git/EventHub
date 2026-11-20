import { createContext, useContext } from 'react';

// Kept in its own module so the provider component file only exports components
// (required for React Fast Refresh) and hooks stay importable anywhere.
export const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
