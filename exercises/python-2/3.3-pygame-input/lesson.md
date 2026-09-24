# Handling User Input in Pygame

## Overview

Most games require interaction from the user, such as moving a character, selecting options, or triggering actions. Pygame allows you to detect and respond to both **keyboard** and **mouse events** effectively.

User input is essential for creating interactive and engaging games. In this lesson, we'll focus on:
- **Keyboard input** for movement and actions
- **Continuous input** detection (holding down keys)
- **Real-time response** to player actions

---

## Setting Up Your Input Program

### Basic Structure

```python
import pygame

# Initialize Pygame
pygame.init()

# Set up the display window
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Handling Input")

# Define Colors
white = (255, 255, 255)  # Background
teal = (0, 128, 128)     # Object color

# Run the game loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Handle input here
    # Update game state here
    # Render graphics here
    
    pygame.display.flip()

pygame.quit()
```

---

## Keyboard Input Basics

### Understanding Key Events

In Pygame, there are two main ways to handle keyboard input:

1. **Event-Based**: Respond to specific key press/release events
2. **State-Based**: Check if keys are currently pressed

### Method 1: Event-Based Input

```python
for event in pygame.event.get():
    if event.type == pygame.KEYDOWN:
        # A key was pressed
        if event.key == pygame.K_SPACE:
            print("Space key pressed!")
    elif event.type == pygame.KEYUP:
        # A key was released
        if event.key == pygame.K_SPACE:
            print("Space key released!")
```

**Use event-based input for:**
- One-time actions (jumping, shooting)
- Menu selection
- Turn-based games

### Method 2: State-Based Input (Recommended for Movement)

```python
keys = pygame.key.get_pressed()

# Check if left arrow key is currently pressed
if keys[pygame.K_LEFT]:
    print("Left arrow key is being held")
```

**Use state-based input for:**
- Continuous movement
- Multiple simultaneous key presses
- Real-time action games

---

## Understanding `pygame.key.get_pressed()`

### What It Does

`pygame.key.get_pressed()` returns a sequence of boolean values representing the state of every key on the keyboard. It checks if each key is **currently pressed** (True) or **not pressed** (False).

```python
keys = pygame.key.get_pressed()
# keys is a sequence where each index represents a keyboard key
# Example: keys[pygame.K_LEFT] is True if left arrow is pressed
```

### Key Advantages

- **Continuous Detection**: Works every frame while a key is held
- **Multiple Keys**: Detects multiple simultaneous key presses
- **Smooth Movement**: Perfect for real-time game movement
- **Responsive**: Updates every game loop iteration

---

## Keyboard Constants

Pygame provides constants for common keyboard keys:

| Key | Constant | Purpose |
|-----|----------|---------|
| **Arrow Keys** | `pygame.K_UP`, `pygame.K_DOWN`, `pygame.K_LEFT`, `pygame.K_RIGHT` | Navigation |
| **WASD Keys** | `pygame.K_w`, `pygame.K_a`, `pygame.K_s`, `pygame.K_d` | Movement |
| **Modifier Keys** | `pygame.K_SHIFT`, `pygame.K_CTRL`, `pygame.K_ALT` | Modifiers |
| **Function Keys** | `pygame.K_ESCAPE`, `pygame.K_RETURN`, `pygame.K_SPACE` | Common actions |
| **Letter Keys** | `pygame.K_a`, `pygame.K_b`, ... `pygame.K_z` | Character keys |
| **Number Keys** | `pygame.K_0`, `pygame.K_1`, ... `pygame.K_9` | Number input |

---

## Moving an Object with Keyboard Input

### Basic Movement Example

```python
import pygame

pygame.init()
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Keyboard Movement")

# Colors
white = (255, 255, 255)
teal = (0, 128, 128)

# Rectangle position
rect_x = 350
rect_y = 250
rect_width = 100
rect_height = 50

# Movement speed
move_speed = 0.2

# Game loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Get currently pressed keys
    keys = pygame.key.get_pressed()
    
    # Move left
    if keys[pygame.K_LEFT]:
        rect_x -= move_speed
    
    # Move right
    if keys[pygame.K_RIGHT]:
        rect_x += move_speed
    
    # Move up
    if keys[pygame.K_UP]:
        rect_y -= move_speed
    
    # Move down
    if keys[pygame.K_DOWN]:
        rect_y += move_speed
    
    # Clear screen
    screen.fill(white)
    
    # Draw rectangle at new position
    pygame.draw.rect(screen, teal, (rect_x, rect_y, rect_width, rect_height))
    
    # Update display
    pygame.display.flip()

pygame.quit()
```

### How It Works

1. **Get pressed keys**: `keys = pygame.key.get_pressed()`
2. **Check each direction**: `if keys[pygame.K_LEFT]`
3. **Update position**: `rect_x -= move_speed`
4. **Redraw at new position**: `pygame.draw.rect(screen, teal, (rect_x, rect_y, ...))`
5. **Update display**: `pygame.display.flip()`

---

## Movement Mechanics

### Adjusting Movement Speed

The `move_speed` parameter controls how fast the object moves:

```python
# Slow movement
move_speed = 0.2

# Faster movement
move_speed = 5

# Very fast movement
move_speed = 10
```

**Why use small values like 0.2?**
- The game loop runs ~60 times per second
- 0.2 pixels per frame = 12 pixels per second (manageable speed)
- Larger values make movement too fast and harder to control

### Preventing Objects from Moving Off-Screen

```python
# Define screen boundaries
MAX_X = 700  # Screen width - rectangle width
MAX_Y = 550  # Screen height - rectangle height
MIN_X = 0
MIN_Y = 0

# Clamp position to screen boundaries
if keys[pygame.K_LEFT]:
    rect_x -= move_speed
    if rect_x < MIN_X:
        rect_x = MIN_X

if keys[pygame.K_RIGHT]:
    rect_x += move_speed
    if rect_x > MAX_X:
        rect_x = MAX_X

if keys[pygame.K_UP]:
    rect_y -= move_speed
    if rect_y < MIN_Y:
        rect_y = MIN_Y

if keys[pygame.K_DOWN]:
    rect_y += move_speed
    if rect_y > MAX_Y:
        rect_y = MAX_Y
```

Or use a cleaner approach:

```python
rect_x = max(0, min(rect_x, 700))  # Clamp x between 0 and 700
rect_y = max(0, min(rect_y, 550))  # Clamp y between 0 and 550
```

---

## Alternative: WASD Controls

```python
keys = pygame.key.get_pressed()

if keys[pygame.K_w]:  # Up
    rect_y -= move_speed

if keys[pygame.K_s]:  # Down
    rect_y += move_speed

if keys[pygame.K_a]:  # Left
    rect_x -= move_speed

if keys[pygame.K_d]:  # Right
    rect_x += move_speed
```

Many modern games support both arrow keys and WASD:

```python
# Arrow keys
if keys[pygame.K_LEFT] or keys[pygame.K_a]:
    rect_x -= move_speed

if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
    rect_x += move_speed

if keys[pygame.K_UP] or keys[pygame.K_w]:
    rect_y -= move_speed

if keys[pygame.K_DOWN] or keys[pygame.K_s]:
    rect_y += move_speed
```

---

## Bonus: Mouse Input

### Getting Mouse Position

```python
# Get the current mouse position
mouse_x, mouse_y = pygame.mouse.get_pos()
print(f"Mouse at: ({mouse_x}, {mouse_y})")
```

### Handling Mouse Events

```python
for event in pygame.event.get():
    if event.type == pygame.MOUSEBUTTONDOWN:
        # Mouse button was clicked
        print(f"Clicked at: {event.pos}")
    
    elif event.type == pygame.MOUSEBUTTONUP:
        # Mouse button was released
        print(f"Released at: {event.pos}")
    
    elif event.type == pygame.MOUSEMOTION:
        # Mouse moved
        print(f"Mouse moved to: {event.pos}")
```

### Following the Mouse with a Shape

```python
mouse_x, mouse_y = pygame.mouse.get_pos()
pygame.draw.circle(screen, red, (mouse_x, mouse_y), 10)
```

---

## Complete Interactive Program

```python
import pygame

pygame.init()
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Interactive Game")

# Colors
white = (255, 255, 255)
teal = (0, 128, 128)
red = (255, 0, 0)

# Rectangle properties
rect_x = 350
rect_y = 250
rect_width = 100
rect_height = 50
move_speed = 5

# Game loop
running = True
clock = pygame.time.Clock()

while running:
    clock.tick(60)  # 60 FPS
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Get keyboard input
    keys = pygame.key.get_pressed()
    
    # Handle movement with boundary checking
    if keys[pygame.K_LEFT] or keys[pygame.K_a]:
        rect_x = max(0, rect_x - move_speed)
    
    if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
        rect_x = min(800 - rect_width, rect_x + move_speed)
    
    if keys[pygame.K_UP] or keys[pygame.K_w]:
        rect_y = max(0, rect_y - move_speed)
    
    if keys[pygame.K_DOWN] or keys[pygame.K_s]:
        rect_y = min(600 - rect_height, rect_y + move_speed)
    
    # Clear screen
    screen.fill(white)
    
    # Draw rectangle
    pygame.draw.rect(screen, teal, (rect_x, rect_y, rect_width, rect_height))
    
    # Get and draw mouse position
    mouse_x, mouse_y = pygame.mouse.get_pos()
    pygame.draw.circle(screen, red, (mouse_x, mouse_y), 5)
    
    # Update display
    pygame.display.flip()

pygame.quit()
```

### Features:
- Arrow keys and WASD support
- Boundary checking to keep rectangle on screen
- 60 FPS frame rate control
- Mouse position tracking

---

## Best Practices for Input Handling

### 1. **Separate Input from Logic**
```python
# ✅ Good: Separate concerns
keys = pygame.key.get_pressed()
handle_input(keys)
update_game_state()
render()

# ❌ Avoid: Mixed concerns
if keys[pygame.K_LEFT]:
    # Complex game logic mixed with input
```

### 2. **Use Constants for Key Codes**
```python
# ✅ Good
LEFT_KEY = pygame.K_LEFT
RIGHT_KEY = pygame.K_RIGHT

if keys[LEFT_KEY]:
    move_left()

# ❌ Avoid: Magic numbers
if keys[276]:  # What is 276?
    move_left()
```

### 3. **Control Frame Rate**
```python
clock = pygame.time.Clock()

while running:
    clock.tick(60)  # Cap at 60 FPS for consistent speed
    # ... rest of game loop
```

### 4. **Test for Boundary Conditions**
```python
# Prevent objects from leaving the screen
rect_x = max(0, min(rect_x, screen_width - object_width))
rect_y = max(0, min(rect_y, screen_height - object_height))
```

---

## Summary

- **Use `pygame.key.get_pressed()`** for continuous movement detection
- **Use event-based input** for one-time actions like jumping or shooting
- **Movement speed** is typically small (0.2 - 5 pixels per frame)
- **Boundary checking** prevents objects from leaving the screen
- **Support multiple controls** (arrows + WASD) for better UX
- **Use `pygame.time.Clock().tick()`** to control frame rate
- **Separate input handling** from game logic for cleaner code

With these input handling techniques, you can create responsive and interactive games!

