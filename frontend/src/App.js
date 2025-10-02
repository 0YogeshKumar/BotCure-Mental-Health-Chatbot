import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Navigation from './components/Navigation';
import MainChat from './components/MainChat';
import Games from './components/Games';
import Settings from './components/Settings';
import Resources from './components/Resources';
import './styles/App.css';

function App() {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('light');
    const [chatHistory, setChatHistory] = useState({});
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeView, setActiveView] = useState('chat');
    const [isNavPinned, setIsNavPinned] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = sessionStorage.getItem('botcure_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const storedHistory = sessionStorage.getItem(`botcure_chat_history_${parsedUser.id}`);
            setChatHistory(storedHistory ? JSON.parse(storedHistory) : {});
            setActiveChatId(null);
        } else {
             navigate('/login');
        }
        const storedTheme = localStorage.getItem('botcure_theme') || 'light';
        setTheme(storedTheme);
    }, [navigate]);

    useEffect(() => {
        localStorage.setItem('botcure_theme', theme);
        document.body.className = theme;
    }, [theme]);
    
    useEffect(() => {
        if (user) {
            sessionStorage.setItem(`botcure_chat_history_${user.id}`, JSON.stringify(chatHistory));
        }
    }, [chatHistory, user]);

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);
        sessionStorage.setItem('botcure_user', JSON.stringify(loggedInUser));
        setActiveChatId(null);
        setActiveView('chat');
        navigate('/');
    };

    const handleLogout = () => {
        setUser(null);
        sessionStorage.clear();
        setChatHistory({});
        setActiveChatId(null);
        navigate('/login');
    };

    const handleNewChat = () => {
        const newId = `chat_${Date.now()}`;
        setChatHistory(prev => ({ ...prev, [newId]: [] }));
        setActiveChatId(newId);
        setActiveView('chat');
    };

    const handleSelectChat = (id) => {
        setActiveChatId(id);
        setActiveView('chat');
    };

    const handleDeleteChat = (id) => {
        setChatHistory(prev => {
            const newHistory = { ...prev };
            delete newHistory[id];
            return newHistory;
        });
        if (activeChatId === id) setActiveChatId(null);
    };

    const updateCurrentChat = (newMessage) => {
        if (!activeChatId) return;
        setChatHistory(prev => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), newMessage],
        }));
    };
    
    const handleGoHome = () => {
        setActiveChatId(null);
        setActiveView('chat');
    };

    const MainLayout = () => (
        <div className="app-container">
            <Navigation 
                user={user} onLogout={handleLogout} activeView={activeView} setActiveView={setActiveView}
                chatHistory={chatHistory} handleNewChat={handleNewChat} handleSelectChat={handleSelectChat}
                handleDeleteChat={handleDeleteChat} activeChatId={activeChatId} onGoHome={handleGoHome}
                isPinned={isNavPinned} setIsPinned={setIsNavPinned}
            />
            <main className="main-content">
                {activeView === 'chat' && (
                    <MainChat user={user} activeChat={activeChatId ? chatHistory[activeChatId] : []}
                        updateChat={updateCurrentChat} activeChatId={activeChatId}
                    />
                )}
                {activeView === 'games' && <Games />}
                {activeView === 'settings' && <Settings user={user} theme={theme} setTheme={setTheme} />}
            </main>
            {/* FIX: Only show Resources panel when in chat view and a chat is active */}
            {activeChatId && activeView === 'chat' && <Resources activeChat={chatHistory[activeChatId] || []} />}
        </div>
    );

    return (
        <div className={`App ${theme}`}>
            <Routes>
                <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
                <Route path="/" element={user ? <MainLayout /> : <Navigate to="/login" />} />
            </Routes>
        </div>
    );
}

export default App;

