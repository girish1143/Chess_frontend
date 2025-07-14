import React from 'react';

const ChessPieceTest = () => {
  const PIECES = {
    'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
    'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Chess Piece Test</h1>
      
      <div className="grid grid-cols-6 gap-4 mb-8">
        {Object.entries(PIECES).map(([key, symbol]) => (
          <div key={key} className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-4xl font-chess mb-2">{symbol}</div>
            <div className="text-sm text-gray-400">{key}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Chess Board Test</h2>
        <div className="grid grid-cols-8 gap-0 border-4 border-gray-600 w-64 h-64">
          {Array.from({ length: 64 }, (_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isLightSquare = (row + col) % 2 === 0;
            const squareBg = isLightSquare ? 'bg-stone-200' : 'bg-stone-800';
            
            return (
              <div key={i} className={`${squareBg} flex items-center justify-center text-2xl font-chess`}>
                {i === 0 && '♔'} {/* White King */}
                {i === 7 && '♚'} {/* Black King */}
                {i === 1 && '♕'} {/* White Queen */}
                {i === 6 && '♛'} {/* Black Queen */}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChessPieceTest; 