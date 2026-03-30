/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, GameState, TreeNode } from '../types';

export function createInitialGrid(size: number): Player[][] {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

export interface WinResult {
  winner: Player | 'DRAW';
  cells?: { row: number; col: number }[];
}

export function checkWinner(grid: Player[][], connectToWin: number): WinResult | null {
  const size = grid.length;

  // Check rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - connectToWin; c++) {
      const p = grid[r][c];
      if (p) {
        let win = true;
        const cells = [{ row: r, col: c }];
        for (let i = 1; i < connectToWin; i++) {
          if (grid[r][c + i] !== p) {
            win = false;
            break;
          }
          cells.push({ row: r, col: c + i });
        }
        if (win) return { winner: p, cells };
      }
    }
  }

  // Check cols
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - connectToWin; r++) {
      const p = grid[r][c];
      if (p) {
        let win = true;
        const cells = [{ row: r, col: c }];
        for (let i = 1; i < connectToWin; i++) {
          if (grid[r + i][c] !== p) {
            win = false;
            break;
          }
          cells.push({ row: r + i, col: c });
        }
        if (win) return { winner: p, cells };
      }
    }
  }

  // Check diagonals
  for (let r = 0; r <= size - connectToWin; r++) {
    for (let c = 0; c <= size - connectToWin; c++) {
      const p = grid[r][c];
      if (p) {
        let win = true;
        const cells = [{ row: r, col: c }];
        for (let i = 1; i < connectToWin; i++) {
          if (grid[r + i][c + i] !== p) {
            win = false;
            break;
          }
          cells.push({ row: r + i, col: c + i });
        }
        if (win) return { winner: p, cells };
      }
    }
  }

  for (let r = connectToWin - 1; r < size; r++) {
    for (let c = 0; c <= size - connectToWin; c++) {
      const p = grid[r][c];
      if (p) {
        let win = true;
        const cells = [{ row: r, col: c }];
        for (let i = 1; i < connectToWin; i++) {
          if (grid[r - i][c + i] !== p) {
            win = false;
            break;
          }
          cells.push({ row: r - i, col: c + i });
        }
        if (win) return { winner: p, cells };
      }
    }
  }

  // Check draw
  if (grid.every(row => row.every(cell => cell !== null))) return { winner: 'DRAW' };

  return null;
}

export function evaluate(grid: Player[][], connectToWin: number): number {
  const result = checkWinner(grid, connectToWin);
  if (result?.winner === 'GOLD') return 1000;
  if (result?.winner === 'BLUE') return -1000;
  if (result?.winner === 'DRAW') return 0;

  let score = 0;
  const size = grid.length;

  // Simple heuristic: count open lines of connectToWin-1
  const checkLine = (line: Player[]) => {
    let goldCount = 0;
    let blueCount = 0;
    let emptyCount = 0;
    for (const cell of line) {
      if (cell === 'GOLD') goldCount++;
      else if (cell === 'BLUE') blueCount++;
      else emptyCount++;
    }
    if (goldCount > 0 && blueCount === 0) return Math.pow(10, goldCount);
    if (blueCount > 0 && goldCount === 0) return -Math.pow(10, blueCount);
    return 0;
  };

  // Rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - connectToWin; c++) {
      score += checkLine(grid[r].slice(c, c + connectToWin));
    }
  }

  // Cols
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - connectToWin; r++) {
      const line = [];
      for (let i = 0; i < connectToWin; i++) line.push(grid[r + i][c]);
      score += checkLine(line);
    }
  }

  // Diagonals
  for (let r = 0; r <= size - connectToWin; r++) {
    for (let c = 0; c <= size - connectToWin; c++) {
      const line = [];
      for (let i = 0; i < connectToWin; i++) line.push(grid[r + i][c + i]);
      score += checkLine(line);
    }
  }

  for (let r = connectToWin - 1; r < size; r++) {
    for (let c = 0; c <= size - connectToWin; c++) {
      const line = [];
      for (let i = 0; i < connectToWin; i++) line.push(grid[r - i][c + i]);
      score += checkLine(line);
    }
  }

  return score;
}

let nodeIdCounter = 0;

export function* minimaxGenerator(
  grid: Player[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  connectToWin: number,
  move?: { row: number; col: number }
): Generator<TreeNode, { score: number; move?: { row: number; col: number } }, any> {
  const nodeId = `node-${nodeIdCounter++}`;
  const winner = checkWinner(grid, connectToWin);
  
  const node: TreeNode = {
    id: nodeId,
    name: move ? `${move.row},${move.col}` : 'Root',
    depth,
    grid: grid.map(row => [...row]),
    children: [],
    isMaximizing,
    move,
    alpha,
    beta,
    isActive: true
  };

  if (depth === 0 || winner) {
    node.score = evaluate(grid, connectToWin);
    node.isEvaluated = true;
    yield { ...node };
    node.isActive = false;
    return { score: node.score, move };
  }

  const size = grid.length;
  const moves: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) moves.push({ row: r, col: c });
    }
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    let bestMove;

    for (const m of moves) {
      grid[m.row][m.col] = 'GOLD';
      const childGen = minimaxGenerator(grid, depth - 1, alpha, beta, false, connectToWin, m);
      
      let result: { score: number; move?: { row: number; col: number } };
      while (true) {
        const next = childGen.next();
        if (next.done) {
          result = next.value;
          break;
        }
        const childNode = next.value as TreeNode;
        // Update current node's children list to include the latest state of the child
        const existingIdx = node.children.findIndex(c => c.id === childNode.id);
        if (existingIdx >= 0) node.children[existingIdx] = childNode;
        else node.children.push(childNode);
        
        yield { ...node };
      }
      
      grid[m.row][m.col] = null;

      if (result.score > maxEval) {
        maxEval = result.score;
        bestMove = m;
      }
      alpha = Math.max(alpha, result.score);
      node.alpha = alpha;
      node.score = maxEval;
      node.bestMove = bestMove;

      if (beta <= alpha) {
        // Pruning
        // Mark remaining moves as pruned
        const remainingMoves = moves.slice(moves.indexOf(m) + 1);
        for (const rm of remainingMoves) {
          node.children.push({
            id: `pruned-${nodeIdCounter++}`,
            name: `${rm.row},${rm.col}`,
            depth: depth - 1,
            grid: grid.map(row => [...row]),
            children: [],
            isMaximizing: false,
            isPruned: true,
            move: rm
          });
        }
        yield { ...node };
        break;
      }
      yield { ...node };
    }
    node.isEvaluated = true;
    node.isActive = false;
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    let bestMove;

    for (const m of moves) {
      grid[m.row][m.col] = 'BLUE';
      const childGen = minimaxGenerator(grid, depth - 1, alpha, beta, true, connectToWin, m);
      
      let result: { score: number; move?: { row: number; col: number } };
      while (true) {
        const next = childGen.next();
        if (next.done) {
          result = next.value;
          break;
        }
        const childNode = next.value as TreeNode;
        const existingIdx = node.children.findIndex(c => c.id === childNode.id);
        if (existingIdx >= 0) node.children[existingIdx] = childNode;
        else node.children.push(childNode);
        
        yield { ...node };
      }
      
      grid[m.row][m.col] = null;

      if (result.score < minEval) {
        minEval = result.score;
        bestMove = m;
      }
      beta = Math.min(beta, result.score);
      node.beta = beta;
      node.score = minEval;
      node.bestMove = bestMove;

      if (beta <= alpha) {
        // Pruning
        const remainingMoves = moves.slice(moves.indexOf(m) + 1);
        for (const rm of remainingMoves) {
          node.children.push({
            id: `pruned-${nodeIdCounter++}`,
            name: `${rm.row},${rm.col}`,
            depth: depth - 1,
            grid: grid.map(row => [...row]),
            children: [],
            isMaximizing: true,
            isPruned: true,
            move: rm
          });
        }
        yield { ...node };
        break;
      }
      yield { ...node };
    }
    node.isEvaluated = true;
    node.isActive = false;
    return { score: minEval, move: bestMove };
  }
}

export function resetNodeCounter() {
  nodeIdCounter = 0;
}
