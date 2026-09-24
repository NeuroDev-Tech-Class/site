# Drawing Shapes in Pygame

## Overview

Pygame provides various functions to draw basic shapes like rectangles, circles, lines, and polygons. These shape-drawing functions are fundamental to creating game graphics and visual elements.

In this lesson, we'll learn how to draw the most common shapes:
- **Rectangles**
- **Circles**
- **Lines**

---

## Setting Up Your Pygame Program

### Basic Initialization

```python
import pygame

# Initialize Pygame
pygame.init()

# Set up the display window
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Drawing Shapes with Pygame")
```

### Key Points:
- `pygame.init()`: Initializes all Pygame modules
- `pygame.display.set_mode((width, height))`: Creates the game window
- `pygame.display.set_caption(title)`: Sets the window title

---

## Defining Colors

Colors in Pygame are represented by tuples of three values, corresponding to the **Red, Green, and Blue (RGB)** color channels. Each channel has a value from 0 to 255.

```python
# Define Colors
white = (255, 255, 255)  # White (maximum values for all channels)
red = (255, 0, 0)        # Red (maximum red, no green or blue)
green = (0, 255, 0)      # Green (maximum green, no red or blue)
blue = (0, 0, 255)       # Blue (maximum blue, no red or green)
black = (0, 0, 0)        # Black (no color)
yellow = (255, 255, 0)   # Yellow (red + green)
cyan = (0, 255, 255)     # Cyan (green + blue)
magenta = (255, 0, 255)  # Magenta (red + blue)
```

### Color Definition Tips:
- Store frequently used colors as variables for cleaner code
- Use descriptive variable names
- Experiment with RGB values to create custom colors

---

## Drawing Rectangles

### `pygame.draw.rect()` Function

```python
pygame.draw.rect(surface, color, rect, width=0)
```

**Parameters:**
- `surface`: The surface to draw on (usually your screen)
- `color`: RGB tuple (e.g., `(255, 0, 0)` for red)
- `rect`: A tuple of `(x, y, width, height)` defining the rectangle's position and size
- `width`: Line thickness (optional; 0 for filled rectangle, or thickness for outline)

### Examples

**Filled Rectangle:**
```python
# Draw a red rectangle at position (150, 100) with width 200 and height 150
pygame.draw.rect(screen, red, (150, 100, 200, 150))
```

**Rectangle Outline:**
```python
# Draw a blue rectangle outline with 3-pixel thickness
pygame.draw.rect(screen, blue, (100, 50, 300, 200), 3)
```

### Visual Representation:
```
(x, y)
  ↓
  (150, 100)
     ┌─────────────┐
     │             │  width = 200
     │             │
     │             │  height = 150
     └─────────────┘
```

---

## Drawing Circles

### `pygame.draw.circle()` Function

```python
pygame.draw.circle(surface, color, center, radius, width=0)
```

**Parameters:**
- `surface`: The surface to draw on (usually your screen)
- `color`: RGB tuple (e.g., `(0, 255, 0)` for green)
- `center`: Tuple `(x, y)` representing the circle's center position
- `radius`: The radius of the circle in pixels
- `width`: Line thickness (optional; 0 for filled circle, or thickness for outline)

### Examples

**Filled Circle:**
```python
# Draw a green circle at center (400, 300) with radius 75
pygame.draw.circle(screen, green, (400, 300), 75)
```

**Circle Outline:**
```python
# Draw a red circle outline with 4-pixel thickness
pygame.draw.circle(screen, red, (200, 200), 50, 4)
```

### Visual Representation:
```
                center (400, 300)
                       ↓
                     ◯◯◯
                  ◯◯     ◯◯
               ◯◯           ◯◯
              ◯               ◯
             ◯                 ◯ radius = 75
              ◯               ◯
               ◯◯           ◯◯
                  ◯◯     ◯◯
                     ◯◯◯
```

---

## Drawing Lines

### `pygame.draw.line()` Function

```python
pygame.draw.line(surface, color, start_pos, end_pos, width=1)
```

**Parameters:**
- `surface`: The surface to draw on (usually your screen)
- `color`: RGB tuple (e.g., `(0, 0, 255)` for blue)
- `start_pos`: Tuple `(x1, y1)` for the starting point
- `end_pos`: Tuple `(x2, y2)` for the ending point
- `width`: Line thickness in pixels (default is 1)

### Examples

**Basic Line:**
```python
# Draw a blue line from (100, 500) to (700, 500) with thickness 5
pygame.draw.line(screen, blue, (100, 500), (700, 500), 5)
```

**Different Thickness:**
```python
# Thin line (1 pixel)
pygame.draw.line(screen, red, (50, 50), (350, 350), 1)

# Thick line (10 pixels)
pygame.draw.line(screen, green, (50, 350), (350, 50), 10)
```

### Visual Representation:
```
(100, 500)                              (700, 500)
    •═════════════════════════════════════•
    ← 5-pixel thickness →
```

---

## Complete Drawing Program

Here's a complete program that draws multiple shapes:

```python
import pygame

# Initialize Pygame
pygame.init()

# Set up the display window
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Drawing Shapes with Pygame")

# Define Colors
white = (255, 255, 255)
red = (255, 0, 0)
green = (0, 255, 0)
blue = (0, 0, 255)
yellow = (255, 255, 0)

# Game loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Fill the screen with white
    screen.fill(white)
    
    # Draw a red rectangle
    pygame.draw.rect(screen, red, (50, 50, 150, 100))
    
    # Draw a green circle
    pygame.draw.circle(screen, green, (400, 150), 60)
    
    # Draw a blue line
    pygame.draw.line(screen, blue, (100, 300), (700, 300), 3)
    
    # Draw a yellow rectangle outline
    pygame.draw.rect(screen, yellow, (200, 400, 200, 100), 5)
    
    # Update the display
    pygame.display.flip()

# Quit Pygame
pygame.quit()
```

### Output:
This program creates a window displaying:
- A red filled rectangle (top-left)
- A green filled circle (top-center)
- A blue line across the middle
- A yellow rectangle outline (bottom-center)

---

## Quick Reference: Shape Drawing Functions

| Shape | Function | Parameters |
|-------|----------|------------|
| **Rectangle** | `pygame.draw.rect()` | `(surface, color, (x, y, w, h), width)` |
| **Circle** | `pygame.draw.circle()` | `(surface, color, (x, y), radius, width)` |
| **Line** | `pygame.draw.line()` | `(surface, color, (x1, y1), (x2, y2), width)` |
| **Polygon** | `pygame.draw.polygon()` | `(surface, color, points, width)` |
| **Ellipse** | `pygame.draw.ellipse()` | `(surface, color, (x, y, w, h), width)` |

---

## Best Practices for Drawing Shapes

1. **Clear the Screen First**: Always call `screen.fill()` before drawing shapes
   ```python
   screen.fill(white)  # Clear the screen
   ```

2. **Define Colors as Constants**: Store colors in variables for reusability
   ```python
   RED = (255, 0, 0)
   GREEN = (0, 255, 0)
   ```

3. **Update Display After Drawing**: Always call `pygame.display.flip()` at the end
   ```python
   pygame.display.flip()
   ```

4. **Use Meaningful Variable Names**: Make your code readable
   ```python
   # ✅ Good
   player_rect = pygame.draw.rect(screen, blue, (100, 100, 50, 50))
   
   # ❌ Unclear
   pygame.draw.rect(screen, blue, (100, 100, 50, 50))
   ```

5. **Organize Your Drawing Code**: Draw in logical order (background → shapes → text)
   ```python
   screen.fill(white)          # Background
   pygame.draw.rect(...)       # Shapes
   pygame.draw.circle(...)     # More shapes
   pygame.display.flip()       # Update
   ```

---

## Common Mistakes to Avoid

| Mistake | Problem | Solution |
|---------|---------|----------|
| Forgetting `screen.fill()` | Previous frame not cleared | Always clear screen first |
| Missing `pygame.display.flip()` | Changes not visible | Call flip() after drawing |
| Wrong color format | Invalid RGB tuple | Use `(R, G, B)` with values 0-255 |
| Drawing outside visible area | Shapes disappear | Ensure coordinates are within window bounds |
| Not initializing pygame | Runtime errors | Always call `pygame.init()` first |

---

## Summary

- **Rectangles**: Use `pygame.draw.rect()` for rectangular shapes
- **Circles**: Use `pygame.draw.circle()` for circular shapes
- **Lines**: Use `pygame.draw.line()` for connecting points
- **Colors**: Define as RGB tuples `(R, G, B)` with values 0-255
- **Game Loop Pattern**: Fill screen → Draw shapes → Update display
- **Always initialize** Pygame before drawing
- **Always update** the display after drawing changes

You now have the tools to create visual game elements! Practice combining these shapes to create more complex graphics.

