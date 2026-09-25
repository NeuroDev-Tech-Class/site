# tests/test_exercise.py

"""
Pygame Introduction Exercise Tests

Note: Pygame requires a display and is difficult to test in headless environments.
These tests focus on code structure, imports, and pattern usage rather than runtime behavior.
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


def _count_while_loops(tree: ast.Module) -> int:
    """Count the number of while loops (game loops)."""
    return sum(1 for node in ast.walk(tree) if isinstance(node, ast.While))


def _get_function_names(tree: ast.Module) -> list:
    """Extract all function names from the AST."""
    return [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]


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


def test_display_set_mode_called():
    """Ensure pygame.display.set_mode() is called to create window."""
    source = _get_source_code()
    assert "display.set_mode" in source, \
        "Expected pygame.display.set_mode() to be called to create the window."


def test_display_set_caption_called():
    """Ensure pygame.display.set_caption() is called to set window title."""
    source = _get_source_code()
    assert "set_caption" in source, \
        "Expected pygame.display.set_caption() to be called to set the window title."


def test_game_loop_exists():
    """Ensure a while loop (game loop) exists."""
    tree = _parse_ast()
    loop_count = _count_while_loops(tree)
    assert loop_count >= 1, "Expected at least one while loop (game loop) in the code."


def test_running_variable_used():
    """Ensure a running variable controls the game loop."""
    source = _get_source_code()
    assert "running" in source, \
        "Expected a 'running' variable to control the game loop."


def test_event_handling_exists():
    """Ensure event handling with pygame.event.get() is present."""
    source = _get_source_code()
    assert "pygame.event.get()" in source or "event.get()" in source, \
        "Expected pygame.event.get() to be used for event handling."


def test_quit_event_handled():
    """Ensure pygame.QUIT event is handled."""
    source = _get_source_code()
    assert "pygame.QUIT" in source or "QUIT" in source, \
        "Expected pygame.QUIT event to be handled for closing the window."


def test_screen_fill_called():
    """Ensure screen.fill() is called to set background color."""
    source = _get_source_code()
    assert ".fill(" in source, \
        "Expected screen.fill() to be called to set the background color."


def test_display_flip_called():
    """Ensure pygame.display.flip() is called to update the display."""
    source = _get_source_code()
    assert "display.flip()" in source or "display.update()" in source, \
        "Expected pygame.display.flip() or pygame.display.update() to be called."


def test_pygame_quit_called():
    """Ensure pygame.quit() is called at the end."""
    source = _get_source_code()
    assert "pygame.quit()" in source, \
        "Expected pygame.quit() to be called to clean up at the end."


def test_keydown_event_handling():
    """Ensure KEYDOWN event is handled (Task 3)."""
    source = _get_source_code()
    assert "KEYDOWN" in source, \
        "Expected pygame.KEYDOWN event to be handled for keyboard input."


def test_color_changing_logic():
    """Ensure color variables or RGB tuples are defined (Task 4)."""
    source = _get_source_code()
    source_lower = source.lower()

    # Check for color definitions
    has_colors = any(color in source_lower for color in ["red", "green", "blue", "white", "black"])
    has_rgb = "(255" in source or "(0, 0" in source or "(0,0" in source

    assert has_colors or has_rgb, \
        "Expected color definitions (RGB tuples or color variables) for Task 4."


def test_key_constants_used():
    """Ensure pygame key constants are used for color switching."""
    source = _get_source_code()

    key_constants = ["K_r", "K_g", "K_b", "K_w"]
    keys_found = [k for k in key_constants if k in source]

    assert len(keys_found) >= 2, \
        f"Expected key constants (K_r, K_g, K_b, K_w) to be used for color switching, found: {keys_found}"


def test_code_structure_complete():
    """Ensure the code has substantial content."""
    source = _get_source_code()
    lines = source.split("\n")
    code_lines = [line for line in lines if line.strip() and not line.strip().startswith("#")]

    assert len(code_lines) >= 20, \
        f"Expected at least 20 lines of code (excluding comments), found {len(code_lines)}."


# Keep pytest import last for consistency
import pytest  # noqa: E402
