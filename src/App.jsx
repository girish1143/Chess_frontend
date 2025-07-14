import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Loader2, Play, Users, MessageSquare, Square as ChessIcon, LogOut, User } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';

// --- Utility: Chess piece Unicode symbols ---
const PIECES = {
  'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
};

// Alternative piece representations for better compatibility
const PIECE_NAMES = {
  'p': 'pawn', 'r': 'rook', 'n': 'knight', 'b': 'bishop', 'q': 'queen', 'k': 'king',
  'P': 'PAWN', 'R': 'ROOK', 'N': 'KNIGHT', 'B': 'BISHOP', 'Q': 'QUEEN', 'K': 'KING',
};

// --- Component: ChessBoard ---
const ChessBoard = ({ board, onPieceDrop, playerColor, currentTurnColor, statusMessage, game }) => {
  const fileChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rankChars = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayRanks = playerColor === 'b' ? [...rankChars].reverse() : rankChars;
  const displayFiles = playerColor === 'b' ? [...fileChars].reverse() : fileChars;

  const [draggingPiece, setDraggingPiece] = useState(null);
  const [draggedOverSquare, setDraggedOverSquare] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [isInCheck, setIsInCheck] = useState(false);
  const [checkSquare, setCheckSquare] = useState(null);

  // Check if king is in check
  const checkForCheck = useCallback(() => {
    try {
      if (!game) return;
      
      const isCheck = game.isCheck();
      setIsInCheck(isCheck);
      
      if (isCheck) {
        // Find the king's position
        const board = game.board();
        const currentTurn = game.turn();
        
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            if (board[row][col] && board[row][col].type === 'k' && board[row][col].color === currentTurn) {
              const square = String.fromCharCode(97 + col) + (8 - row);
              setCheckSquare(square);
              break;
            }
          }
        }
      } else {
        setCheckSquare(null);
      }
    } catch (error) {
      setIsInCheck(false);
      setCheckSquare(null);
    }
  }, [game]);

  // Check for check status when game changes
  useEffect(() => {
    try {
      if (game) {
        checkForCheck();
      }
    } catch (error) {
      // console.error('Error in check effect:', error);
    }
  }, [game, checkForCheck]);

  // Calculate valid moves for a piece
  const calculateValidMoves = useCallback((square) => {
    try {
      if (!game) return [];
      
      // Use the current game state to calculate moves
      const moves = game.moves({ square, verbose: true });
      return moves.map(move => move.to);
    } catch (error) {
      return [];
    }
  }, [game]);

  const handleDragStart = useCallback((e, piece, fromSquare) => {
    try {
      if (!game) return;
      
      // console.log('Drag start:', { piece, fromSquare, playerColor, currentTurnColor });
      // console.log('Current game FEN:', game.fen());
      // console.log('Current turn:', game.turn());
      
      // Check if it's the player's piece
      const isPlayerPiece = (playerColor === 'w' && piece === piece.toUpperCase()) ||
                            (playerColor === 'b' && piece === piece.toLowerCase());
      
      // Check if it's the player's turn
      const isPlayersTurn = (currentTurnColor === playerColor);
      
      // console.log('Piece validation:', { isPlayerPiece, isPlayersTurn, piece, playerColor, currentTurnColor });

      if (isPlayerPiece && isPlayersTurn) {
        setDraggingPiece({ piece, fromSquare });
        setSelectedPiece(fromSquare);
        const moves = calculateValidMoves(fromSquare);
        setValidMoves(moves);
        e.dataTransfer.setData('text/plain', '');
        e.currentTarget.style.opacity = '0.4';
        // console.log('Drag allowed for piece:', piece);
        // console.log('Valid moves:', moves);
      } else {
        e.preventDefault();
        // console.log('Drag prevented:', { isPlayerPiece, isPlayersTurn });
      }
    } catch (error) {
      // console.error('Error in handleDragStart:', error);
      e.preventDefault();
    }
  }, [playerColor, currentTurnColor, calculateValidMoves, game]);

  const handleDragOver = useCallback((e, square) => {
    e.preventDefault();
    setDraggedOverSquare(square);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDraggedOverSquare(null);
  }, []);

  const handleDrop = useCallback((e, toSquare) => {
    e.preventDefault();
    if (draggingPiece) {
      onPieceDrop(draggingPiece.fromSquare, toSquare, draggingPiece.piece);
      // Clear selection after move
      setSelectedPiece(null);
      setValidMoves([]);
    }
    setDraggingPiece(null);
    setDraggedOverSquare(null);
  }, [draggingPiece, onPieceDrop]);

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.style.opacity = '1';
    setDraggingPiece(null);
    setDraggedOverSquare(null);
    // Don't clear selection here - let it stay for visual feedback
  }, []);

  const handlePieceClick = useCallback((piece, square) => {
    try {
      if (!game) return;
      
      // console.log('Piece clicked:', { piece, square, playerColor, currentTurnColor });
      // console.log('Current game FEN:', game.fen());
      // console.log('Current turn:', game.turn());
      
      // Check if it's the player's piece
      const isPlayerPiece = (playerColor === 'w' && piece === piece.toUpperCase()) ||
                            (playerColor === 'b' && piece === piece.toLowerCase());
      
      // Check if it's the player's turn
      const isPlayersTurn = (currentTurnColor === playerColor);
      
      if (isPlayerPiece && isPlayersTurn) {
        setSelectedPiece(square);
        const moves = calculateValidMoves(square);
        setValidMoves(moves);
        checkForCheck(); // Check for check status
        // console.log('Piece selected:', square, 'Valid moves:', moves);
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
        // console.log('Piece selection cleared - not player piece or not player turn');
      }
    } catch (error) {
      // console.error('Error in handlePieceClick:', error);
    }
  }, [playerColor, currentTurnColor, calculateValidMoves, game, checkForCheck]);

  return (
    <div className="flex flex-col items-center p-4">
      <div className="text-xl font-semibold mb-2 text-gray-200">
        Current Turn: <span className={currentTurnColor === 'w' ? 'text-white' : 'text-gray-400'}>{currentTurnColor === 'w' ? 'White' : 'Black'}</span>
        {isInCheck && (
          <span className="ml-4 text-red-400 font-bold">CHECK!</span>
        )}
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

            const isDraggedOver = draggedOverSquare === square;
            const isSelected = selectedPiece === square;
            const isValidMove = validMoves.includes(square);
            const isKingInCheck = checkSquare === square;
            
            let squareBg = '';
            if (isLightSquare) {
              if (isKingInCheck) {
                squareBg = 'bg-red-400';
              } else if (isSelected) {
                squareBg = 'bg-yellow-400';
              } else if (isValidMove) {
                squareBg = 'bg-green-400';
              } else if (isDraggedOver) {
                squareBg = 'bg-indigo-600';
              } else {
                squareBg = 'bg-stone-200';
              }
            } else {
              if (isKingInCheck) {
                squareBg = 'bg-red-600';
              } else if (isSelected) {
                squareBg = 'bg-yellow-600';
              } else if (isValidMove) {
                squareBg = 'bg-green-600';
              } else if (isDraggedOver) {
                squareBg = 'bg-indigo-800';
              } else {
                squareBg = 'bg-stone-800';
              }
            }

            return (
              <div
                key={square}
                id={`square-${square}`}
                className={`relative flex items-center justify-center text-5xl lg:text-7xl font-bold transition-colors duration-200 aspect-square ${squareBg} cursor-pointer`}
                onDragOver={(e) => handleDragOver(e, square)}
                onDrop={(e) => handleDrop(e, square)}
                onDragLeave={handleDragLeave}
                onClick={() => {
                  if (isValidMove && selectedPiece) {
                    // Make move by clicking on valid square
                    const piece = board[8 - parseInt(selectedPiece.slice(1))][fileChars.indexOf(selectedPiece.slice(0, 1))];
                    onPieceDrop(selectedPiece, square, piece);
                    setSelectedPiece(null);
                    setValidMoves([]);
                  }
                }}
              >
                <span className="absolute top-1 left-1 text-xs font-mono opacity-50 text-gray-700 dark:text-gray-400">
                  {square}
                </span>
                {pieceChar && (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, piece, square)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handlePieceClick(piece, square)}
                    className="cursor-grab active:cursor-grabbing select-none h-full w-full flex items-center justify-center text-center leading-none drop-shadow-md font-chess"
                    style={{
                      color: piece === piece.toUpperCase() ? '#FFFFFF' : '#1F2937',
                      textShadow: piece === piece.toUpperCase() ? '2px 2px 4px rgba(0,0,0,0.8)' : '2px 2px 4px rgba(255,255,255,0.8)',
                      fontSize: 'clamp(2rem, 8vw, 4rem)',
                    }}
                    title={PIECE_NAMES[piece] || piece}
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
const GameScreen = ({
  playerColor,
  game,
  onPieceDrop,
  statusMessage,
  currentTurnColor,
  playersInRoom,
  handleLeaveRoom
}) => {
  const [fen, setFen] = useState(game.fen());

  useEffect(() => {
    setFen(game.fen());
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
          <button
            onClick={() => {
              // console.log('PIECES object:', PIECES);
              // console.log('Current board:', game.board());
              // console.log('FEN:', game.fen());
              // console.log('Player color:', playerColor);
              // console.log('Current turn:', currentTurnColor);
            }}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Debug Board
          </button>
          <button
            onClick={() => {
              // Test mode: allow all moves
              // console.log('Test mode: allowing all moves');
              // setCurrentTurnColor(playerColor);
            }}
            className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Test Mode (Force Turn)
          </button>
          <button
            onClick={() => {
              setSelectedPiece(null);
              setValidMoves([]);
              // console.log('Selection cleared manually');
            }}
            className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Clear Selection
          </button>
        </div>
      </div>

      <div className="lg:w-3/4 w-full">
        <ChessBoard
          board={game.board().map(row => row.map(sq => {
            if (!sq) return '';
            // Convert chess.js piece format to our PIECES format
            const pieceKey = sq.color === 'w' ? sq.type.toUpperCase() : sq.type.toLowerCase();
            // console.log('Piece:', sq, 'Key:', pieceKey, 'Symbol:', PIECES[pieceKey]);
            return pieceKey;
          }))}
          onPieceDrop={onPieceDrop}
          playerColor={playerColor}
          currentTurnColor={currentTurnColor}
          statusMessage={statusMessage}
          game={game}
        />
      </div>
    </div>
  );
};

// --- Component: QueueScreen ---
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

// --- Component: WelcomeScreen ---
const WelcomeScreen = ({ onJoinQueue, onLogout, user }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md text-center">
        <div className="mb-8">
          <ChessIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Chess Game</h1>
          <p className="text-gray-300">Welcome back, {user?.username}!</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onJoinQueue}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <Play className="mr-2" size={20} />
            Find Match
          </button>

          <button
            onClick={onLogout}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <LogOut className="mr-2" size={20} />
            Logout
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <User size={16} />
            <span>{user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Chess App Component ---
const ChessApp = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [ws, setWs] = useState(null);
  const [screen, setScreen] = useState('welcome');
  const [game, setGame] = useState(() => {
    const newGame = new Chess();
    // Ensure we start with the standard chess position
    // console.log('Initial FEN:', newGame.fen());
    // console.log('Initial board:', newGame.board());
    return newGame;
  });
  const [playerColor, setPlayerColor] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Your turn!');
  const [currentTurnColor, setCurrentTurnColor] = useState('w');
  const [playersInQueueCount, setPlayersInQueueCount] = useState(0);
  const [playersInRoom, setPlayersInRoom] = useState([]);
  const gameIdRef = useRef(null);

  // WebSocket Connection Logic
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const newWs = new WebSocket('wss://chess-backend-zcfp.onrender.com');

        newWs.onopen = () => {
          try {
            // console.log('WebSocket Connected!');
            toast.success('Connected to game server!');
            if (gameIdRef.current) {
              newWs.send(JSON.stringify({ type: 'reconnect', gameId: gameIdRef.current }));
            }
          } catch (error) {
            // console.error('Error in WebSocket onopen:', error);
          }
        };

        newWs.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            // console.log('Received:', message);

            if (!message || !message.type) {
              // console.warn('Invalid message format:', message);
              return;
            }

            switch (message.type) {
              case 'info':
                if (message.message) {
                  toast.info(message.message);
                }
                break;
              case 'error':
                if (message.message) {
                  toast.error(message.message);
                }
                break;
              case 'queue_status':
                if (typeof message.playersInQueue === 'number') {
                  setPlayersInQueueCount(message.playersInQueue);
                }
                break;
              case 'game_start':
                if (message.color && message.gameId) {
                  setScreen('game');
                  setPlayerColor(message.color);
                  gameIdRef.current = message.gameId;
                  setPlayersInRoom(message.players || []);
                  setCurrentTurnColor('w');
                  setStatusMessage(message.message || 'Game started!');
                  // Initialize game with the received FEN
                  const startGame = new Chess(message.fen || 'start');
                  setGame(startGame);
                  toast.success('Game started!');
                }
                break;
              case 'board_update':
                if (message.fen) {
                  setCurrentTurnColor(message.fen.split(' ')[1] === 'w' ? 'w' : 'b');
                  setStatusMessage(message.message || 'Board updated');
                  // Update the local game state with the new FEN
                  const newGame = new Chess(message.fen);
                  setGame(newGame);
                }
                break;
              case 'game_end':
                setScreen('welcome');
                setGame(new Chess());
                setPlayerColor(null);
                gameIdRef.current = null;
                if (message.message) {
                  toast.info(message.message);
                }
                break;
              default:
                // console.log('Unhandled message type:', message.type);
            }
          } catch (error) {
            // console.error('Error parsing message:', error);
            // console.error('Raw message data:', event.data);
          }
        };

        newWs.onclose = () => {
          try {
            // console.log('WebSocket Disconnected');
            toast.error('Connection lost. Trying to reconnect...');
            setTimeout(connectWebSocket, 3000);
          } catch (error) {
            // console.error('Error in WebSocket onclose:', error);
          }
        };

        newWs.onerror = (error) => {
          try {
            // console.error('WebSocket Error:', error);
            toast.error('Connection error');
          } catch (toastError) {
            // console.error('Error showing toast for WebSocket error:', toastError);
          }
        };

        setWs(newWs);
      } catch (error) {
        // console.error('Error creating WebSocket connection:', error);
      }
    };

    if (isAuthenticated) {
    connectWebSocket();
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isAuthenticated]);

  const handleJoinQueue = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'join_queue' }));
      setScreen('queue');
      setStatusMessage('Waiting for an opponent...');
    } else {
      toast.error('Not connected to server');
    }
  };

  const handleCancelQueue = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'cancel_queue' }));
    }
    setScreen('welcome');
  };

  const handleLeaveRoom = () => {
    if (ws && ws.readyState === WebSocket.OPEN && gameIdRef.current) {
      ws.send(JSON.stringify({ type: 'leave_game', gameId: gameIdRef.current }));
    }
      setScreen('welcome');
      setGame(new Chess());
      setPlayerColor(null);
      gameIdRef.current = null;
  };

  const handlePieceDrop = (fromSquare, toSquare, piece) => {
    // console.log('Piece drop attempt:', { fromSquare, toSquare, piece, gameId: gameIdRef.current });
    
    if (ws && ws.readyState === WebSocket.OPEN && gameIdRef.current) {
      const moveData = {
        type: 'make_move',
        gameId: gameIdRef.current,
        move: { from: fromSquare, to: toSquare, piece: piece }
      };
      // console.log('Sending move to server:', moveData);
      ws.send(JSON.stringify(moveData));
    } else {
      // console.log('Cannot send move:', { wsReady: ws?.readyState, gameId: gameIdRef.current });
    }
  };

  const handleLogout = () => {
    logout();
    setScreen('welcome');
    setGame(new Chess());
    setPlayerColor(null);
    gameIdRef.current = null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <>
      {screen === 'welcome' && (
        <WelcomeScreen 
          onJoinQueue={handleJoinQueue}
          onLogout={handleLogout}
          user={user}
        />
      )}
      {screen === 'queue' && (
        <QueueScreen
          message="Waiting for an opponent..."
          onCancelQueue={handleCancelQueue}
          playersInQueueCount={playersInQueueCount}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          playerColor={playerColor}
          game={game}
          onPieceDrop={handlePieceDrop}
          statusMessage={statusMessage}
          currentTurnColor={currentTurnColor}
          playersInRoom={playersInRoom}
          handleLeaveRoom={handleLeaveRoom}
        />
      )}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
};

// --- Main App Component with AuthProvider ---
const App = () => {
  return (
    <AuthProvider>
      <ChessApp />
    </AuthProvider>
  );
};

export default App;