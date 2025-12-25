import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { getCurrentUser, logout as apiLogout } from '../utils/api';

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(() => getCurrentUser());
    const [loading] = useState(false);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        apiLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
