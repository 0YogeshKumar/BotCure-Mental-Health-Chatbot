import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../styles/Games.css';

// --- Tic Tac Toe (Unchanged) ---
const TicTacToe = ({ onBack }) => {
    const initialBoard = Array(9).fill(null);
    const [board, setBoard] = useState(initialBoard);
    const [isPlayerNext, setIsPlayerNext] = useState(true);
    const [winner, setWinner] = useState(null);

    const winningLines = useMemo(() => [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ], []);

    const calculateWinner = useCallback((squares) => {
        for (let i = 0; i < winningLines.length; i++) {
            const [a, b, c] = winningLines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        if (squares.every(square => square !== null)) return 'Tie';
        return null;
    }, [winningLines]);

    const aiMove = useCallback((currentBoard) => {
        const availableMoves = currentBoard.map((sq, i) => sq === null ? i : null).filter(i => i !== null);
        if (availableMoves.length === 0) return;
        const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        const newBoard = [...currentBoard];
        newBoard[move] = 'O';
        setBoard(newBoard);
        setIsPlayerNext(true);
        setWinner(calculateWinner(newBoard));
    }, [calculateWinner]);

    useEffect(() => {
        if (!isPlayerNext && !winner) {
            const timeout = setTimeout(() => aiMove(board), 500);
            return () => clearTimeout(timeout);
        }
    }, [isPlayerNext, winner, board, aiMove]);
    
    const handleClick = (i) => {
        if (winner || board[i] || !isPlayerNext) return;
        const newBoard = [...board];
        newBoard[i] = 'X';
        setBoard(newBoard);
        setIsPlayerNext(false);
        setWinner(calculateWinner(newBoard));
    };

    const resetGame = () => {
        setBoard(initialBoard);
        setIsPlayerNext(true);
        setWinner(null);
    };

    const renderSquare = (i) => (<button className="square" onClick={() => handleClick(i)}>{board[i]}</button>);

    let status;
    if (winner === 'Tie') status = "It's a Tie!";
    else if (winner) status = `Winner: ${winner}`;
    else status = `Your Turn (X)`;

    return (
        <div className="game-container tictactoe">
            <button onClick={onBack} className="back-btn">← Back to Games</button>
            <h3 className="game-title">Tic-Tac-Toe</h3>
            <div className="status">{status}</div>
            <div className="board">
                <div className="board-row"> {renderSquare(0)} {renderSquare(1)} {renderSquare(2)} </div>
                <div className="board-row"> {renderSquare(3)} {renderSquare(4)} {renderSquare(5)} </div>
                <div className="board-row"> {renderSquare(6)} {renderSquare(7)} {renderSquare(8)} </div>
            </div>
            <button className="reset-btn" onClick={resetGame}>New Game</button>
        </div>
    );
};

// --- Find The Pair (Unchanged) ---
const MemoryGame = ({ onBack }) => {
    const emojis = useMemo(() => ['🧠', '❤️', '😊', '👍', '✨', '🧘', '☀️', '🌱'], []);
    const createShuffledDeck = useCallback(() => {
        const deck = [...emojis, ...emojis];
        return deck.sort(() => Math.random() - 0.5).map((emoji, index) => ({ id: index, emoji, isFlipped: false, isMatched: false }));
    }, [emojis]);

    const [cards, setCards] = useState(createShuffledDeck);
    const [flippedCards, setFlippedCards] = useState([]);
    const [moves, setMoves] = useState(0);

    useEffect(() => {
        if (flippedCards.length === 2) {
            const [first, second] = flippedCards;
            if (cards[first].emoji === cards[second].emoji) {
                setCards(prev => prev.map(card => 
                    card.emoji === cards[first].emoji ? { ...card, isMatched: true } : card
                ));
                setFlippedCards([]);
            } else {
                setTimeout(() => {
                    setCards(prev => prev.map((card, i) => 
                        (i === first || i === second) ? { ...card, isFlipped: false } : card
                    ));
                    setFlippedCards([]);
                }, 1000);
            }
        }
    }, [flippedCards, cards]);

    const handleCardClick = (index) => {
        if (flippedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;
        setCards(prev => prev.map((card, i) => i === index ? { ...card, isFlipped: true } : card));
        setFlippedCards(prev => [...prev, index]);
        if(flippedCards.length === 0) setMoves(prev => prev + 1);
    };

    const resetGame = useCallback(() => {
        setCards(createShuffledDeck());
        setFlippedCards([]);
        setMoves(0);
    }, [createShuffledDeck]);

    return (
        <div className="game-container memory-game">
            <button onClick={onBack} className="back-btn">← Back to Games</button>
            <h3 className="game-title">Find The Pair</h3>
            <div className="memory-grid">
                {cards.map((card, index) => (
                    <div key={card.id} className={`card ${card.isFlipped || card.isMatched ? 'flipped' : ''}`} onClick={() => handleCardClick(index)}>
                        <div className="card-inner">
                            <div className="card-front"></div>
                            <div className="card-back">{card.emoji}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="status">Moves: {moves}</div>
            <button className="reset-btn" onClick={resetGame}>New Game</button>
        </div>
    );
};

// --- Stress Buster (Kick the Buddy Style) Game ---
const StressBuster = ({ onBack }) => {
    const [hitState, setHitState] = useState({ isHit: false, key: 0 });
    const [hitCount, setHitCount] = useState(0);
    const [selectedTool, setSelectedTool] = useState('hand');
    const [bruises, setBruises] = useState([]);
    const [popups, setPopups] = useState([]);
    const [uploadedFace, setUploadedFace] = useState(null);
    
    const fileInputRef = useRef(null);
    const buddyRef = useRef(null);
    
    // Audio Context Setup
    const audioContext = useMemo(() => new (window.AudioContext || window.webkitAudioContext)(), []);

    // 1. Realistic Slap Sound (White Noise)
    const playSlap = useCallback(() => {
        const bufferSize = audioContext.sampleRate * 0.1; // 0.1 seconds
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        const gain = audioContext.createGain();
        
        noise.connect(gain);
        gain.connect(audioContext.destination);
        
        gain.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        noise.start();
    }, [audioContext]);

    // 2. Scream Synthesis (Descending Sawtooth)
    const playScream = useCallback(() => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sawtooth';
        // Start high pitch, drop quickly to low pitch
        osc.frequency.setValueAtTime(800 + Math.random() * 200, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        osc.start();
        osc.stop(audioContext.currentTime + 0.3);
    }, [audioContext]);


    // 3. Tool Sounds
    const playToolSound = useCallback((tool) => {
        // Always resume context on user interaction
        if(audioContext.state === 'suspended') audioContext.resume();

        if (tool === 'hand') {
            playSlap();
            return;
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

        let freq, decay, type;
        switch (tool) {
            case 'bat': freq = 100; decay = 0.1; type = 'sawtooth'; break; // Thud
            case 'stone': freq = 60; decay = 0.2; type = 'square'; break; // Heavy
            case 'ball': freq = 300; decay = 0.1; type = 'triangle'; break; // Boing
            default: freq = 150; decay = 0.1; type = 'sine'; break;
        }

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(10, audioContext.currentTime + decay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + decay);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + decay);
    }, [audioContext, playSlap]);

    const handleHit = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Coordinates for bruises
        const svgX = (e.clientX - rect.left) * (200 / rect.width);
        const svgY = (e.clientY - rect.top) * (300 / rect.height);

        // Coordinates for popups
        const popupX = e.clientX - rect.left;
        const popupY = e.clientY - rect.top;

        setBruises(prev => [...prev.slice(-15), { x: svgX, y: svgY, key: Date.now() }]);
        
        const popupText = ['POW!', 'BAM!', 'OUCH!', 'THWACK!', 'AGH!'][Math.floor(Math.random() * 5)];
        const newPopup = { id: Date.now(), x: popupX, y: popupY, text: popupText };
        setPopups(prev => [...prev, newPopup]);
        
        setTimeout(() => {
             setPopups(prev => prev.filter(p => p.id !== newPopup.id));
        }, 600);

        setHitState({ isHit: true, key: Math.random() });
        setHitCount(c => c + 1);
        
        // Play Sound + Scream
        playToolSound(selectedTool);
        // 50% chance to scream on hit
        if (Math.random() > 0.5) {
            playScream();
        }

        setTimeout(() => {
            setHitState(prev => ({ ...prev, isHit: false }));
        }, 200); // Shorter duration for snappier feel
    };
    
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedFace(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetGame = () => {
        setHitCount(0);
        setBruises([]);
        setPopups([]);
        setUploadedFace(null);
    };

    return (
        <div className="game-container stress-buster">
            <button onClick={onBack} className="back-btn">← Back to Games</button>
            <h3 className="game-title">Stress Buster</h3>
            <p className="game-subtitle">Choose a weapon. Upload a photo if you like!</p>

            <div className="controls-row">
                <div className="tool-selection">
                    <button onClick={() => setSelectedTool('hand')} className={selectedTool === 'hand' ? 'active' : ''}>✋ Slap</button>
                    <button onClick={() => setSelectedTool('bat')} className={selectedTool === 'bat' ? 'active' : ''}>🏏 Bat</button>
                    <button onClick={() => setSelectedTool('stone')} className={selectedTool === 'stone' ? 'active' : ''}>🪨 Rock</button>
                    <button onClick={() => setSelectedTool('ball')} className={selectedTool === 'ball' ? 'active' : ''}>⚾ Ball</button>
                </div>
                
                <div className="extra-controls">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                    />
                    <button className="upload-btn" onClick={() => fileInputRef.current.click()}>📸 Add Face</button>
                </div>
            </div>
            
            <div className="buddy-area" data-tool={selectedTool} onClick={handleHit} ref={buddyRef}>
                {hitState.isHit && selectedTool === 'bat' && <div key={hitState.key} className="tool-animation bat">🏏</div>}
                {hitState.isHit && selectedTool === 'stone' && <div key={hitState.key} className="tool-animation stone">🪨</div>}
                {hitState.isHit && selectedTool === 'ball' && <div key={hitState.key} className="tool-animation ball">⚾</div>}
                
                {popups.map(p => (
                    <div key={p.id} className="hit-effect" style={{ left: p.x, top: p.y }}>{p.text}</div>
                ))}

                <svg viewBox="0 0 200 300" className={`buddy-svg ${hitState.isHit ? 'hit' : ''}`}>
                    <defs>
                        {/* Clip path for the user uploaded image to be circular */}
                        <clipPath id="face-clip">
                             <circle cx="100" cy="70" r="48" />
                        </clipPath>
                    </defs>

                    <g className="buddy-group">
                        {/* Legs */}
                        <path d="M 70 200 L 70 280 A 10 10 0 0 0 90 280 L 90 200" className="buddy-body-part" />
                        <path d="M 130 200 L 130 280 A 10 10 0 0 0 110 280 L 110 200" className="buddy-body-part" />
                        
                        {/* Arms */}
                        <path d="M 50 120 L 20 160 A 10 10 0 0 0 40 170 L 60 130" className="buddy-body-part" />
                        <path d="M 150 120 L 180 160 A 10 10 0 0 1 160 170 L 140 130" className="buddy-body-part" />

                        {/* Body */}
                        <ellipse cx="100" cy="150" rx="60" ry="70" className="buddy-body-part" />
                        <path d="M 100 120 L 100 180" stroke="#8d6e63" strokeWidth="2" strokeDasharray="5,5" />
                        <path d="M 70 150 L 130 150" stroke="#8d6e63" strokeWidth="2" strokeDasharray="5,5" />

                        {/* Head */}
                        <circle cx="100" cy="70" r="50" className="buddy-body-part" fill={uploadedFace ? "#fff" : "#e6cba5"}/>
                        
                        {/* Face Group */}
                        <g className="buddy-face-group">
                            {uploadedFace ? (
                                /* User Uploaded Face */
                                <image 
                                    href={uploadedFace} 
                                    x="50" y="20" 
                                    width="100" height="100" 
                                    clipPath="url(#face-clip)"
                                    preserveAspectRatio="xMidYMid slice"
                                />
                            ) : (
                                /* Default Vector Face */
                                <>
                                    {/* Eyes Change on Hit */}
                                    {hitState.isHit ? (
                                        // Pain Eyes (Squint/Closed)
                                        <g>
                                            <path d="M 70 60 L 90 60" stroke="#3e2723" strokeWidth="3" />
                                            <path d="M 75 55 L 85 65" stroke="#3e2723" strokeWidth="2" />
                                            <path d="M 85 55 L 75 65" stroke="#3e2723" strokeWidth="2" />

                                            <path d="M 110 60 L 130 60" stroke="#3e2723" strokeWidth="3" />
                                            <path d="M 115 55 L 125 65" stroke="#3e2723" strokeWidth="2" />
                                            <path d="M 125 55 L 115 65" stroke="#3e2723" strokeWidth="2" />
                                        </g>
                                    ) : (
                                        // Happy Eyes (Button style)
                                        <g>
                                            <circle cx="80" cy="60" r="8" fill="#3e2723" />
                                            <circle cx="80" cy="60" r="2" fill="#d7ccc8" />
                                            <circle cx="78" cy="58" r="1" fill="black" />
                                            <circle cx="82" cy="62" r="1" fill="black" />

                                            <circle cx="120" cy="60" r="8" fill="#3e2723" />
                                            <circle cx="120" cy="60" r="2" fill="#d7ccc8" />
                                            <circle cx="118" cy="62" r="1" fill="black" />
                                            <circle cx="122" cy="58" r="1" fill="black" />
                                        </g>
                                    )}
                                    
                                    {/* Mouth Changes on Hit */}
                                    {hitState.isHit ? (
                                        // Pain Mouth (Open O)
                                        <circle cx="100" cy="95" r="12" fill="#3e2723" />
                                    ) : (
                                        // Happy Smile
                                        <path d="M 80 90 Q 100 110 120 90" stroke="#3e2723" strokeWidth="4" fill="none" strokeLinecap="round" />
                                    )}
                                </>
                            )}
                        </g>

                        {/* Bruises */}
                        {bruises.map(b => (
                            <circle key={b.key} cx={b.x} cy={b.y} r={Math.random() * 8 + 5} className="bruise" />
                        ))}
                    </g>
                </svg>
            </div>
            <div className="status">Hits: {hitCount}</div>
            <button className="reset-btn" onClick={resetGame}>Reset Buddy</button>
        </div>
    );
};

// --- Main Games Component ---
function Games() {
    const [activeGame, setActiveGame] = useState(null);

    const renderGame = () => {
        switch (activeGame) {
            case 'stressBuster': return <StressBuster onBack={() => setActiveGame(null)} />;
            case 'tictactoe': return <TicTacToe onBack={() => setActiveGame(null)} />;
            case 'memory': return <MemoryGame onBack={() => setActiveGame(null)} />;
            default: return (
                <div className="games-page">
                    <h2>Mood Boosters</h2>
                    <p>Take a short break and play a game to refresh your mind.</p>
                    <div className="game-selection">
                        <button onClick={() => setActiveGame('tictactoe')}>Play Tic-Tac-Toe</button>
                        <button onClick={() => setActiveGame('memory')}>Play Find The Pair</button>
                        <button onClick={() => setActiveGame('stressBuster')}>Play Stress Buster</button>
                    </div>
                </div>
            );
        }
    };

    return <>{renderGame()}</>;
}

export default Games;