import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../styles/Games.css';

// --- Tic Tac Toe Game Component ---
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

// --- Find The Pair (Memory Game) Component ---
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

// --- Stress Buster (Hit the Buddy) Game ---
const StressBuster = ({ onBack }) => {
    const [hitState, setHitState] = React.useState({ isHit: false, key: 0 });
    const [hitCount, setHitCount] = React.useState(0);
    const [selectedTool, setSelectedTool] = React.useState('hand');
    const [bruises, setBruises] = React.useState([]);

    const audioContext = React.useMemo(() => new (window.AudioContext || window.webkitAudioContext)(), []);

    const playSound = React.useCallback((tool) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

        let freq, decay;
        switch (tool) {
            case 'bat': freq = 150; decay = 0.2; oscillator.type = 'square'; break;
            case 'stone': freq = 100; decay = 0.3; oscillator.type = 'sawtooth'; break;
            case 'ball': freq = 300; decay = 0.15; oscillator.type = 'triangle'; break;
            default: freq = 500; decay = 0.1; oscillator.type = 'sine'; break;
        }

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + decay);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + decay);
    }, [audioContext]);

    const handleHit = (e) => {
        const svgRect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - svgRect.left) * (200 / svgRect.width); // Scale coordinates to SVG viewbox
        const y = (e.clientY - svgRect.top) * (240 / svgRect.height);

        setBruises(prev => [...prev, { x, y, key: Date.now() }]);
        setHitState({ isHit: true, key: Math.random() });
        setHitCount(c => c + 1);
        playSound(selectedTool);

        setTimeout(() => {
            setHitState({ isHit: false, key: 0 });
        }, 300);
    };
    
    const resetGame = () => {
        setHitCount(0);
        setBruises([]);
    };

    return (
        <div className="game-container stress-buster">
            <button onClick={onBack} className="back-btn">← Back to Games</button>
            <h3 className="game-title">Stress Buster</h3>
            <p className="game-subtitle">Select a tool and click the buddy.</p>

            <div className="tool-selection">
                <button onClick={() => setSelectedTool('hand')} className={selectedTool === 'hand' ? 'active' : ''}>✋ Hand</button>
                <button onClick={() => setSelectedTool('bat')} className={selectedTool === 'bat' ? 'active' : ''}>🏏 Bat</button>
                <button onClick={() => setSelectedTool('stone')} className={selectedTool === 'stone' ? 'active' : ''}>🪨 Stone</button>
                <button onClick={() => setSelectedTool('ball')} className={selectedTool === 'ball' ? 'active' : ''}>⚾ Ball</button>
            </div>
            
            <div className="buddy-area" data-tool={selectedTool}>
                {hitState.isHit && selectedTool === 'bat' && <div key={hitState.key} className="tool-animation bat">🏏</div>}
                {hitState.isHit && selectedTool === 'stone' && <div key={hitState.key} className="tool-animation stone">🪨</div>}
                {hitState.isHit && selectedTool === 'ball' && <div key={hitState.key} className="tool-animation ball">⚾</div>}

                <svg viewBox="0 0 200 240" className={`buddy-svg ${hitState.isHit ? 'hit' : ''}`} onClick={handleHit}>
                    <g className="buddy-body">
                        <ellipse cx="100" cy="170" rx="70" ry="60" fill="#a7f3d0" stroke="#065f46" strokeWidth="2" />
                        <circle cx="100" cy="80" r="60" fill="#a7f3d0" stroke="#065f46" strokeWidth="2" />
                        <g>
                            <circle cx="80" cy="75" r="8" fill="white" />
                            <circle cx="120" cy="75" r="8" fill="white" />
                            <circle cx="82" cy="77" r="4" fill="black" />
                            <circle cx="118" cy="77" r="4" fill="black" />
                        </g>
                        {hitState.isHit ? (
                            <circle cx="100" cy="105" r="10" fill="black" />
                        ) : (
                            <path d="M 80 105 Q 100 120 120 105" stroke="black" strokeWidth="3" fill="none" />
                        )}
                        {bruises.map(b => (
                            <circle key={b.key} cx={b.x} cy={b.y} r="8" fill="#d946ef" opacity="0.6" />
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

