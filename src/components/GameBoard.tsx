/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, GameState } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GameBoardProps {
  gameState: GameState;
  onMove: (row: number, col: number) => void;
  isThinking: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onMove, isThinking }) => {
  const { grid, size, winner } = gameState;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white h-full">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-serif italic text-black mb-2 tracking-tight">Connect 3</h1>
        <p className="text-[10px] font-mono uppercase tracking-widest text-black/40">Architectural Strategy Engine</p>
      </div>

      <div 
        className="grid gap-4 p-6 bg-white shadow-2xl rounded-xl border border-black/5"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => !winner && !isThinking && onMove(r, c)}
              disabled={!!cell || !!winner || isThinking}
              className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 transition-all duration-300 flex items-center justify-center",
                !cell && !winner && !isThinking ? "border-black/10 hover:border-black/30 bg-black/[0.02]" : "border-black/5",
                cell === 'BLUE' ? "bg-blue-500 border-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]" : 
                cell === 'GOLD' ? "bg-amber-400 border-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.3)]" : 
                "bg-transparent"
              )}
            >
              {cell && (
                <div className={cn(
                  "w-8 h-8 rounded-full border-2",
                  cell === 'BLUE' ? "border-white/40 bg-white/10" : "border-white/40 bg-white/10"
                )} />
              )}
            </button>
          ))
        )}
      </div>

      <div className="mt-12 flex flex-col items-center gap-6 w-full max-w-sm">
        {winner ? (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className={cn(
              "text-2xl font-serif italic mb-1",
              winner === 'BLUE' ? "text-blue-600" : winner === 'GOLD' ? "text-amber-600" : "text-black/60"
            )}>
              {winner === 'DRAW' ? "Draw" : `${winner === 'BLUE' ? 'Blue' : 'Gold'} Dominance`}
            </h2>
            <p className="text-[10px] font-mono text-black/40 uppercase tracking-widest">Game Concluded</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className={cn(
              "px-4 py-2 rounded-full border transition-all duration-500",
              gameState.currentPlayer === 'BLUE' ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-transparent border-transparent text-black/20"
            )}>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Player Blue</span>
            </div>
            <div className="w-px h-4 bg-black/10" />
            <div className={cn(
              "px-4 py-2 rounded-full border transition-all duration-500",
              gameState.currentPlayer === 'GOLD' ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-transparent border-transparent text-black/20"
            )}>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">AI Gold</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
