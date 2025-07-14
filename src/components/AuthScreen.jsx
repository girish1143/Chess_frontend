import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import { useAuth } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const handleLoginSuccess = (userData) => {
    login(userData, userData.token);
  };

  const handleSignupSuccess = (userData) => {
    login(userData, userData.token);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {isLogin ? (
        <Login 
          onSwitchToSignup={() => setIsLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <Signup 
          onSwitchToLogin={() => setIsLogin(true)}
          onSignupSuccess={handleSignupSuccess}
        />
      )}
      <ToastContainer/>
    </div>
  );
};

export default AuthScreen; 