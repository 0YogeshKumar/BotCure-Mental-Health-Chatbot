import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Settings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function Settings({ user, theme, setTheme }) {
    const [feedback, setFeedback] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState('');
    const [voicePref, setVoicePref] = useState(localStorage.getItem('botcure_voice_pref') || 'Female');

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setFeedbackStatus('Sending...');
        try {
            await axios.post(`${API_URL}/api/feedback`, { username: user.username, feedback });
            setFeedbackStatus('Feedback sent successfully!');
            setFeedback('');
        } catch (error) {
            setFeedbackStatus('Failed to send feedback.');
        } finally {
            setTimeout(() => setFeedbackStatus(''), 3000);
        }
    };
    
    const handleVoiceChange = (e) => {
        setVoicePref(e.target.value);
        localStorage.setItem('botcure_voice_pref', e.target.value);
    };

    return (
        <div className="settings-page">
            <h2>Settings</h2>

            <div className="settings-section">
                <h3>Theme</h3>
                <div className="theme-options">
                    <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>Light</button>
                    <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>Dark</button>
                </div>
            </div>

            <div className="settings-section">
                <h3>Voice Preference</h3>
                <select value={voicePref} onChange={handleVoiceChange}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                </select>
            </div>

            <div className="settings-section">
                <h3>User Details</h3>
                <p><strong>Username:</strong> {user?.username}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
            </div>

            <div className="settings-section">
                <h3>Feedback</h3>
                <p>Have a suggestion or found a bug? Let us know!</p>
                <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Your feedback..."
                        required
                    ></textarea>
                    <button type="submit">Send Feedback</button>
                    {feedbackStatus && <p className="feedback-status">{feedbackStatus}</p>}
                </form>
            </div>
            
            <div className="settings-section">
                <h3>Developer Details</h3>
                <p>BotCure is an AI-powered mental health companion designed to provide a supportive and safe space for users. Created with care for a final year project.</p>
                <p>Developer: Yogesh Kumar H Mutt S</p>
                <p>Email ID: <a href="mailto:ykhmutt0804@gmail.com">ykhmutt0804@gmail.com</a> </p>
            </div>
        </div>
    );
}

export default Settings;

