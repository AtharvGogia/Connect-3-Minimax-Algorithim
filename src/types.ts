export type Player = 'BLUE' | 'GOLD' | null;

export interface GameState {
  grid: Player[][];
  currentPlayer: Player;
  winner: Player | 'DRAW' | null;
  winningCells?: { row: number; col: number }[];
  size: number;
  connectToWin: number;
}

export interface TreeNode {
  id: string;
  name: string;
  depth: number;
  score?: number;
  alpha?: number;
  beta?: number;
  move?: { row: number; col: number };
  grid: Player[][];
  children: TreeNode[];
  isPruned?: boolean;
  isMaximizing: boolean;
  isEvaluated?: boolean;
  isActive?: boolean;
  bestMove?: { row: number; col: number };
}

export interface MinimaxResult {
  score: number;
  move?: { row: number; col: number };
  tree: TreeNode;
}
