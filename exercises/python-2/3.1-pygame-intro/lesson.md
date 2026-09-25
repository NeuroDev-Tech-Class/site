# Introduction to Pygame

## Overview

Pygame is a popular Python library used for creating video games. It provides various functionalities such as:

- **Rendering graphics** on the screen
- **Handling input** from the keyboard or mouse
- **Playing sound** and audio effects
- **Managing sprites** and animations
- **Detecting collisions** between game objects
- **Creating game loops** for game logic

Pygame makes game development more accessible to Python developers by abstracting complex graphics and input handling into simple, intuitive functions.

---

## Installation

Before you can use Pygame, you need to install it using the pip package manager:

```bash
pip install pygame
```

After installation, you can import and use Pygame in your Python programs.

---

## Setting Up Your First Pygame Window

### Step 1: Import and Initialize Pygame

```python
import pygame

# Initialize Pygame
# This function initializes all the Pygame modules.
# It's important to call this before using any Pygame features.
pygame.init()
```

### Key Points:
- `import pygame`: Imports the Pygame library
- `pygame.init()`: Must be called before using any Pygame functionality
- Initializes all Pygame modules (display, sound, events, etc.)

---

## Creating the Display Window

```python
# Set up the display window
screen_width = 800   # The width of the window in pixels
screen_height = 600  # The height of the window in pixels

# The display.set_mode function creates and initializes a window
screen = pygame.display.set_mode((screen_width, screen_height))

# Set the title of the window
pygame.display.set_caption("My First Pygame Window")
```

### Key Points:
- `screen_width` and `screen_height` define the window dimensions in pixels
- `pygame.display.set_mode((width, height))`: Creates the game window
- `pygame.display.set_caption(title)`: Sets the title shown in the window's title bar
- The window size and title are important for user experience

---

## The Game Loop

The **game loop** is the heart of any game. It continuously runs as long as the game is active and handles three main tasks:

1. **Handle Events**: Listen for user input and system events
2. **Update Game State**: Update positions, animations, and game logic
3. **Render Graphics**: Draw everything on the screen

### Basic Game Loop Structure

```python
# Create a variable to control the game loop
running = True

while running:
    # Step 1: Handle Events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Step 2: Update Game State
    # (Add game logic here)
    
    # Step 3: Render Graphics
    screen.fill((0, 0, 0))  # Fill screen with black
    pygame.display.flip()   # Update the display

# Clean up
pygame.quit()
```

---

## Handling Events

Events are actions or occurrences in your game, such as:
- Keyboard presses
- Mouse clicks
- Window close button
- Other system events

### Event Loop

```python
for event in pygame.event.get():
    if event.type == pygame.QUIT:
        # User clicked the close button
        running = False
    elif event.type == pygame.KEYDOWN:
        # A key was pressed
        print(f"Key pressed: {event.key}")
    elif event.type == pygame.MOUSEBUTTONDOWN:
        # Mouse button was clicked
        print(f"Mouse clicked at: {event.pos}")
```

### Common Event Types:
| Event Type | Description |
|-----------|-------------|
| `pygame.QUIT` | User closes the window |
| `pygame.KEYDOWN` | Key is pressed |
| `pygame.KEYUP` | Key is released |
| `pygame.MOUSEBUTTONDOWN` | Mouse button is clicked |
| `pygame.MOUSEBUTTONUP` | Mouse button is released |
| `pygame.MOUSEMOTION` | Mouse is moved |

---

## Rendering Graphics

### Filling the Screen with Color

```python
# Fill the screen with a color using RGB values
# RGB: Red, Green, Blue (0-255 for each)
screen.fill((0, 0, 0))  # Black
screen.fill((255, 0, 0))  # Red
screen.fill((0, 255, 0))  # Green
screen.fill((0, 0, 255))  # Blue
screen.fill((255, 255, 255))  # White
```

### Updating the Display

```python
# The display.flip() function updates the entire screen
pygame.display.flip()
```

Without calling `pygame.display.flip()`, your changes won't be visible on the screen.

---

## Complete First Program

Here's a complete Pygame program that creates a window and handles the close button:

```python
import pygame

# Initialize Pygame
pygame.init()

# Set up the display window
screen_width = 800
screen_height = 600
screen = pygame.display.set_mode((screen_width, screen_height))

# Set the window title
pygame.display.set_caption("My First Pygame Window")

# Game loop
running = True
while running:
    # Handle events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Fill the screen with black
    screen.fill((0, 0, 0))
    
    # Update the display
    pygame.display.flip()

# Clean up and close Pygame
pygame.quit()
```

### What This Program Does:
1. Creates an 800x600 pixel window titled "My First Pygame Window"
2. Fills the window with black
3. Listens for the close button to be clicked
4. Exits cleanly when the window is closed

---

## Understanding Pixel Coordinates

In Pygame, the coordinate system works like this:

```
(0, 0) -----------> X increases to the right
  |
  |
  |
  v
  Y increases downward
  
Example: (400, 300) is in the center of an 800x600 window
```

- **Top-left corner**: (0, 0)
- **Top-right corner**: (800, 0) for 800x600 window
- **Bottom-left corner**: (0, 600)
- **Bottom-right corner**: (800, 600)
- **Center**: (400, 300)

---

## RGB Color Values

Colors in Pygame use RGB (Red, Green, Blue) format, with values from 0-255:

| Color | RGB |
|-------|-----|
| Black | (0, 0, 0) |
| White | (255, 255, 255) |
| Red | (255, 0, 0) |
| Green | (0, 255, 0) |
| Blue | (0, 0, 255) |
| Yellow | (255, 255, 0) |
| Cyan | (0, 255, 255) |
| Magenta | (255, 0, 255) |
| Gray | (128, 128, 128) |

---

## Best Practices

1. **Always call `pygame.init()`**: Initialize Pygame before using any features
2. **Use the game loop pattern**: Event handling → Update → Render
3. **Call `pygame.display.flip()`**: Make sure to update the display in each loop iteration
4. **Handle the QUIT event**: Allow users to close the game cleanly
5. **Call `pygame.quit()`**: Clean up Pygame when the game ends

---

## Summary

- **Pygame** is a powerful library for creating games in Python
- **Install** Pygame using `pip install pygame`
- **Initialize** with `pygame.init()` before using Pygame
- **Create a window** with `pygame.display.set_mode()`
- **Game loop** is the core: handle events → update → render
- **Events** like QUIT allow you to respond to user actions
- **RGB colors** define colors using Red, Green, Blue values (0-255)
- **Display updates** require calling `pygame.display.flip()`

You're now ready to expand this basic framework with sprites, movement, collision detection, and more complex game logic!

