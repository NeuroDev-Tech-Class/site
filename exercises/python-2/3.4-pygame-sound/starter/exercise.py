# Text and Sound Practice Exercise

import pygame

# Initialize Pygame
pygame.init()

# Set up the display window
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Text and Sound")

# Define colors
white = (255, 255, 255)
black = (0, 0, 0)

# ============================================================================
# Task 1: Render and Display Text
# ============================================================================
# Create a game that displays text on the screen:
# - Set up a font using pygame.font.SysFont() (use 'arial' and size 36)
# - Render text that says "Press SPACE to play a sound"
# - Display the text at the center of the screen horizontally, 50 pixels from the top
# - Use the blit() method to draw the text on the screen
# Hint: Text positioning uses screen.blit(text_surface, (x, y))

# Write your code here


# ============================================================================
# Task 2: Load and Play Sound Effects
# ============================================================================
# Add sound effects to your game:
# - Load a sound effect using pygame.mixer.Sound() (you'll need an audio file)
# - Play the sound when the user presses SPACE
# - Display different text when the sound plays (like "Sound playing!")
# Note: If you don't have an audio file, you can skip this task or create a placeholder

# Write your code here


# ============================================================================
# Task 3: Display a Score Counter
# ============================================================================
# Create a game that displays a counter:
# - Create a global variable called `score` starting at 0
# - Every time SPACE is pressed, increase the score by 1
# - Display the score on screen using a font and render()
# - Update the text every frame so the score changes visibly
# Hint: You'll need to recreate the text surface each time score changes

# Write your code here


# ============================================================================
# Task 4: Center Text Vertically and Horizontally
# ============================================================================
# Create a more polished display:
# - Display text centered both horizontally and vertically on the screen
# - Show multiple lines of text (instructions, score, etc.)
# - Use different font sizes for different text elements
# - Update text dynamically based on game state (score counter, status messages)

# Write your code here


# Clean up
pygame.quit()

