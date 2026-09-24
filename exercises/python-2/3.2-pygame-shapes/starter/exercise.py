# Drawing Shapes Practice Exercise

import pygame

# Initialize Pygame
pygame.init()

# Set up the display window
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Drawing Shapes")

# Define colors
white = (255, 255, 255)
black = (0, 0, 0)
red = (255, 0, 0)
green = (0, 255, 0)
blue = (0, 0, 255)

# ============================================================================
# Task 1: Draw Multiple Rectangles
# ============================================================================
# Create a game loop and draw the following:
# - A red filled rectangle at (100, 50) with width 150 and height 100
# - A green rectangle outline (not filled) at (300, 50) with width 150 and height 100
# Use pygame.draw.rect() for both. Remember to fill the screen with black first
# and call pygame.display.flip() at the end.

# Write your code here


# ============================================================================
# Task 2: Draw Circles
# ============================================================================
# Draw multiple circles on the screen:
# - A blue filled circle at center (200, 300) with radius 50
# - A red circle outline at center (400, 300) with radius 50 and thickness 3
# - A green filled circle at center (600, 300) with radius 50
# Use pygame.draw.circle() for each.

# Write your code here


# ============================================================================
# Task 3: Draw Lines and Create a Grid
# ============================================================================
# Draw a simple grid pattern using pygame.draw.line():
# - Draw horizontal lines spaced 50 pixels apart (starting from x=0 to x=800)
# - Draw vertical lines spaced 50 pixels apart (starting from y=0 to y=600)
# Use a loop to draw multiple lines efficiently.

# Write your code here


# ============================================================================
# Task 4: Create a Colorful Drawing
# ============================================================================
# Create a scene with multiple shapes and colors:
# - Draw a rectangle to represent the ground
# - Draw circles to represent trees or bushes
# - Draw lines to represent a simple house or structure
# Feel free to use your creativity! Use at least 3 different shapes and 3 colors.

# Write your code here


# Clean up
pygame.quit()

