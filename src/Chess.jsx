import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js'; // Client-side chess logic for validation & display
import { Loader2, Play, Users, MessageSquare, Square as ChessIcon } from 'lucide-react'; // Corrected: Using Square as ChessIcon
import { ToastContainer, toast } from 'react-toastify'; // Added missing import for ToastContainer and toast

// --- Utility: Chess piece Unicode symbols ---
const PIECES = {
  'p': '♙', 'r': '♖', 'n': '♘', 'b': '♗', 'q': '♕', 'k': '♔',
  'P': '♟', 'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚',
};

// --- Component: ChessBoard ---
// Renders the chess board and handles dragging/dropping pieces visually.
const ChessBoard = ({ board, onPieceDrop, playerColor, currentTurnColor, statusMessage }) => {
  const fileChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rankChars = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Reverse ranks/files for black player's perspective
  const displayRanks = playerColor === 'b' ? [...rankChars].reverse() : rankChars;
  const displayFiles = playerColor === 'b' ? [...fileChars].reverse() : fileChars;

  const [draggingPiece, setDraggingPiece] = useState(null); // { piece: 'p', fromSquare: 'e2' }
  const [draggedOverSquare, setDraggedOverSquare] = useState(null);

  const handleDragStart = useCallback((e, piece, fromSquare) => {
    // Only allow dragging if it's the player's turn and their piece
    const isPlayerPiece = (playerColor === 'w' && piece === piece.toUpperCase()) ||
                          (playerColor === 'b' && piece === piece.toLowerCase());
    const isPlayersTurn = (currentTurnColor === playerColor);

    if (isPlayerPiece && isPlayersTurn) {
      setDraggingPiece({ piece, fromSquare });
      e.dataTransfer.setData('text/plain', ''); // Required for Firefox
      e.currentTarget.style.opacity = '0.4'; // Visual feedback for dragging
    } else {
      e.preventDefault(); // Prevent drag if not allowed
    }
  }, [playerColor, currentTurnColor]);

  const handleDragOver = useCallback((e, square) => {
    e.preventDefault(); // Allow drop
    setDraggedOverSquare(square);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDraggedOverSquare(null);
  }, []);

  const handleDrop = useCallback((e, toSquare) => {
    e.preventDefault();
    if (draggingPiece) {
      onPieceDrop(draggingPiece.fromSquare, toSquare, draggingPiece.piece);
    }
    setDraggingPiece(null);
    setDraggedOverSquare(null);
  }, [draggingPiece, onPieceDrop]);

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1'; // Reset opacity
    setDraggingPiece(null);
    setDraggedOverSquare(null);
  }, []);

  return (
    <div className="flex flex-col items-center p-4">
      <div className="text-xl font-semibold mb-2 text-gray-200">
        Current Turn: <span className={currentTurnColor === 'w' ? 'text-white' : 'text-gray-400'}>{currentTurnColor === 'w' ? 'White' : 'Black'}</span>
      </div>
      <div className="text-lg font-medium mb-4 text-gray-300">
        {statusMessage}
      </div>

      <div className="grid grid-cols-8 gap-0 relative border-8 border-gray-700 rounded-lg shadow-2xl overflow-hidden max-w-full aspect-square w-[min(90vw,600px)]">
        {displayRanks.map((rank) =>
          displayFiles.map((file) => {
            const square = `${file}${rank}`;
            const row = 8 - parseInt(rank);
            const col = fileChars.indexOf(file);
            const isLightSquare = (row + col) % 2 === 0;
            const piece = board[row][col];
            const pieceChar = piece !== '' ? PIECES[piece] : '';

            // Highlight dragged over square
            const isDraggedOver = draggedOverSquare === square;
            let squareBg = '';
            if (isLightSquare) {
              squareBg = isDraggedOver ? 'bg-indigo-600' : 'bg-stone-200'; // Light square
            } else {
              squareBg = isDraggedOver ? 'bg-indigo-800' : 'bg-stone-800'; // Dark square
            }

            return (
              <div
                key={square}
                id={`square-${square}`}
                className={`relative flex items-center justify-center text-5xl lg:text-7xl font-bold transition-colors duration-200 aspect-square ${squareBg}`}
                onDragOver={(e) => handleDragOver(e, square)}
                onDrop={(e) => handleDrop(e, square)}
                onDragLeave={handleDragLeave}
              >
                <span className="absolute top-1 left-1 text-xs font-mono opacity-50 text-gray-700 dark:text-gray-400">
                  {square}
                </span>
                {pieceChar && (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, piece, square)}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing select-none h-full w-full flex items-center justify-center text-center leading-none drop-shadow-md"
                    style={{
                      color: piece === piece.toUpperCase() ? '#FFFFFF' : '#1F2937', // White pieces pure white, black darker
                    }}
                  >
                    {pieceChar}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


// --- Component: GameScreen ---
// Displays the active chess game with board and controls.
const GameScreen = ({
  playerColor,
  game,
  onPieceDrop,
  statusMessage,
  currentTurnColor,
  playersInRoom,
  handleLeaveRoom
}) => {
  const [fen, setFen] = useState(game.fen()); // FEN string for debugging or display

  useEffect(() => {
    setFen(game.fen()); // Update FEN when game state changes
  }, [game]);

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center p-4 bg-gray-900 min-h-screen text-gray-100">
      <div className="lg:w-1/4 w-full p-4 lg:pr-8 mb-6 lg:mb-0 space-y-6">
        <h2 className="text-3xl font-bold text-purple-400 mb-4 text-center lg:text-left">
          Game Live
        </h2>
        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-purple-700">
          <p className="text-lg font-semibold text-gray-300">
            You are: <span className={`font-extrabold ${playerColor === 'w' ? 'text-white' : 'text-gray-400'}`}>
              {playerColor === 'w' ? 'White' : 'Black'}
            </span>
          </p>
          <p className="text-lg font-semibold text-gray-300 mt-2">
            Turn: <span className={`font-extrabold ${currentTurnColor === 'w' ? 'text-white' : 'text-gray-400'}`}>
              {currentTurnColor === 'w' ? 'White' : 'Black'}
            </span>
          </p>
          <p className="text-md text-gray-400 mt-4">
            Players in Room: {playersInRoom.join(', ')}
          </p>
          <button
            onClick={handleLeaveRoom}
            className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
          >
            <Play className="inline-block mr-2" size={20} /> Leave Game
          </button>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-purple-700">
          <h3 className="text-xl font-bold text-purple-400 mb-3">Game Log (FEN)</h3>
          <textarea
            readOnly
            value={fen}
            className="w-full h-24 bg-gray-700 text-gray-300 p-3 rounded-lg font-mono text-sm resize-none"
            placeholder="FEN string will appear here..."
          ></textarea>
        </div>
      </div>

      <div className="lg:w-3/4 w-full">
        <ChessBoard
          board={game.board().map(row => row.map(sq => sq ? sq.color + sq.type.toUpperCase() : ''))} // Convert to simpler representation
          onPieceDrop={onPieceDrop}
          playerColor={playerColor}
          currentTurnColor={currentTurnColor}
          statusMessage={statusMessage}
        />
      </div>
    </div>
  );
};


// --- Component: QueueScreen ---
// Displays the waiting queue state.
const QueueScreen = ({ message, onCancelQueue, playersInQueueCount }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-purple-700 max-w-md w-full text-center space-y-6">
        <Loader2 className="animate-spin h-12 w-12 text-purple-500 mx-auto" />
        <h2 className="text-3xl font-extrabold text-purple-400">
          Waiting for Opponent...
        </h2>
        <p className="text-lg text-gray-300">
          {message}
        </p>
        <p className="text-md text-gray-400">
          Players currently in queue: {playersInQueueCount}
        </p>
        <button
          onClick={onCancelQueue}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          <Play className="inline-block mr-2 rotate-180" size={20} /> Cancel Queue
        </button>
      </div>
    </div>
  );
};

// --- Main App Component ---
// Manages WebSocket connection, game state, and screen rendering.
const Chess = () => {
  const [ws, setWs] = useState(null);
  const [screen, setScreen] = useState('welcome'); // 'welcome', 'queue', 'game'
  const [game, setGame] = useState(new Chess()); // Client-side chess.js instance
  const [playerColor, setPlayerColor] = useState(null); // 'w' or 'b'
  const [statusMessage, setStatusMessage] = useState('Your turn!');
  const [currentTurnColor, setCurrentTurnColor] = useState('w'); // Tracks whose turn it is
  const [playersInQueueCount, setPlayersInQueueCount] = useState(0); // For queue screen
  const [playersInRoom, setPlayersInRoom] = useState([]); // For game screen

  // Ref to store game ID, useful for reconnection logic (advanced)
  const gameIdRef = useRef(null);

  // --- WebSocket Connection Logic ---
  useEffect(() => {
    const connectWebSocket = () => {
      // Replace with your actual WebSocket server URL
      const newWs = new WebSocket('ws://localhost:8080'); // Example WebSocket URL

      newWs.onopen = () => {
        toast.success('Connected to game server!');
        // If reconnecting to an active game, send gameId
        if (gameIdRef.current) {
          newWs.send(JSON.stringify({ type: 'reconnect', gameId: gameIdRef.current }));
        }
      };

      newWs.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'queue_status':
            setPlayersInQueueCount(message.playersInQueue);
            setStatusMessage(message.message);
            break;
          case 'game_start':
            setScreen('game');
            setPlayerColor(message.color);
            gameIdRef.current = message.gameId; // Store game ID
            game.load(message.fen); // Load initial board state
            setGame(new Chess(message.fen)); // Create new Chess instance with initialFEN
            setCurrentTurnColor(game.turn()); // Set initial turn
            setStatusMessage(`Game started! You are ${message.color === 'w' ? 'White' : 'Black'}`);
            setPlayersInRoom(message.players);
            break;
          case 'board_update':
            // Validate and apply move if possible
            if (game.load(message.fen)) { // Attempt to load the new FEN
              setGame(new Chess(message.fen)); // Update game state with new FEN
              setCurrentTurnColor(game.turn()); // Update current turn
              setStatusMessage(message.message || "Move received.");
            } else {
              setStatusMessage("Error: Invalid board update received.");
            }
            break;
          case 'game_end':
            setStatusMessage(message.message);
            toast.info(message.message);
            setTimeout(() => {
                setScreen('welcome');
                game.reset(); // Reset client-side board
                setGame(new Chess());
                setPlayerColor(null);
                gameIdRef.current = null;
                setPlayersInRoom([]);
                setPlayersInQueueCount(0);
            }, 5000); // Show message for 5 seconds then go to welcome
            break;
          case 'error':
            toast.error(message.message);
            setStatusMessage(message.message);
            break;
          case 'info':
              toast.info(message.message);
              setStatusMessage(message.message);
              break;
          default:
            // console.warn('Unknown message type:', message.type); // Removed for production
        }
      };

      newWs.onclose = () => {
        toast.warn('Disconnected from server. Attempting to reconnect...', { autoClose: 5000 });
        // Attempt to reconnect after a short delay
        setTimeout(connectWebSocket, 3000);
      };

      newWs.onerror = (error) => {
        toast.error('WebSocket connection error!', { autoClose: 5000 });
        newWs.close(); // Force close to trigger onclose and reconnect
      };

      setWs(newWs);

      // Cleanup on component unmount
      return () => {
        newWs.close();
      };
    };

    connectWebSocket();
  }, []); // Empty dependency array means this runs once on mount/unmount

  // --- Game Actions ---
  const handleJoinQueue = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'join_queue' }));
      setScreen('queue');
      setStatusMessage('Joining queue...');
    } else {
      toast.error('WebSocket not connected. Please wait or refresh.');
    }
  }, [ws]);

  const handleCancelQueue = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN && screen === 'queue') {
      ws.send(JSON.stringify({ type: 'cancel_queue' }));
      setScreen('welcome');
      setStatusMessage('Queue cancelled.');
    }
  }, [ws, screen]);

  const handleLeaveRoom = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN && screen === 'game' && gameIdRef.current) {
      ws.send(JSON.stringify({ type: 'leave_game', gameId: gameIdRef.current }));
      setScreen('welcome');
      game.reset(); // Reset client-side board
      setGame(new Chess());
      setPlayerColor(null);
      gameIdRef.current = null;
      setPlayersInRoom([]);
      setStatusMessage('You left the game.');
    }
  }, [ws, screen, game]);


  const onPieceDrop = useCallback((from, to) => {
    // Client-side validation: Is it my turn? Is it a legal move?
    if (playerColor !== currentTurnColor) {
      setStatusMessage("It's not your turn!");
      toast.warn("It's not your turn!");
      return false;
    }

    let move = null;
    try {
        move = game.move({
            from: from,
            to: to,
            promotion: 'q' // Always promote to queen for simplicity in this example
        });
    } catch (e) {
        // The game.move() will throw if the move is illegal
        setStatusMessage("Illegal move!");
        toast.error("Illegal move!");
        return false;
    }

    if (move === null) {
      setStatusMessage("Illegal move!");
      toast.error("Illegal move!");
      return false;
    }

    // If move is legal client-side, send it to the server for authoritative validation
    if (ws && ws.readyState === WebSocket.OPEN && gameIdRef.current) {
      ws.send(JSON.stringify({
        type: 'make_move',
        gameId: gameIdRef.current,
        move: { from: from, to: to, promotion: 'q' }, // Send the intended move
        fen: game.fen() // Send the new FEN after client-side move
      }));
      setGame(new Chess(game.fen())); // Optimistically update client board
      return true;
    } else {
      toast.error("Connection error. Cannot send move.");
      // Revert the client-side move if failed to send
      game.undo();
      setGame(new Chess(game.fen()));
      return false;
    }
  }, [ws, game, playerColor, currentTurnColor]);


  // --- Render different screens based on state ---
  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-100 flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />

      {screen === 'welcome' && (
        <div className="flex flex-col items-center justify-center flex-grow p-4">
          <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl border-4 border-purple-800 max-w-lg w-full text-center space-y-8">
            {/* The ChessIcon is now explicitly imported as Square from lucide-react */}
            <ChessIcon className="h-24 w-24 text-purple-500 mx-auto animate-bounce-slow" />
            <h1 className="text-5xl font-extrabold text-purple-400 mb-4 tracking-tight">
              Play Chess Online
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Challenge a friend or find a random opponent. Connect and play in real-time!
            </p>
            <button
              onClick={handleJoinQueue}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-xl"
              disabled={ws?.readyState !== WebSocket.OPEN}
            >
              <Users className="inline-block mr-3" size={24} /> Join Queue
            </button>
            {ws?.readyState !== WebSocket.OPEN && (
              <p className="text-sm text-red-400 mt-2">Connecting to server...</p>
            )}
          </div>
        </div>
      )}

      {screen === 'queue' && (
        <QueueScreen
          message={statusMessage}
          onCancelQueue={handleCancelQueue}
          playersInQueueCount={playersInQueueCount}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          playerColor={playerColor}
          game={game}
          onPieceDrop={onPieceDrop}
          statusMessage={statusMessage}
          currentTurnColor={currentTurnColor}
          playersInRoom={playersInRoom}
          handleLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
};

export default Chess;