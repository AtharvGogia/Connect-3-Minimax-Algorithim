/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameBoard } from './components/GameBoard';
import { TreeVisualization } from './components/TreeVisualization';
import { GameState, Player, TreeNode } from './types';
import { createInitialGrid, checkWinner, minimaxGenerator, resetNodeCounter } from './logic/game';
import { Settings, RefreshCw, Layers, Grid3X3, Grid2X2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [size] = useState<3>(3);
  const depth = 3; // Fixed depth
  const [gameState, setGameState] = useState<GameState>({
    grid: createInitialGrid(3),
    currentPlayer: 'BLUE',
    winner: null,
    size: 3,
    connectToWin: 3,
  });
  const [isThinking, setIsThinking] = useState(false);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [bestMove, setBestMove] = useState<{ row: number; col: number } | null>(null);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  const [logs, setLogs] = useState<{ id: string; message: string; type: 'info' | 'decision' | 'prune' }[]>([]);
  const aiMoveRef = useRef<number | null>(null);

  const addLog = (message: string, type: 'info' | 'decision' | 'prune' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), message, type }, ...prev].slice(0, 50));
  };

  const handleMove = useCallback((row: number, col: number) => {
    if (gameState.grid[row][col] || gameState.winner || isThinking) return;

    const newGrid = gameState.grid.map(r => [...r]);
    newGrid[row][col] = gameState.currentPlayer;

    const winner = checkWinner(newGrid, gameState.connectToWin);
    
    if (gameState.currentPlayer === 'BLUE') {
      addLog(`Player Blue placed at (${row}, ${col})`);
    }

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      currentPlayer: winner ? prev.currentPlayer : (prev.currentPlayer === 'BLUE' ? 'GOLD' : 'BLUE'),
      winner,
    }));
  }, [gameState, isThinking]);

  const aiMove = useCallback(async () => {
    if (gameState.winner || gameState.currentPlayer !== 'GOLD') return;

    setIsThinking(true);
    setBestMove(null);
    addLog('AI Gold is calculating optimal move...', 'info');
    resetNodeCounter();
    
    const generator = minimaxGenerator(
      gameState.grid,
      depth,
      -Infinity,
      Infinity,
      true,
      gameState.connectToWin
    );

    let lastTree: TreeNode | null = null;
    let finalResult: any;

    const step = () => {
      const { value, done } = generator.next();
      if (done) {
        finalResult = value;
        if (finalResult.move) {
          addLog(`AI Gold decided on move (${finalResult.move.row}, ${finalResult.move.col}) with score ${finalResult.score}`, 'decision');
          setBestMove(finalResult.move);
          
          // Delay the actual move to let the user see the result in the tree
          window.setTimeout(() => {
            if (finalResult.move) {
              handleMove(finalResult.move.row, finalResult.move.col);
            }
            setIsThinking(false);
          }, 1500);
        } else {
          setIsThinking(false);
        }
        aiMoveRef.current = null;
        return;
      }
      lastTree = value as TreeNode;
      
      // Check for new prunes to log
      const findPrunes = (node: TreeNode) => {
        node.children.forEach(child => {
          if (child.isPruned && !logs.some(l => l.message.includes(`Pruned branch at (${child.move?.row}, ${child.move?.col})`))) {
            addLog(`Alpha-Beta: Pruned branch at (${child.move?.row}, ${child.move?.col})`, 'prune');
          }
          findPrunes(child);
        });
      };
      if (lastTree) findPrunes(lastTree);

      setTreeData(lastTree);
      aiMoveRef.current = window.setTimeout(step, 5);
    };

    aiMoveRef.current = window.setTimeout(step, 5);
  }, [gameState, depth, handleMove, logs]);

  useEffect(() => {
    if (gameState.currentPlayer === 'GOLD' && !gameState.winner && !isThinking) {
      aiMove();
    }
  }, [gameState.currentPlayer, gameState.winner, isThinking, aiMove]);

  const resetGame = () => {
    if (aiMoveRef.current) {
      window.clearTimeout(aiMoveRef.current);
      aiMoveRef.current = null;
    }
    setGameState({
      grid: createInitialGrid(3),
      currentPlayer: 'BLUE',
      winner: null,
      size: 3,
      connectToWin: 3,
    });
    setTreeData(null);
    setBestMove(null);
    setIsThinking(false);
    setLogs([]);
    addLog('Game Reset. Player Blue to start.');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      {/* Persistent Title Bar */}
      <header className="flex-shrink-0 h-16 border-b border-black/5 px-6 flex items-center justify-between bg-white z-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-black">Connect 3</h1>
            <span className="text-[9px] font-mono text-black/40 uppercase tracking-widest">Minimax Algorithim</span>
          </div>
          <div className="h-4 w-[1px] bg-black/10 mx-2" />
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              gameState.winner ? "bg-green-500" : (isThinking ? "bg-amber-500 animate-pulse" : "bg-blue-500")
            )} />
            <span className="text-[10px] font-mono text-black/60 uppercase tracking-widest">
              {gameState.winner === 'DRAW' 
                ? "Draw" 
                : (gameState.winner ? `${gameState.winner} Wins!` : (isThinking ? "AI Calculating..." : `${gameState.currentPlayer}'s Turn`))
              }
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => resetGame()}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw size={14} className={cn(isThinking && "animate-spin")} />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Reset Game</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left Side: Game Board & Logs */}
        <div className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <GameBoard 
              gameState={gameState} 
              onMove={handleMove} 
              isThinking={isThinking} 
            />
          </div>

          {/* Log Console */}
          <div className={cn(
            "flex-shrink-0 bg-black border-t border-white/10 transition-all duration-300 overflow-hidden",
            isLogsCollapsed ? "h-10" : "h-48"
          )}>
            <div 
              className="flex items-center justify-between p-3 border-b border-white/5 cursor-pointer hover:bg-white/5"
              onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
            >
              <div className="flex items-center gap-2">
                <span className="text-white/40 uppercase tracking-widest text-[10px]">System Logs</span>
                {isThinking && <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/20 text-[10px]">v1.1.0</span>
                <div className="text-white/40">
                  {isLogsCollapsed ? <Layers size={12} /> : <Grid2X2 size={12} />}
                </div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-[10px] h-[calc(100%-40px)]">
              <div className="space-y-1">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-3">
                    <span className="text-white/20">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className={cn(
                      log.type === 'decision' ? "text-amber-400" : 
                      log.type === 'prune' ? "text-amber-400/40" : 
                      "text-white/60"
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && <div className="text-white/10 italic">Waiting for input...</div>}
              </div>
            </div>
          </div>
          
          {/* Credits Footer */}
          <div className="p-4 flex-shrink-0 bg-white border-t border-black/5">
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-black/20 uppercase tracking-widest mb-1">Developed By</p>
              <p className="text-[10px] font-mono text-black/60">Atharv Gogia - RA2411003010944</p>
              <p className="text-[10px] font-mono text-black/60">Vedant Panchal - RA2411003010934</p>
              <p className="text-[10px] font-mono text-black/60">Alveera Singh Sood - RA2411003010927</p>
            </div>
          </div>
        </div>

        {/* Right Side: Tree Visualization */}
        <div className="w-[45%] h-full">
          <TreeVisualization data={treeData} isThinking={isThinking} bestMove={bestMove} />
        </div>
      </div>
    </div>
  );
}
