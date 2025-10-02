import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Resources.css';
import { FaLink, FaYoutube } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function Resources({ activeChat }) {
    const [resources, setResources] = useState({ articles: [], videos: [] });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchResources = async () => {
            const lastUserMessage = [...activeChat].reverse().find(msg => msg.role === 'user');
            if (!lastUserMessage) return;
            
            const lastModelMessage = [...activeChat].reverse().find(msg => msg.role === 'model');
            const isCrisis = lastModelMessage?.crisisDetected || false;

            setIsLoading(true);
            try {
                const response = await axios.post(`${API_URL}/api/search`, { 
                    query: lastUserMessage.parts[0].text,
                    isCrisis: isCrisis 
                });
                setResources(response.data);
            } catch (error) {
                console.error("Failed to fetch resources:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeChat.length > 0) {
            const timer = setTimeout(fetchResources, 1500);
            return () => clearTimeout(timer);
        }
    }, [activeChat]);

    const hasResources = resources.articles.length > 0 || resources.videos.length > 0;

    return (
        <aside className="resources-panel">
            <h2>Resources</h2>
            {isLoading ? <p>Finding helpful resources...</p> : hasResources ? (
                <>
                    {resources.articles.length > 0 && (
                        <div className="resource-section">
                            <h3>Helpful Articles</h3>
                            {resources.articles.map((item, index) => (
                                <a key={`article-${index}`} href={item.link} target="_blank" rel="noopener noreferrer" className="resource-item">
                                    <FaLink className="icon" />
                                    <div className="text-content"><h4>{item.title}</h4><p>{item.snippet}</p></div>
                                </a>
                            ))}
                        </div>
                    )}
                    {resources.videos.length > 0 && (
                        <div className="resource-section">
                            <h3>Related Videos</h3>
                            {resources.videos.map((item, index) => (
                                <a key={`video-${index}`} href={item.link} target="_blank" rel="noopener noreferrer" className="resource-item">
                                    <FaYoutube className="icon youtube" />
                                    <div className="text-content"><h4>{item.title}</h4></div>
                                </a>
                            ))}
                        </div>
                    )}
                </>
            ) : <p>Relevant articles and videos will appear here.</p>}
        </aside>
    );
}

export default Resources;

