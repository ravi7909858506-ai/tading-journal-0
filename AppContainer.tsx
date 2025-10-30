import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import { SignUp } from './components/SignUp';


const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [authView, setAuthView] = useState<'login' | 'signup'>('login');
    
    if (user) {
        return <App />;
    }
    
    return authView === 'login'
        ? <Login onSwitchToSignUp={() => setAuthView('signup')} />
        : <SignUp onSwitchToLogin={() => setAuthView('login')} />;
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
