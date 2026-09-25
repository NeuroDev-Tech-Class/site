# Project: Tic-Tac-Toe Web App

## Description

To continue learning web application development, you'll create an app that allows two players to compete in the classic game of **Noughts and Crosses (Tic-Tac-Toe)**.  
The app will provide a **UI** for two human players to take turns playing, notify whose turn it is, prevent illegal moves, and declare a **winner or tie**.

For this assignment, you'll practice:
- DOM operations
- Event listeners
- Functions
- Conditionals
- Loops
- State variables

Refer to the example UI below for an idea of how the user might interact with the app — but your final UI should be of your **own unique design**.

---

## Requirements

### User Interface

Design and implement a UI that includes the following input and output elements:

- A Tic-Tac-Toe **game board** consisting of nine clickable tiles arranged in a 3×3 grid.  
- A **display element** that indicates which player has the current turn.  
- A **display element** that announces a winner (or tie) when the game ends.

### Gameplay Logic and Rules

Implement the following behavior:

1. When a player clicks an **empty tile**, it should be claimed and marked with an **X** or **O**.  
2. After a successful turn, the **current player alternates** to the other player.  
3. When a player claims **three tiles in a row, column, or diagonal**, that player wins and the game ends.  
4. When all tiles have been claimed and there is **no winner**, the game ends in a **tie**.  
5. Clicking a **non-empty tile** should do nothing.  
6. Clicking any tile **after the game has ended** should do nothing.

---

## Implementation Guidelines

Use the following JavaScript concepts and methods:

- `document.querySelector()` to select a single element.  
- `document.querySelectorAll()` to select a collection of elements.  
- `element.textContent` to modify the content of UI elements.  
- `element.style` to modify visual style attributes (e.g., color, background).  
- `element.addEventListener()` to set up user actions for each of the nine tiles.  
- Create **separate functions** to handle game logic and UI updates.  
- Use **variables** to track and update game state, such as the current player and whether the game is over.

---

## Selectors

Use the following selectors so automated tests can locate your UI elements:

| Selector | Purpose |
|-----------|----------|
| `.tile` | Each of the nine clickable game board tiles (text content includes X, O, or empty) |
| `#turn` | Display element showing the current player's turn (X or O) |
| `#winner` | Display element showing the winner (X or O) or tie |

---

## Optional Challenges

Try extending the project with the following ideas:

- Add a **Restart** button that resets the game board.  
- Add an **AI opponent** that can replace the second player.  
- Allow for a **larger game board** (e.g., 4×4 or 5×5).  
- Design a more **visually appealing interface**, with colors, animations, or effects.

---