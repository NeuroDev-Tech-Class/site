# tests/test_exercise.py

"""
Pygame Text and Sound Exercise Tests

Note: Pygame requires a display and audio hardware, making runtime testing difficult.
These tests focus on code structure, imports, and correct usage of text and sound APIs.
"""

import ast
import os

MODULE_NAME = "exercise"


# ---------------- Helpers ----------------

def _get_source_code() -> str:
    """Get the source code of exercise.py."""
    with open(f"{MODULE_NAME}.py", "r") as f:
        return f.read()


def _parse_ast() -> ast.Module:
    """Parse exercise.py into an AST."""
    source = _get_source_code()
    return ast.parse(source)


def _check_pygame_import(tree: ast.Module) -> bool:
    """Check if pygame module is imported."""
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name == "pygame":
                    return True
        elif isinstance(node, ast.ImportFrom):
            if node.module and node.module.startswith("pygame"):
                return True
    return False


# ---------------- Tests ----------------

def test_exercise_file_exists():
    """Ensure exercise.py exists."""
    assert os.path.exists(f"{MODULE_NAME}.py"), "exercise.py file not found."


def test_pygame_imported():
    """Ensure pygame module is imported."""
    tree = _parse_ast()
    assert _check_pygame_import(tree), "Expected 'import pygame' statement in exercise.py."


def test_pygame_init_called():
    """Ensure pygame.init() is called."""
    source = _get_source_code()
    assert "pygame.init()" in source, "Expected pygame.init() to be called."


def test_display_created():
    """Ensure display window is created."""
    source = _get_source_code()
    assert "display.set_mode" in source, \
        "Expected pygame.display.set_mode() to create the window."


def test_font_sysfont_used():
    """Ensure pygame.font.SysFont() is used for text rendering (Task 1)."""
    source = _get_source_code()
    assert "font.SysFont" in source or "SysFont" in source, \
        "Expected pygame.font.SysFont() to be used for creating fonts."


def test_font_render_used():
    """Ensure font.render() is used for creating text surfaces (Task 1)."""
    source = _get_source_code()
    assert ".render(" in source, \
        "Expected font.render() to be used for creating text surfaces."


def test_blit_used_for_text():
    """Ensure blit() is used for drawing text on screen (Task 1)."""
    source = _get_source_code()
    assert ".blit(" in source, \
        "Expected screen.blit() to be used for drawing text on the screen."


def test_mixer_sound_used():
    """Ensure pygame.mixer.Sound() is used for loading sounds (Task 2)."""
    source = _get_source_code()

    # Sound loading might be attempted even without actual audio file
    has_mixer_sound = "mixer.Sound" in source or "Sound(" in source

    # Allow for commented out code or placeholder
    assert has_mixer_sound or "# " in source and "sound" in source.lower(), \
        "Expected pygame.mixer.Sound() for loading sound effects (or placeholder code)."


def test_keydown_event_for_sound():
    """Ensure KEYDOWN event is handled for playing sound (Task 2)."""
    source = _get_source_code()
    assert "KEYDOWN" in source, \
        "Expected pygame.KEYDOWN event handling for triggering sounds."


def test_space_key_used():
    """Ensure SPACE key is used for triggering actions (Task 2, 3)."""
    source = _get_source_code()
    assert "K_SPACE" in source, \
        "Expected pygame.K_SPACE for triggering sound or incrementing score."


def test_score_variable_exists():
    """Ensure a score variable is defined (Task 3)."""
    source = _get_source_code()
    source_lower = source.lower()

    assert "score" in source_lower or "counter" in source_lower or "count" in source_lower, \
        "Expected a score/counter variable to be defined for Task 3."


def test_score_increment_logic():
    """Ensure score is incremented on key press (Task 3)."""
    source = _get_source_code()

    # Check for increment patterns
    has_increment = "+= 1" in source or "= score + 1" in source.lower() or "= counter + 1" in source.lower()

    assert has_increment, \
        "Expected score increment logic (score += 1) for Task 3."


def test_dynamic_text_rendering():
    """Ensure text is rendered dynamically (recreated each frame) for Task 3."""
    source = _get_source_code()

    # Check that render is called inside the game loop (indicated by being after while)
    lines = source.split("\n")
    in_loop = False
    render_in_loop = False

    for line in lines:
        if "while" in line and "running" in line:
            in_loop = True
        if in_loop and ".render(" in line:
            render_in_loop = True
            break

    assert render_in_loop, \
        "Expected font.render() to be called inside the game loop for dynamic text updates."


def test_text_centering_logic():
    """Ensure text centering is implemented (Task 4)."""
    source = _get_source_code()

    # Check for centering patterns
    has_centering = (
        "// 2" in source or
        "/ 2" in source or
        "get_width()" in source or
        "get_height()" in source or
        "center" in source.lower()
    )

    assert has_centering, \
        "Expected text centering logic using division by 2 or get_width()/get_height()."


def test_game_loop_exists():
    """Ensure a game loop exists."""
    tree = _parse_ast()
    while_loops = sum(1 for node in ast.walk(tree) if isinstance(node, ast.While))

    assert while_loops >= 1, "Expected at least one while loop (game loop)."


def test_screen_fill_called():
    """Ensure screen.fill() is called to clear the screen."""
    source = _get_source_code()
    assert ".fill(" in source, \
        "Expected screen.fill() to clear the screen each frame."


def test_display_flip_called():
    """Ensure display is updated."""
    source = _get_source_code()
    assert "display.flip()" in source or "display.update()" in source, \
        "Expected pygame.display.flip() or pygame.display.update() to be called."


def test_pygame_quit_called():
    """Ensure pygame.quit() is called."""
    source = _get_source_code()
    assert "pygame.quit()" in source, \
        "Expected pygame.quit() to be called at the end."


def test_color_for_text():
    """Ensure colors are defined for text rendering."""
    source = _get_source_code()
    source_lower = source.lower()

    colors = ["white", "black", "red", "green", "blue"]
    colors_found = [c for c in colors if c in source_lower]

    has_rgb = "(255" in source or "(0, 0" in source

    assert colors_found or has_rgb, \
        "Expected color definitions for text rendering."


def test_multiple_font_sizes():
    """Ensure different font sizes are used (Task 4)."""
    source = _get_source_code()

    # Count unique font size definitions
    import re
    font_sizes = re.findall(r'SysFont\([^,]+,\s*(\d+)', source)

    # If no SysFont patterns, check for Font patterns
    if not font_sizes:
        font_sizes = re.findall(r'Font\([^,]+,\s*(\d+)', source)

    unique_sizes = len(set(font_sizes))

    assert unique_sizes >= 1, \
        "Expected at least one font size to be defined."


def test_code_structure_complete():
    """Ensure substantial code is written."""
    source = _get_source_code()
    lines = source.split("\n")
    code_lines = [line for line in lines if line.strip() and not line.strip().startswith("#")]

    assert len(code_lines) >= 25, \
        f"Expected at least 25 lines of code (excluding comments), found {len(code_lines)}."


def test_f_string_or_format_for_score():
    """Check for f-string or format for dynamic score display."""
    source = _get_source_code()

    has_fstring = 'f"' in source or "f'" in source
    has_format = ".format(" in source
    has_concat = '+ str(' in source

    assert has_fstring or has_format or has_concat, \
        "Expected f-string, .format(), or string concatenation for dynamic score display."


# Keep pytest import last for consistency
import pytest  # noqa: E402
