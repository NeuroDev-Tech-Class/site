# Handling Input Practice Exercise

import pygame

# Initialize Pygame
pygame.init()

# Set up the display window
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Handling Input")

# Define colors
white = (255, 255, 255)
black = (0, 0, 0)
teal = (0, 128, 128)

# ============================================================================
# Task 1: Move a Rectangle with Arrow Keys
# ============================================================================
# Create a rectangle that can be moved with the arrow keys:
# - Initialize rectangle position at (350, 250) with width 100 and height 50
# - Use pygame.key.get_pressed() to detect continuous key presses
# - Move the rectangle left/right with LEFT/RIGHT arrows
# - Move the rectangle up/down with UP/DOWN arrows
# - Set a movement speed like 5 pixels per frame

# Write your code here


# ============================================================================
# Task 2: Add Boundary Checking
# ============================================================================
# Modify the previous exercise so the rectangle cannot move off-screen:
# - Ensure the rectangle stays within the window boundaries (0-800 for x, 0-600 for y)
# - Use max() and min() functions or if statements to clamp the position
# - The rectangle should stop at the edges instead of disappearing

# Write your code here


# ============================================================================
# Task 3: Support WASD Controls
# ============================================================================
# Add support for WASD keys in addition to arrow keys:
# - W key moves up (same as UP arrow)
# - A key moves left (same as LEFT arrow)
# - S key moves down (same as DOWN arrow)
# - D key moves right (same as RIGHT arrow)
# Keep the boundary checking from Task 2.

# Write your code here


# ============================================================================
# Task 4: Display Mouse Position
# ============================================================================
# Modify your game to also display the current mouse position:
# - Use pygame.mouse.get_pos() to get the mouse coordinates
# - Draw a small circle (radius 10) at the mouse position in red
# - Keep the rectangle movement working normally
# - The circle should follow your mouse as it moves

# Write your code here


# Clean up
pygame.quit()

