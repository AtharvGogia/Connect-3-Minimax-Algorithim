# Connect X - Minimax Algorithm Visualization

Connect X is an interactive implementation of the classic Connect game (like Tic-Tac-Toe or Connect 4) on variable grid sizes (3x3, 4x4, 5x5). The project focuses on visualizing the **Minimax Algorithm** with **Alpha-Beta Pruning**, providing a real-time look into how the computer makes optimal decisions.

## Features

- **Variable Grid Sizes**: Play on 3x3, 4x4, or 5x5 grids.
- **Real-time Tree Visualization**: Watch the algorithm explore the game tree, evaluating potential moves and pruning suboptimal branches.
- **Minimax Algorithm**: A decision-making algorithm used in zero-sum games to find the optimal move.
- **Alpha-Beta Pruning**: An optimization technique for the Minimax algorithm that reduces the number of nodes evaluated in the search tree.
- **System Logs**: Detailed logs showing the algorithm's progress, including move evaluations and pruning events.

## How it Works

### The Minimax Algorithm

The Minimax algorithm is a recursive strategy used to determine the best move for a player, assuming the opponent is also playing optimally. 
- **Maximizing Player (GOLD)**: Tries to choose the move that results in the highest possible score.
- **Minimizing Player (BLUE)**: Tries to choose the move that results in the lowest possible score (best for them).

The algorithm explores all possible moves up to a certain depth (fixed at 5 in this project) and assigns a score to each leaf node based on a heuristic evaluation function.

### Alpha-Beta Pruning

Alpha-Beta pruning is an optimization that "prunes" branches in the search tree that cannot possibly influence the final decision. 
- **Alpha**: The best value that the maximizer can currently guarantee.
- **Beta**: The best value that the minimizer can currently guarantee.

If at any point Beta becomes less than or equal to Alpha, the algorithm knows that the current branch will not be chosen by the optimal players, so it stops exploring it. This significantly improves performance, especially on larger grids.

### Heuristic Evaluation

Since exploring the entire game tree for larger grids is computationally expensive, the algorithm uses a heuristic to estimate the value of a board state at a given depth.
- **Winning State**: +10,000 for GOLD, -10,000 for BLUE.
- **Potential Lines**: Scores are assigned based on the number of pieces a player has in a row, column, or diagonal that could still lead to a win.

## Technical Stack

- **React**: Frontend framework for building the user interface.
- **Vite**: Modern build tool for fast development.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **D3.js**: Powerful library for creating the interactive tree visualization.
- **Lucide React**: Icon library for UI elements.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Project Structure

- `src/App.tsx`: Main application component managing game state and algorithm execution.
- `src/components/GameBoard.tsx`: Interactive game board component.
- `src/components/TreeVisualization.tsx`: D3-based visualization of the Minimax search tree.
- `src/logic/game.ts`: Core game logic, including the Minimax generator and win detection.
- `src/types.ts`: TypeScript definitions for game state and tree nodes.

## Credits

Developed by:
- Atharv Gogia - RA2411003010944
- Vedant Panchal - RA2411003010934
- Alveera Singh Sood - RA2411003010927
