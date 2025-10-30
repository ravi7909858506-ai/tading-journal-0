import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';


const AppContent: React.FC = () => {
    const { user } = useAuth();
    
    if (user) {
        return <App />;
    }
    
    return <Login />;
};

const AppContainer: React.FC = () => {
  return (
    <AuthProvider>
        <ToastProvider>
            <AppContent />
            <ToastContainer />
        </ToastProvider>
    </AuthProvider>
  );
};

export default AppContainer;