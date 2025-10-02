import React, { useState } from 'react';
import '../styles/Navigation.css';
import { FaSignOutAlt, FaPlus, FaTrash, FaComments, FaGamepad, FaCog, FaThumbtack } from 'react-icons/fa';

function Navigation({
    onLogout, activeView, setActiveView, chatHistory, handleNewChat,
    handleSelectChat, handleDeleteChat, activeChatId, onGoHome, isPinned, setIsPinned
}) {
    const [isHovered, setIsHovered] = useState(false);
    const isExpanded = isPinned || isHovered;
    const sortedChatIds = Object.keys(chatHistory).sort((a, b) => parseInt(b.split('_')[1]) - parseInt(a.split('_')[1]));

    const handlePinClick = (e) => {
        // FIX: Stop the click from bubbling up to the parent container
        e.stopPropagation();
        setIsPinned(!isPinned);
    };

    return (
        <aside 
            className={`navigation-panel ${isExpanded ? 'expanded' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="nav-top">
                <div className="logo-container" onClick={onGoHome}>
                    <img src="/logo.png" alt="BotCure Logo" className="logo-icon" />
                    <span className="logo-text">BotCure</span>
                    <button className="pin-btn" onClick={handlePinClick}>
                        <FaThumbtack style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
                    </button>
                </div>
                
                <button className="new-chat-btn" onClick={handleNewChat}>
                    <FaPlus /> <span className="btn-text">New Chat</span>
                </button>

                <div className="chat-list-container">
                    {sortedChatIds.map(id => {
                        const firstUserMessage = chatHistory[id].find(msg => msg.role === 'user');
                        const title = firstUserMessage ? firstUserMessage.parts[0].text : 'New Chat';
                        return (
                            <div key={id} className={`chat-item ${id === activeChatId ? 'active' : ''}`} onClick={() => handleSelectChat(id)}>
                                <FaComments className="chat-item-icon" />
                                <span className="chat-title">{title}</span>
                                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteChat(id); }}>
                                    <FaTrash />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="nav-bottom">
                 <nav className="main-nav">
                    <button className={`nav-link ${activeView === 'games' ? 'active' : ''}`} onClick={() => setActiveView('games')}>
                        <FaGamepad /> <span className="link-text">Games</span>
                    </button>
                    <button className={`nav-link ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
                        <FaCog /> <span className="link-text">Settings</span>
                    </button>
                    <button onClick={onLogout} className="nav-link logout-link">
                        <FaSignOutAlt /> <span className="link-text">Logout</span>
                    </button>
                </nav>
            </div>
        </aside>
    );
}

export default Navigation;

