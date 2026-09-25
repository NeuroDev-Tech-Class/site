# Wordle Recreation Project — Full Specification

## Overview

In this project, you will recreate the classic and widely celebrated word game **Wordle**. Your version will feature an interactive user interface, visual feedback for guesses, validation against an official dictionary, and a complete implementation of the game’s core logic.

This assignment provides practice with:

- DOM manipulation  
- Event listeners  
- Keyboard events  
- Functions and modular design  
- Arrays and strings  
- Fetch requests  
- JSON data handling  

Your UI should be uniquely your own, though you may reference example designs in course materials for inspiration.

---

## Core Requirements

### User Interface

Your application must include the following components:

1. **A 5 × 6 Grid**  
   - Starts empty.  
   - Displays up to **six five-letter guesses**, one per row.

2. **Real‑time Guess Rendering**  
   - Letters should appear in the current row as the user types.  
   - No `<input>` elements allowed — use keyboard events only.

3. **Game Feedback Messages**  
   - Show messages when the player:
     - Wins  
     - Loses  
     - Submits an invalid guess  

4. **Visual Highlighting Rules**  
   - **Green**: letter is in the correct position.  
   - **Yellow**: letter exists in the answer but is in the wrong position.  
   - Letters appearing multiple times must highlight only for each occurrence in the secret answer.

---

## Game Logic Requirements

Your implementation must match the rules of the original game:

- A secret answer is randomly chosen at the start from the official dictionary.
- The player may submit **up to six guesses**.
- Each guess:
  - Must be exactly 5 letters.  
  - Must exist in the dictionary.  
  - Produces hint coloring after submission.
- The player **wins** if a guess matches the correct answer.
- The player **loses** if all six guesses are incorrect.
- Once the game ends, **no additional input** is accepted.

---

## Data Loading Requirements

Use **Fetch** to retrieve the dictionary from a remote JSON API:

```
https://wordle-api.up.railway.app/words
```

The API returns two lists:

- **answers** — valid words AND also eligible as the secret answer  
- **allowed** — additional valid words that may be guessed but will never be the answer  

Before writing your logic, inspect the API with a tool such as **Postman** to understand its structure.

---

## Technical Implementation Requirements

- Use the **keydown** event to capture:
  - Letter keys  
  - Backspace  
  - Enter/Return  
- Use event properties such as:
  - `event.key`
  - `event.keyCode`
- Organize your code into **separate functions** for:
  - Rendering the grid  
  - Handling input  
  - Submitting guesses  
  - Applying color‑coding  
  - Fetching data  
  - Determining win/loss conditions  

You may style your interface however you'd like, as long as the rules and behaviors fully match the original game.

---

## Optional Challenge Features

If you'd like to elevate your implementation further, consider adding:

### On‑screen Keyboard  
- Dynamic highlighting for letters that have been guessed.  
- Behavior similar to the official Wordle on mobile and desktop.

### Persistent Game State  
- Store the current answer and previous guesses using **localStorage**, enabling the game to persist across page reloads.

### Timed Daily or Hourly Word Challenges  
- Choose answers based on a time-driven system so all players receive the same challenge at the same time.

### CSS Animations  
Add visual polish using animations during:

- Letter entry  
- Guess submission  
- Row reveal animations  
- Winning celebration  