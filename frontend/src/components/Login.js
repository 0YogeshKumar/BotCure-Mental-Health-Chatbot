import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const url = isRegistering ? `${API_URL}/api/register` : `${API_URL}/api/login`;
            const response = await axios.post(url, { username, password });
            if (response.data.user) {
                onLogin(response.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="logo-header">
                    <img src="/logo.png" alt="BotCure Logo"/>
                    <h1>BotCure</h1>
                </div>
                <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
                <p>{isRegistering ? 'Get started with your mental wellness companion.' : 'Sign in to continue.'}</p>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
                </form>
                <p className="toggle-form">
                    {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
                        {isRegistering ? 'Login' : 'Register'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;

