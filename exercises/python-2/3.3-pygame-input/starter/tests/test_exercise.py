# tests/test_exercise.py

"""
Pygame Input Handling Exercise Tests

Note: Pygame requires a display and is difficult to test in headless environments.
These tests focus on code structure, imports, and correct usage of input handling.
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


def test_key_get_pressed_used():
    """Ensure pygame.key.get_pressed() is used for continuous input (Task 1)."""
    source = _get_source_code()
    assert "key.get_pressed()" in source or "get_pressed()" in source, \
        "Expected pygame.key.get_pressed() for continuous keyboard input detection."


def test_arrow_key_constants_used():
    """Ensure arrow key constants are used for movement."""
    source = _get_source_code()

    arrow_keys = ["K_LEFT", "K_RIGHT", "K_UP", "K_DOWN"]
    keys_found = [k for k in arrow_keys if k in source]

    assert len(keys_found) >= 4, \
        f"Expected all 4 arrow key constants (K_LEFT, K_RIGHT, K_UP, K_DOWN), found: {keys_found}"


def test_rectangle_position_variables():
    """Ensure position variables are used for the rectangle."""
    source = _get_source_code()
    source_lower = source.lower()

    # Check for common position variable names
    has_position = any(var in source_lower for var in ["rect_x", "rect_y", "x", "y", "pos"])

    assert has_position, "Expected position variables (rect_x, rect_y, x, y) for rectangle movement."


def test_movement_speed_defined():
    """Ensure a movement speed variable is defined."""
    source = _get_source_code()
    source_lower = source.lower()

    has_speed = "speed" in source_lower or "velocity" in source_lower or "move" in source_lower

    assert has_speed, "Expected a movement speed variable to be defined."


def test_boundary_checking_implemented():
    """Ensure boundary checking is implemented (Task 2)."""
    source = _get_source_code()

    # Check for common boundary checking patterns
    has_max = "max(" in source
    has_min = "min(" in source
    has_comparison = ">=" in source or "<=" in source or "> 0" in source or "< 800" in source

    assert has_max or has_min or has_comparison, \
        "Expected boundary checking with max(), min(), or comparison operators."


def test_wasd_keys_supported():
    """Ensure WASD keys are supported (Task 3)."""
    source = _get_source_code()

    wasd_keys = ["K_w", "K_a", "K_s", "K_d"]
    keys_found = [k for k in wasd_keys if k in source]

    assert len(keys_found) >= 4, \
        f"Expected all 4 WASD key constants (K_w, K_a, K_s, K_d), found: {keys_found}"


def test_mouse_get_pos_used():
    """Ensure pygame.mouse.get_pos() is used (Task 4)."""
    source = _get_source_code()
    assert "mouse.get_pos()" in source or "get_pos()" in source, \
        "Expected pygame.mouse.get_pos() for tracking mouse position."


def test_draw_rect_used():
    """Ensure pygame.draw.rect() is used for the movable rectangle."""
    source = _get_source_code()
    assert "draw.rect" in source, \
        "Expected pygame.draw.rect() for drawing the movable rectangle."


def test_draw_circle_used_for_mouse():
    """Ensure a circle is drawn at mouse position (Task 4)."""
    source = _get_source_code()
    assert "draw.circle" in source, \
        "Expected pygame.draw.circle() for drawing at mouse position."


def test_game_loop_exists():
    """Ensure a game loop exists."""
    tree = _parse_ast()
    while_loops = sum(1 for node in ast.walk(tree) if isinstance(node, ast.While))

    assert while_loops >= 1, "Expected at least one while loop (game loop)."


def test_screen_fill_called():
    """Ensure screen.fill() is called to clear the screen each frame."""
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


def test_multiple_input_methods_combined():
    """Ensure both arrow keys and WASD work together with or statements."""
    source = _get_source_code()

    # Check for combining arrow and WASD with 'or'
    has_or_combination = " or " in source and "K_" in source

    assert has_or_combination, \
        "Expected arrow keys and WASD to be combined using 'or' statements."


def test_color_variables_defined():
    """Ensure colors are defined for shapes."""
    source = _get_source_code()
    source_lower = source.lower()

    colors = ["teal", "red", "white", "black"]
    colors_found = [c for c in colors if c in source_lower]

    assert len(colors_found) >= 2, \
        f"Expected at least 2 color definitions, found: {colors_found}"


def test_code_structure_complete():
    """Ensure substantial code is written."""
    source = _get_source_code()
    lines = source.split("\n")
    code_lines = [line for line in lines if line.strip() and not line.strip().startswith("#")]

    assert len(code_lines) >= 25, \
        f"Expected at least 25 lines of code (excluding comments), found {len(code_lines)}."


# Keep pytest import last for consistency
import pytest  # noqa: E402
