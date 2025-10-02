import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import csv from 'csv-parser';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

// --- Basic Setup ---
dotenv.config();
const app = express();
const port = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersCsvPath = path.join(__dirname, 'data', 'users.csv');

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- Helper Functions ---

const getUsers = () => {
  return new Promise((resolve, reject) => {
    const users = [];
    if (!fs.existsSync(usersCsvPath)) {
        fs.mkdirSync(path.dirname(usersCsvPath), { recursive: true });
        fs.writeFileSync(usersCsvPath, 'id,username,password\n');
        return resolve([]);
    }
    fs.createReadStream(usersCsvPath)
      .pipe(csv())
      .on('data', (row) => users.push(row))
      .on('end', () => resolve(users))
      .on('error', (error) => reject(error));
  });
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- Crisis Detection & Helplines ---
const crisisKeywords = [
    'kill myself', 'suicide', 'want to die', 'end my life', 'no reason to live', 
    'self-harm', 'harm myself', 'jump from', 'hang myself', 'take my life'
];

const isCrisisMessage = (message) => {
    const lowerCaseMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerCaseMessage.includes(keyword));
};

const getHelplineInfo = (region = 'default') => {
    // Add more regions as needed
    if (region === 'IND') {
        return {
            text: "Please reach out for immediate help. India Helplines:",
            numbers: ["Kiran Helpline: 1800-599-0019", "AASRA: +91-22-27546669"]
        };
    }
    // Default / International Helplines
    return {
        text: "Please reach out for immediate help.",
        numbers: ["US/Canada: 988", "UK: 111"]
    };
};

// --- API Endpoints ---

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const users = await getUsers();
        if (users.some(user => user.username === username)) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        const existingIds = users.map(u => parseInt(u.id)).filter(id => !isNaN(id));
        const newUserId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
        
        const newUser = { id: newUserId, username, password };

        const csvWriter = createCsvWriter({
            path: usersCsvPath,
            header: [
                { id: 'id', title: 'id' },
                { id: 'username', title: 'username' },
                { id: 'password', title: 'password' },
            ],
            append: true,
        });

        await csvWriter.writeRecords([newUser]);
        res.status(201).json({ message: 'User registered.', user: { id: newUser.id, username: newUser.username } });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const users = await getUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            res.status(200).json({ message: 'Login successful.', user: { id: user.id, username: user.username } });
        } else {
            res.status(401).json({ message: 'Invalid username or password.' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        console.error("Gemini API Key is missing or not configured in backend/.env");
        return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    let systemInstructionText;
    const crisisDetected = isCrisisMessage(message);

    if (crisisDetected) {
        const helpline = getHelplineInfo(req.headers['x-user-region']); // Use region from header
        systemInstructionText = `You are a crisis intervention AI. Your only goal is to provide immediate, concise help. Acknowledge their pain in one sentence. Then, **IMMEDIATELY** provide the following helplines: ${helpline.numbers.join('; ')}. Do not provide any other information or options. Keep the entire message under 60 words. Be direct and urgent.`;
    } else {
        systemInstructionText = `You are BotCure, an empathetic and supportive AI mental health guide. Your personality is calm, wise, and thoughtful. Your goal is to listen, offer comfort, and provide gentle guidance. ALWAYS respond in well-structured markdown. Use hyphens (-) for lists and double asterisks (**) for bolding. If the user expresses sadness, validate their feelings and gently ask what they might prefer to talk about or if they'd like a calming exercise, rather than a long monologue.`;
    }

    const systemInstruction = { role: "user", parts: [{ text: systemInstructionText }] };
    
    // FIX: Ensure history only contains 'role' and 'parts'
    const cleanedHistory = history.map(msg => ({
        role: msg.role,
        parts: msg.parts
    }));

    const payload = { contents: [ systemInstruction, ...cleanedHistory, { role: "user", parts: [{ text: message }] } ] };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data.error ? data.error.message : data);
            throw new Error(`Gemini API request failed with status ${response.status}`);
        }
        
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that. Please try again.";
        res.json({ reply: botResponse, crisisDetected });

    } catch (error) {
        console.error('Error in /api/chat endpoint:', error.message);
        res.status(500).json({ error: 'Failed to fetch response from AI.' });
    }
});

app.post('/api/search', async (req, res) => {
    const { query, isCrisis } = req.body;
    const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
    const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
    const userRegion = req.headers['x-user-region'] || 'default';

    let articleSearchQuery;
    let videoSearchQuery;

    if (isCrisis) {
        articleSearchQuery = `crisis support helplines ${userRegion === 'IND' ? 'India' : 'worldwide'}`;
        videoSearchQuery = `grounding exercises for anxiety OR immediate stress relief techniques ${userRegion === 'IND' ? 'India' : ''}`;
    } else {
        articleSearchQuery = `${query} mental health articles`;
        videoSearchQuery = `${query} calming music OR mindfulness exercises`;
    }

    // Always include a general mental health context for search queries
    articleSearchQuery = `${articleSearchQuery} mental health support`;
    videoSearchQuery = `${videoSearchQuery} mental wellness`;


    const articleUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(articleSearchQuery)}&num=3`;
    const videoUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(videoSearchQuery)}&siteSearch=youtube.com&siteSearchFilter=i&num=2`;

    try {
        const [articleResponse, videoResponse] = await Promise.all([
            fetch(articleUrl),
            fetch(videoUrl)
        ]);
        
        const articleData = await articleResponse.json();
        const videoData = await videoResponse.json();

        if (!articleResponse.ok) {
            console.error("Google Search API Error (Articles):", articleData.error?.message);
        }
        if (!videoResponse.ok) {
             console.error("Google Search API Error (Videos):", videoData.error?.message);
        }

        const articles = articleData.items?.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        })) || [];
        
        const negativeVideoKeywords = [
            'death', 'suicide', 'kill yourself', 'depressing', 'sad songs', 
            'breakup', 'heartbreak', 'grief', 'alone', 'lonely', 'dark', 'stressful life', 'fight', 'anger'
        ]; // Expanded negative keywords

        let videos = videoData.items?.filter(item => {
            const title = item.title?.toLowerCase() || '';
            const snippet = item.snippet?.toLowerCase() || '';
            return !negativeVideoKeywords.some(keyword => title.includes(keyword) || snippet.includes(keyword));
        }).map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        })) || [];

        // If in crisis mode, and no safe videos are found, provide generic safe ones.
        if (isCrisis && videos.length === 0) {
            videos = [
                { title: "Guided Breathing for Stress Relief", link: "https://www.youtube.com/watch?v=Qtb1HDg1z-8", snippet: "A simple guided breathing exercise to calm your mind." },
                { title: "5-Minute Guided Meditation for Anxiety", link: "https://www.youtube.com/watch?v=MKp7C3mQx3U", snippet: "Quick meditation to help reduce feelings of anxiety." }
            ];
        }


        res.json({ articles, videos });

    } catch (error) {
        console.error('Error calling Google Search API:', error);
        res.status(500).json({ error: 'Failed to fetch resources.' });
    }
});

// Endpoint to handle user feedback via email
app.post('/api/feedback', (req, res) => {
    const { username, feedback } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Sending feedback to yourself
        subject: `BotCure Feedback from ${username}`,
        text: `Feedback from user: ${username}\n\n${feedback}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: 'Failed to send feedback.' });
        }
        res.status(200).json({ message: 'Feedback sent successfully!' });
    });
});


// --- Server Start ---
app.listen(port, () => {
    console.log(`Backend server for BotCure running at http://localhost:${port}`);
});

