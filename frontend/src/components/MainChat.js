import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import '../styles/MainChat.css';
// Added FaStop for the stop button
import { FaPaperPlane, FaMicrophone, FaRegStopCircle, FaVolumeUp, FaStop } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const MarkdownRenderer = ({ text, isCrisis }) => {
    const className = `markdown-content ${isCrisis ? 'crisis' : ''}`;
    const renderText = () => {
        let processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedText = processedText.replace(/^- (.*$)/gm, '<li>$1</li>');
        if (processedText.includes('<li>')) processedText = `<ul>${processedText}</ul>`;
        processedText = processedText.replace(/\n/g, '<br />');
        return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
    };
    return <div className={className}>{renderText()}</div>;
};

const synth = window.speechSynthesis;
let voices = [];
const populateVoices = () => { voices = synth.getVoices().filter(v => v.lang.startsWith('en')); };
populateVoices();
if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = populateVoices; }

function MainChat({ user, activeChat, updateChat, activeChatId }) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isListening, setIsListening] = useState(false);
    // New state to track which message index is currently speaking
    const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
    
    const chatEndRef = useRef(null);
    const userRegion = "IND"; 

    const recognition = useMemo(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return null;
        const rec = new SpeechRecognition();
        rec.continuous = false; rec.lang = 'en-US'; rec.interimResults = false;
        return rec;
    }, []);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeChat]);

    // Cleanup speech when component unmounts or chat changes
    useEffect(() => {
        return () => {
            synth.cancel();
            setSpeakingMessageIndex(null);
        };
    }, [activeChatId]);

    useEffect(() => {
        if (!recognition) return;
        const handleResult = (event) => { setInput(event.results[0][0].transcript); setIsListening(false); };
        const handleEnd = () => setIsListening(false);
        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('end', handleEnd);
        return () => {
            recognition.removeEventListener('result', handleResult);
            recognition.removeEventListener('end', handleEnd);
        };
    }, [recognition]);

    const handleSend = async () => {
        if (!input.trim() || !activeChatId) return;
        
        // Stop any ongoing speech when sending a new message
        synth.cancel();
        setSpeakingMessageIndex(null);

        const userMessage = { role: 'user', parts: [{ text: input }] };
        updateChat(userMessage);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setError('');
        
        const cleanedHistoryForApi = activeChat.map(msg => ({ role: msg.role, parts: msg.parts }));
        const chatHistoryForApi = [...cleanedHistoryForApi, userMessage];

        try {
            const response = await axios.post(`${API_URL}/api/chat`, { message: currentInput, history: chatHistoryForApi }, {
                headers: { 'x-user-region': userRegion } 
            });
            const botMessage = { 
                role: 'model', 
                parts: [{ text: response.data.reply }], 
                crisisDetected: response.data.crisisDetected 
            };
            updateChat(botMessage);
        } catch (err) {
            setError('Sorry, something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    const toggleListening = () => { if (!recognition) return; if (isListening) { recognition.stop(); } else { recognition.start(); } setIsListening(!isListening); };

    // Updated logic to toggle between Speak and Stop
    const toggleSpeech = (text, index) => {
        // If currently speaking THIS message, stop it
        if (synth.speaking && speakingMessageIndex === index) {
            synth.cancel();
            setSpeakingMessageIndex(null);
            return;
        }

        // If speaking something else or nothing, start fresh
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voicePref = localStorage.getItem('botcure_voice_pref') || 'Female';
        
        const findVoice = (gender) => {
            const englishVoices = voices.filter(v => v.lang.startsWith('en'));
            if (gender === 'Female') return englishVoices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US English')) || englishVoices[0];
            if (gender === 'Male') return englishVoices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google UK English Male')) || englishVoices[1] || englishVoices[0];
            return englishVoices[0]; 
        };

        utterance.voice = findVoice(voicePref);

        // Reset state when speech finishes naturally
        utterance.onend = () => {
            setSpeakingMessageIndex(null);
        };

        // Reset state if there is an error
        utterance.onerror = () => {
            setSpeakingMessageIndex(null);
        };

        setSpeakingMessageIndex(index);
        synth.speak(utterance);
    };

    if (!activeChatId) {
        return (
            <div className="welcome-screen">
                <img src="/logo.png" alt="BotCure Logo" className="welcome-logo" />
                <h1>Welcome, {user?.username}!</h1>
                <p>How can I help you today?</p>
            </div>
        );
    }

    return (
        <div className="main-chat-container">
            <div className="chat-window">
                {activeChat.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <div className="message-bubble">
                            {msg.role === 'model' ? <MarkdownRenderer text={msg.parts[0].text} isCrisis={msg.crisisDetected} /> : msg.parts[0].text}
                            
                            {/* Only show speech controls for model messages that aren't crisis alerts */}
                            {msg.role === 'model' && !msg.crisisDetected && (
                                <button 
                                    className="speak-btn" 
                                    onClick={() => toggleSpeech(msg.parts[0].text, index)}
                                    title={speakingMessageIndex === index ? "Stop Speaking" : "Read Aloud"}
                                >
                                    {speakingMessageIndex === index ? <FaStop /> : <FaVolumeUp />}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="chat-message model"><div className="message-bubble loading-bubble"><span /><span /><span /></div></div>}
                {error && <div className="error-message">{error}</div>}
                <div ref={chatEndRef} />
            </div>
            <div className="chat-input-area">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message here..." rows="1" />
                <button onClick={toggleListening} className={`mic-btn ${isListening ? 'listening' : ''}`} disabled={!recognition}>
                    {isListening ? <FaRegStopCircle /> : <FaMicrophone />}
                </button>
                <button onClick={handleSend} className="send-btn" disabled={isLoading || !input.trim()}><FaPaperPlane /></button>
            </div>
        </div>
    );
}

export default MainChat;