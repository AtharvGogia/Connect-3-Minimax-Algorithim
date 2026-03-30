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
  const [size, setSize] = useState<number>(3);
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
  const algorithmMoveRef = useRef<number | null>(null);

  const addLog = (message: string, type: 'info' | 'decision' | 'prune' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), message, type }, ...prev].slice(0, 50));
  };

  const handleMove = useCallback((row: number, col: number) => {
    if (gameState.grid[row][col] || gameState.winner || isThinking) return;

    const newGrid = gameState.grid.map(r => [...r]);
    newGrid[row][col] = gameState.currentPlayer;

    const { winner, winningCells } = checkWinner(newGrid, gameState.connectToWin);
    
    if (gameState.currentPlayer === 'BLUE') {
      addLog(`Player Blue placed at (${row}, ${col})`);
    }

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      currentPlayer: winner ? prev.currentPlayer : (prev.currentPlayer === 'BLUE' ? 'GOLD' : 'BLUE'),
      winner,
      winningCells,
    }));
  }, [gameState, isThinking]);

  const algorithmMove = useCallback(async () => {
    if (gameState.winner || gameState.currentPlayer !== 'GOLD') return;

    setIsThinking(true);
    setBestMove(null);
    addLog('Running Algorithm...', 'info');
    resetNodeCounter();
    
    // Dynamic depth based on grid size
    const maxDepth = size;
    const stepSpeed = size === 3 ? 2 : size === 4 ? 1 : 0.5;
    const startTime = Date.now();
    const TIMEOUT_MS = 4000;

    const generator = minimaxGenerator(
      gameState.grid,
      maxDepth,
      -Infinity,
      Infinity,
      true,
      gameState.connectToWin
    );

    let lastTree: TreeNode | null = null;
    let finalResult: any;

    const step = () => {
      const { value, done } = generator.next();
      
      // Check for timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > TIMEOUT_MS && !done) {
        // Force completion if taking too long
        let lastVal = value;
        let isDone = done;
        while (!isDone) {
          const next = generator.next();
          lastVal = next.value;
          isDone = next.done;
        }
        finalResult = lastVal;
        handleFinalDecision(finalResult);
        return;
      }

      if (done) {
        finalResult = value;
        handleFinalDecision(finalResult);
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
      algorithmMoveRef.current = window.setTimeout(step, stepSpeed);
    };

    const handleFinalDecision = (result: any) => {
      if (result.move) {
        addLog(`Algorithm decided on move (${result.move.row}, ${result.move.col}) with score ${result.score}`, 'decision');
        setBestMove(result.move);
        
        window.setTimeout(() => {
          if (result.move) {
            handleMove(result.move.row, result.move.col);
          }
          setIsThinking(false);
        }, 100);
      } else {
        setIsThinking(false);
      }
      algorithmMoveRef.current = null;
    };

    algorithmMoveRef.current = window.setTimeout(step, stepSpeed);
  }, [gameState, size, handleMove, logs]);

  useEffect(() => {
    if (gameState.currentPlayer === 'GOLD' && !gameState.winner && !isThinking) {
      algorithmMove();
    }
  }, [gameState.currentPlayer, gameState.winner, isThinking, algorithmMove]);

  const resetGame = () => {
    if (algorithmMoveRef.current) {
      window.clearTimeout(algorithmMoveRef.current);
      algorithmMoveRef.current = null;
    }
    setGameState({
      grid: createInitialGrid(size),
      currentPlayer: 'BLUE',
      winner: null,
      winningCells: undefined,
      size: size,
      connectToWin: size === 3 ? 3 : 4,
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
      <header className="flex-shrink-0 h-16 border-b border-black/20 px-6 flex items-center justify-between bg-white z-50">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-black">Connect X</h1>
            <span className="text-[9px] font-mono text-black/70 uppercase tracking-widest">Minimax Algorithm</span>
          </div>
          <div className="h-4 w-[1px] bg-black/20 mx-2" />
          
          {/* Grid Size Selector */}
          <div className="flex items-center gap-1 bg-black/[0.03] p-1 rounded-lg border border-black/5">
            {[3, 4, 5].map(s => (
              <button
                key={s}
                onClick={() => {
                  if (!isThinking) {
                    setSize(s);
                    setGameState({
                      grid: createInitialGrid(s),
                      currentPlayer: 'BLUE',
                      winner: null,
                      winningCells: undefined,
                      size: s,
                      connectToWin: s === 3 ? 3 : 4,
                    });
                    setTreeData(null);
                    setBestMove(null);
                    setLogs([]);
                    addLog(`Grid resized to ${s}x${s}. Player Blue to start.`);
                  }
                }}
                disabled={isThinking}
                className={cn(
                  "px-3 py-1 text-[10px] font-mono rounded-md transition-all",
                  size === s ? "bg-black text-white shadow-lg" : "text-black/40 hover:bg-black/5"
                )}
              >
                {s}x{s}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-black/20 mx-2" />
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              gameState.winner ? "bg-green-600" : (isThinking ? "bg-amber-600 animate-pulse" : "bg-blue-600")
            )} />
            <span className="text-[10px] font-mono text-black/90 uppercase tracking-widest">
              {gameState.winner === 'DRAW' 
                ? "Draw" 
                : (gameState.winner ? `${gameState.winner} Wins!` : (isThinking ? "Running Algorithm..." : `${gameState.currentPlayer}'s Turn`))
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
        {/* Left Side: Game Board */}
        <div className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <GameBoard 
              gameState={gameState} 
              onMove={handleMove} 
              isThinking={isThinking} 
            />
          </div>
          
          {/* Credits Footer */}
          <div className="p-4 flex-shrink-0 bg-white border-t border-black/20">
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-black/50 uppercase tracking-widest mb-1">Developed By</p>
              <p className="text-[10px] font-mono text-black/90">Atharv Gogia - RA2411003010944</p>
              <p className="text-[10px] font-mono text-black/90">Vedant Panchal - RA2411003010934</p>
              <p className="text-[10px] font-mono text-black/90">Alveera Singh Sood - RA2411003010927</p>
            </div>
          </div>
        </div>

        {/* Right Side: Tree Visualization & Logs */}
        <div className="w-[45%] h-full border-l border-black/20 flex flex-col">
          <div className="flex-1 min-h-0">
            <TreeVisualization data={treeData} isThinking={isThinking} bestMove={bestMove} />
          </div>

          {/* Log Console */}
          <div className={cn(
            "flex-shrink-0 bg-black border-t border-white/20 transition-all duration-300 overflow-hidden",
            isLogsCollapsed ? "h-10" : "h-64"
          )}>
            <div 
              className="flex items-center justify-between p-3 border-b border-white/10 cursor-pointer hover:bg-white/10"
              onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
            >
              <div className="flex items-center gap-2">
                <span className="text-white/70 uppercase tracking-widest text-[10px]">System Logs</span>
                {isThinking && <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-white/60">
                  {isLogsCollapsed ? <Layers size={12} /> : <Grid2X2 size={12} />}
                </div>
              </div>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-[10px] h-[calc(100%-40px)]">
              <div className="space-y-1">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-3">
                    <span className="text-white/40">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className={cn(
                      log.type === 'decision' ? "text-amber-400" : 
                      log.type === 'prune' ? "text-amber-400/60" : 
                      "text-white/90"
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && <div className="text-white/30 italic">Waiting for input...</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
