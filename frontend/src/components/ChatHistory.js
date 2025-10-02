import React from 'react';
import '../styles/ChatHistory.css';
import { FaPlus, FaTrash } from 'react-icons/fa';

function ChatHistory({ chats, setChats, activeChatId, setActiveChatId }) {

    const handleNewChat = () => {
        const newChatId = Date.now().toString();
        setChats(prev => ({
            ...prev,
            [newChatId]: { title: 'New Chat', messages: [] }
        }));
        setActiveChatId(newChatId);
    };

    const handleDeleteChat = (e, chatIdToDelete) => {
        e.stopPropagation(); // Prevent setActiveChat from firing
        if (Object.keys(chats).length <= 1) {
            // Don't delete the last chat, just clear it
            setChats({ '1': { title: 'New Chat', messages: [] } });
            setActiveChatId('1');
            return;
        }

        const newChats = { ...chats };
        delete newChats[chatIdToDelete];
        setChats(newChats);

        // If the active chat was deleted, switch to another one
        if (activeChatId === chatIdToDelete) {
            setActiveChatId(Object.keys(newChats)[0]);
        }
    };
    
    const getChatTitle = (chat) => {
        // Use the first user message as the title, or default to "New Chat"
        const firstUserMessage = chat.messages.find(m => m.role === 'user');
        return firstUserMessage ? firstUserMessage.parts[0].text.substring(0, 30) + '...' : chat.title;
    };


    return (
        <div className="chat-history-panel">
            <button className="new-chat-btn" onClick={handleNewChat}>
                <FaPlus /> New Chat
            </button>
            <div className="chat-list">
                {Object.entries(chats).map(([chatId, chat]) => (
                    <div
                        key={chatId}
                        className={`chat-item ${activeChatId === chatId ? 'active' : ''}`}
                        onClick={() => setActiveChatId(chatId)}
                    >
                        <span className="chat-title">{getChatTitle(chat)}</span>
                        <button className="delete-chat-btn" onClick={(e) => handleDeleteChat(e, chatId)}>
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ChatHistory;
