# Text and Sound Effects in Pygame

## Overview

In addition to graphics and user input, Pygame supports playing sound effects and music. These audio elements are crucial for creating immersive and engaging gaming experiences. This lesson demonstrates how to:

- **Load and play sound effects** in response to user actions
- **Render text** on the screen
- **Combine audio and visual feedback** for better user experience

---

## Working with Sound in Pygame

### The Mixer Module

Pygame's **mixer module** handles all audio operations including sound effects and music. The mixer provides:

- Sound loading and playback
- Volume control
- Looping capabilities
- Channel management

### Supported Audio Formats

Pygame supports multiple audio formats:
- **WAV** (Waveform Audio) - Uncompressed, high quality
- **MP3** (MPEG Audio) - Compressed, widely compatible
- **OGG** (Ogg Vorbis) - Compressed, open-source
- **FLAC** (Free Lossless Audio) - Lossless compression

### File Paths

Audio files should be in the same directory as your script or use relative/absolute paths:

```python
# Same directory
sound = pygame.mixer.Sound('sound_effect.mp3')

# Subdirectory
sound = pygame.mixer.Sound('assets/sounds/effect.mp3')

# Absolute path (not recommended for portability)
sound = pygame.mixer.Sound('/path/to/sound.mp3')
```

---

## Loading Sound Effects

### Basic Sound Loading

```python
import pygame

# Initialize Pygame
pygame.init()

# Load a sound effect using pygame.mixer.Sound()
sound_effect = pygame.mixer.Sound('sound_effect.mp3')
```

### Sound Object Methods

Once loaded, a `Sound` object provides several useful methods:

| Method | Description | Example |
|--------|-------------|---------|
| `play()` | Play the sound once | `sound.play()` |
| `stop()` | Stop playing the sound | `sound.stop()` |
| `set_volume(volume)` | Set volume (0.0 to 1.0) | `sound.set_volume(0.5)` |
| `get_volume()` | Get current volume | `vol = sound.get_volume()` |

### Playing Sound on User Action

```python
for event in pygame.event.get():
    if event.type == pygame.KEYDOWN:
        if event.key == pygame.K_SPACE:
            # Play sound when spacebar is pressed
            sound_effect.play()
```

---

## Working with Text in Pygame

### Setting Up Fonts

```python
import pygame

pygame.init()

# Method 1: Using system default font
font = pygame.font.SysFont(None, 36)

# Method 2: Using a specific system font
font = pygame.font.SysFont('arial', 48)

# Method 3: Using a custom font file
font = pygame.font.Font('path/to/font.ttf', 36)
```

### Font Sizes

Font sizes are measured in **pixels**. Common sizes:
- `24`: Small text
- `36`: Medium text (default)
- `48`: Large text
- `72`: Very large text

### Common System Fonts

```python
pygame.font.SysFont('arial', 36)      # Arial
pygame.font.SysFont('courier', 36)    # Monospace
pygame.font.SysFont('times', 36)      # Times New Roman
pygame.font.SysFont('verdana', 36)    # Verdana
```

---

## Rendering Text

### Creating Text Surfaces

The `render()` method creates a text surface that can be drawn on the screen:

```python
# Method: font.render(text, antialias, color, background=None)

# Parameters:
# - text: String to render
# - antialias: Boolean (True for smooth edges, False for pixelated)
# - color: RGB tuple (e.g., (255, 255, 255) for white)
# - background: Optional background color

# Example: Render white text with antialiasing
font = pygame.font.SysFont(None, 36)
text_surface = font.render('Press SPACE to play a sound', True, (255, 255, 255))
```

### Drawing Text on Screen

```python
# Blit the text surface onto the screen at position (x, y)
screen.blit(text_surface, (100, 50))
```

### Common Colors

```python
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
```

---

## Centering Text on Screen

### Manual Centering

```python
# Horizontal centering
x = screen.get_width() // 2 - text_surface.get_width() // 2

# Vertical centering
y = screen.get_height() // 2 - text_surface.get_height() // 2

# Draw centered text
screen.blit(text_surface, (x, y))
```

### How It Works

```
Screen width = 800
Text width = 200

Center X = (800 // 2) - (200 // 2)
         = 400 - 100
         = 300  ← Text starts 300 pixels from left
```

### Creating a Centering Function

```python
def center_text(text_surface, screen):
    """Center a text surface on the screen."""
    x = screen.get_width() // 2 - text_surface.get_width() // 2
    y = screen.get_height() // 2 - text_surface.get_height() // 2
    return (x, y)

# Usage
pos = center_text(text_surface, screen)
screen.blit(text_surface, pos)
```

---

## Complete Program: Sound and Text

Here's a complete program combining text rendering and sound playback:

```python
import pygame

# Initialize Pygame
pygame.init()

# Set up the display window
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Adding Sound")

# Load a sound effect
sound_effect = pygame.mixer.Sound('sound_effect.mp3')

# Set up font
font = pygame.font.SysFont(None, 36)

# Create text surface
text_surface = font.render('Press the SPACE bar to play a sound', True, (255, 255, 255))

# Game loop
running = True
while running:
    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                # Play sound when spacebar is pressed
                sound_effect.play()
    
    # Fill screen with black
    screen.fill((0, 0, 0))
    
    # Draw centered text
    text_x = screen.get_width() // 2 - text_surface.get_width() // 2
    text_y = screen.get_height() // 2 - text_surface.get_height() // 2
    screen.blit(text_surface, (text_x, text_y))
    
    # Update display
    pygame.display.flip()

# Quit Pygame
pygame.quit()
```

---

## Advanced Sound Features

### Volume Control

```python
# Set volume between 0.0 (silent) and 1.0 (full volume)
sound_effect.set_volume(0.5)  # 50% volume
sound_effect.set_volume(0.1)  # 10% volume (quiet)
sound_effect.set_volume(1.0)  # 100% volume (loud)

# Check current volume
current_volume = sound_effect.get_volume()
print(f"Current volume: {current_volume}")
```

### Looping Sound

```python
# Play sound once
sound_effect.play()

# Play sound infinitely
sound_effect.play(-1)

# Play sound 3 times (loops 2 additional times)
sound_effect.play(2)
```

### Stopping Sound

```python
# Stop the currently playing sound
sound_effect.stop()

# Check if sound is playing
if sound_effect in pygame.mixer.get_busy():
    print("Sound is currently playing")
```

### Playing Multiple Sounds

```python
# Load multiple sounds
jump_sound = pygame.mixer.Sound('jump.wav')
coin_sound = pygame.mixer.Sound('coin.wav')
hit_sound = pygame.mixer.Sound('hit.wav')

# Play different sounds for different events
if collided_with_coin:
    coin_sound.play()

if player_jumped:
    jump_sound.play()

if took_damage:
    hit_sound.play()
```

---

## Working with Music

### Loading Background Music

```python
# Load music file
pygame.mixer.music.load('background_music.mp3')

# Play music
pygame.mixer.music.play()

# Play music with looping (-1 means infinite loop)
pygame.mixer.music.play(-1)

# Set music volume
pygame.mixer.music.set_volume(0.7)

# Stop music
pygame.mixer.music.stop()

# Pause music
pygame.mixer.music.pause()

# Unpause music
pygame.mixer.music.unpause()
```

### Differences: Sound vs Music

| Feature | Sound Effect | Music |
|---------|--------------|-------|
| **File Size** | Small | Large |
| **Duration** | Short | Long |
| **Loading** | `pygame.mixer.Sound()` | `pygame.mixer.music.load()` |
| **Playing** | `sound.play()` | `music.play()` |
| **Channels** | Multiple simultaneously | Single stream |
| **Use** | One-time effects | Background audio |

---

## Dynamic Text Updates

### Displaying Variable Text

```python
import pygame

pygame.init()
screen = pygame.display.set_mode((800, 600))
font = pygame.font.SysFont(None, 48)

score = 0
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            score += 10  # Increase score on key press
    
    # Create text surface with current score
    text = f"Score: {score}"
    text_surface = font.render(text, True, (255, 255, 255))
    
    screen.fill((0, 0, 0))
    screen.blit(text_surface, (50, 50))
    pygame.display.flip()

pygame.quit()
```

### Creating a Text Class

```python
class TextDisplay:
    def __init__(self, font, color):
        self.font = font
        self.color = color
    
    def render(self, text):
        return self.font.render(text, True, self.color)
    
    def blit(self, screen, text, x, y):
        surface = self.render(text)
        screen.blit(surface, (x, y))

# Usage
text_display = TextDisplay(font, (255, 255, 255))
text_display.blit(screen, f"Score: {score}", 50, 50)
```

---

## Complete Game Example with Sound and Text

```python
import pygame

pygame.init()

# Setup
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Sound and Text Demo")
clock = pygame.time.Clock()

# Font and text
font = pygame.font.SysFont(None, 48)
large_font = pygame.font.SysFont(None, 72)

# Sound
try:
    click_sound = pygame.mixer.Sound('sound_effect.mp3')
except:
    click_sound = None
    print("Sound file not found")

# Game state
score = 0
clicks = 0
running = True

while running:
    clock.tick(60)
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                clicks += 1
                score += 10
                if click_sound:
                    click_sound.play()
    
    # Clear screen
    screen.fill((0, 0, 0))
    
    # Render text
    title = large_font.render("Sound and Text!", True, (255, 255, 0))
    score_text = font.render(f"Score: {score}", True, (255, 255, 255))
    clicks_text = font.render(f"Clicks: {clicks}", True, (0, 255, 0))
    instruction = font.render("Press SPACE", True, (100, 100, 255))
    
    # Draw text
    screen.blit(title, (screen.get_width()//2 - title.get_width()//2, 50))
    screen.blit(score_text, (50, 150))
    screen.blit(clicks_text, (50, 200))
    screen.blit(instruction, (screen.get_width()//2 - instruction.get_width()//2, 450))
    
    pygame.display.flip()

pygame.quit()
```

---

## Best Practices

### 1. **Handle Missing Audio Files**
```python
# ✅ Good: Handle exceptions
try:
    sound = pygame.mixer.Sound('sound.mp3')
except pygame.error:
    print("Could not load sound file")
    sound = None

# Use sound safely
if sound:
    sound.play()
```

### 2. **Organize Audio Resources**
```python
# Create an audio manager class
class AudioManager:
    def __init__(self):
        self.sounds = {}
    
    def load_sound(self, name, filepath):
        try:
            self.sounds[name] = pygame.mixer.Sound(filepath)
        except pygame.error:
            print(f"Failed to load {filepath}")
    
    def play(self, name):
        if name in self.sounds:
            self.sounds[name].play()

# Usage
audio = AudioManager()
audio.load_sound('jump', 'jump.wav')
audio.play('jump')
```

### 3. **Cache Text Surfaces**
```python
# Don't recreate text every frame if it doesn't change
static_text = font.render("Static Text", True, (255, 255, 255))

while running:
    # ... event handling ...
    screen.blit(static_text, (100, 100))  # Reuse the surface
```

### 4. **Use Relative Paths**
```python
# ✅ Good: Works regardless of where script is run from
sound = pygame.mixer.Sound('assets/sounds/effect.mp3')

# ❌ Avoid: Hard-coded absolute paths
sound = pygame.mixer.Sound('C:/Users/Name/Projects/Game/sound.mp3')
```

---

## Summary

- **Sound effects** add interactivity and feedback to games
- **Fonts and text** provide UI and information to players
- Use `pygame.mixer.Sound()` for short sound effects
- Use `pygame.mixer.music` for background music
- **Render text** with `font.render()` and draw with `screen.blit()`
- **Center text** by calculating offsets from screen dimensions
- **Handle errors** when loading audio files
- **Cache text surfaces** for better performance
- Combine sound, text, and visuals for an immersive gaming experience!

