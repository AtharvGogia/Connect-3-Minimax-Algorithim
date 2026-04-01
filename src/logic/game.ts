import { Player, GameState, TreeNode } from '../types';

export function createInitialGrid(size: number): Player[][] {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

export interface WinnerInfo {
  winner: Player | 'DRAW' | null;
  winningCells?: { row: number; col: number }[];
}

export function checkWinner(grid: Player[][], connectToWin: number): WinnerInfo {
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
        if (win) return { winner: p, winningCells: cells };
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
        if (win) return { winner: p, winningCells: cells };
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
        if (win) return { winner: p, winningCells: cells };
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
        if (win) return { winner: p, winningCells: cells };
      }
    }
  }

  // Check draw
  if (grid.every(row => row.every(cell => cell !== null))) return { winner: 'DRAW' };

  return { winner: null };
}

/**
 * Heuristic evaluation function for the board state.
 * 
 * Scores are assigned based on potential winning lines for both players.
 * - Winning for GOLD (Maximizer): +10,000
 * - Winning for BLUE (Minimizer): -10,000
 * - Draw: 0
 * 
 * For non-terminal states, it counts potential lines (rows, columns, diagonals) 
 * that could still lead to a win for each player, assigning higher scores 
 * for lines with more pieces.
 */
export function evaluate(grid: Player[][], connectToWin: number): number {
  const { winner } = checkWinner(grid, connectToWin);
  if (winner === 'GOLD') return 10000;
  if (winner === 'BLUE') return -10000;
  if (winner === 'DRAW') return 0;

  let score = 0;
  const size = grid.length;

  /**
   * Helper function to score a single line of pieces.
   * If a line contains pieces from both players, it's worth 0 as it can't lead to a win.
   * Otherwise, it returns a score proportional to the number of pieces in the line.
   */
  const checkLine = (line: Player[]) => {
    let goldCount = 0;
    let blueCount = 0;
    for (const cell of line) {
      if (cell === 'GOLD') goldCount++;
      else if (cell === 'BLUE') blueCount++;
    }
    // If only one player has pieces in this line, it's a potential win
    if (goldCount > 0 && blueCount === 0) return Math.pow(10, goldCount);
    if (blueCount > 0 && goldCount === 0) return -Math.pow(10, blueCount);
    return 0;
  };

  // Check all possible lines (rows, columns, and diagonals)
  // Rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - connectToWin; c++) {
      score += checkLine(grid[r].slice(c, c + connectToWin));
    }
  }

  // Columns
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - connectToWin; r++) {
      const line = [];
      for (let i = 0; i < connectToWin; i++) line.push(grid[r + i][c]);
      score += checkLine(line);
    }
  }

  // Diagonals (Top-Left to Bottom-Right)
  for (let r = 0; r <= size - connectToWin; r++) {
    for (let c = 0; c <= size - connectToWin; c++) {
      const line = [];
      for (let i = 0; i < connectToWin; i++) line.push(grid[r + i][c + i]);
      score += checkLine(line);
    }
  }

  // Diagonals (Bottom-Left to Top-Right)
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

/**
 * Minimax algorithm generator with Alpha-Beta pruning.
 * 
 * This is a generator function that yields the current state of the search tree 
 * at each step, allowing for real-time visualization of the algorithm's progress.
 * 
 * @param grid The current game board state.
 * @param depth The maximum search depth.
 * @param alpha The best value the maximizer can guarantee.
 * @param beta The best value the minimizer can guarantee.
 * @param isMaximizing True if it's the maximizer's turn (GOLD), false otherwise (BLUE).
 * @param connectToWin The number of pieces in a row required to win.
 * @param move The move that led to this state (for visualization).
 */
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
  const { winner } = checkWinner(grid, connectToWin);
  
  // Create a node representing the current state in the search tree
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

  // Base case: terminal state (win/draw) or maximum depth reached
  if (depth === 0 || winner) {
    node.score = evaluate(grid, connectToWin);
    node.isEvaluated = true;
    yield { ...node };
    node.isActive = false;
    return { score: node.score, move };
  }

  // Find all available moves on the grid
  const size = grid.length;
  const moves: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) moves.push({ row: r, col: c });
    }
  }

  // Move ordering: prioritize moves closer to the center for better pruning efficiency
  moves.sort((a, b) => {
    const distA = Math.abs(a.row - size/2) + Math.abs(a.col - size/2);
    const distB = Math.abs(b.row - size/2) + Math.abs(b.col - size/2);
    return distA - distB;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    let bestMove;

    for (const m of moves) {
      // Simulate the move for the maximizer (GOLD)
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
        // Update the current node's children list with the latest state of the child node
        const existingIdx = node.children.findIndex(c => c.id === childNode.id);
        if (existingIdx >= 0) node.children[existingIdx] = childNode;
        else node.children.push(childNode);
        
        yield { ...node };
      }
      
      // Backtrack: undo the simulated move
      grid[m.row][m.col] = null;

      // Update the best score and move found so far
      if (result.score > maxEval) {
        maxEval = result.score;
        bestMove = m;
      }
      
      // Update Alpha (the best value the maximizer can guarantee)
      alpha = Math.max(alpha, result.score);
      node.alpha = alpha;
      node.score = maxEval;
      node.bestMove = bestMove;

      // Alpha-Beta Pruning: if the minimizer has a better option elsewhere, stop exploring this branch
      if (beta <= alpha) {
        // Mark remaining moves as pruned for visualization
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
      // Simulate the move for the minimizer (BLUE)
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
      
      // Backtrack: undo the simulated move
      grid[m.row][m.col] = null;

      // Update the best score and move found so far
      if (result.score < minEval) {
        minEval = result.score;
        bestMove = m;
      }
      
      // Update Beta (the best value the minimizer can guarantee)
      beta = Math.min(beta, result.score);
      node.beta = beta;
      node.score = minEval;
      node.bestMove = bestMove;

      // Alpha-Beta Pruning: if the maximizer has a better option elsewhere, stop exploring this branch
      if (beta <= alpha) {
        // Mark remaining moves as pruned for visualization
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
