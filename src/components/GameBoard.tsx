import React from 'react';
import { Player, GameState } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GameBoardProps {
  gameState: GameState;
  onMove: (row: number, col: number) => void;
  isThinking: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onMove, isThinking }) => {
  const { grid, size, winner, winningCells } = gameState;

  const isWinningCell = (r: number, c: number) => {
    return winningCells?.some(cell => cell.row === r && cell.col === c);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white h-full relative">
      {/* Instructions */}
      <div className={cn(
        "mb-8 text-center transition-all duration-500",
        isThinking && "opacity-20 blur-[1px]"
      )}>
        <p className="text-[10px] font-mono text-black/40 uppercase tracking-[0.3em] font-bold">
          Objective: Connect {gameState.connectToWin} in a row
        </p>
      </div>

      <div className={cn(
        "flex flex-row items-center gap-12 transition-all duration-500",
        isThinking && "opacity-40 scale-[0.98] blur-[1px]"
      )}>
        {/* Grid */}
        <div 
          className={cn(
            "grid gap-4 p-6 bg-white rounded-xl border border-black/20 transition-all duration-700",
            !winner && gameState.currentPlayer === 'BLUE' ? "shadow-[0_0_60px_rgba(59,130,246,0.35)] border-blue-200" : 
            !winner && gameState.currentPlayer === 'GOLD' ? "shadow-[0_0_60px_rgba(251,191,36,0.35)] border-amber-200" : 
            winner && winner !== 'DRAW' ? "shadow-[0_0_60px_rgba(34,197,94,0.35)] border-green-200" :
            "shadow-2xl border-black/20"
          )}
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const winning = isWinningCell(r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => !winner && !isThinking && onMove(r, c)}
                  disabled={!!cell || !!winner || isThinking}
                  className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 transition-all duration-300 flex items-center justify-center relative",
                    !cell && !winner && !isThinking ? "border-black/30 hover:border-black/50 bg-black/[0.05]" : "border-black/20",
                    cell === 'BLUE' ? (winning ? "bg-green-600 border-green-700 shadow-[0_0_20px_rgba(34,197,94,0.6)]" : "bg-blue-600 border-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.4)]") : 
                    cell === 'GOLD' ? (winning ? "bg-green-500 border-green-600 shadow-[0_0_20px_rgba(34,197,94,0.6)]" : "bg-amber-500 border-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.4)]") : 
                    "bg-transparent"
                  )}
                >
                  {cell && (
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2",
                      cell === 'BLUE' ? "border-white/60 bg-white/20" : "border-white/60 bg-white/20"
                    )} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isThinking && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-black/10 shadow-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
            <span className="text-[10px] font-mono text-amber-700 uppercase tracking-[0.2em] font-bold">
              Processing Paths...
            </span>
          </div>
        </div>
      )}

      {/* Winner Message */}
      {winner && (
        <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className={cn(
            "text-2xl font-serif italic mb-1",
            winner === 'BLUE' ? "text-blue-700" : winner === 'GOLD' ? "text-amber-700" : "text-black/80"
          )}>
            {winner === 'DRAW' ? "Draw" : `${winner === 'BLUE' ? 'Blue' : 'Gold'} Wins`}
          </h2>
          <p className="text-[10px] font-mono text-black/70 uppercase tracking-widest">Game Concluded</p>
        </div>
      )}
    </div>
  );
};
