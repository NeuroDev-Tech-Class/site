# tests/test_exercise.py

"""
Pygame Shapes Exercise Tests

Note: Pygame requires a display and is difficult to test in headless environments.
These tests focus on code structure, imports, and correct usage of drawing functions.
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


def _count_loops(tree: ast.Module) -> int:
    """Count the number of loops in the code."""
    return sum(1 for node in ast.walk(tree) if isinstance(node, (ast.For, ast.While)))


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
    """Ensure display window is created."""
    source = _get_source_code()
    assert "display.set_mode" in source, \
        "Expected pygame.display.set_mode() to create the window."


def test_draw_rect_used():
    """Ensure pygame.draw.rect() is used for rectangles (Task 1)."""
    source = _get_source_code()
    assert "draw.rect" in source, \
        "Expected pygame.draw.rect() to be used for drawing rectangles."


def test_multiple_rectangles_drawn():
    """Ensure multiple rectangles are drawn (Task 1)."""
    source = _get_source_code()

    # Count occurrences of draw.rect
    rect_count = source.count("draw.rect")
    assert rect_count >= 2, \
        f"Expected at least 2 pygame.draw.rect() calls for Task 1, found {rect_count}."


def test_draw_circle_used():
    """Ensure pygame.draw.circle() is used for circles (Task 2)."""
    source = _get_source_code()
    assert "draw.circle" in source, \
        "Expected pygame.draw.circle() to be used for drawing circles."


def test_multiple_circles_drawn():
    """Ensure multiple circles are drawn (Task 2)."""
    source = _get_source_code()

    circle_count = source.count("draw.circle")
    assert circle_count >= 3, \
        f"Expected at least 3 pygame.draw.circle() calls for Task 2, found {circle_count}."


def test_draw_line_used():
    """Ensure pygame.draw.line() is used for lines (Task 3)."""
    source = _get_source_code()
    assert "draw.line" in source, \
        "Expected pygame.draw.line() to be used for drawing lines."


def test_loops_used_for_grid():
    """Ensure loops are used for drawing grid pattern (Task 3)."""
    tree = _parse_ast()
    loop_count = _count_loops(tree)

    assert loop_count >= 2, \
        f"Expected at least 2 loops for drawing grid pattern in Task 3, found {loop_count}."


def test_color_variables_defined():
    """Ensure color variables are defined."""
    source = _get_source_code()
    source_lower = source.lower()

    colors = ["white", "black", "red", "green", "blue"]
    colors_found = [c for c in colors if c in source_lower]

    assert len(colors_found) >= 3, \
        f"Expected at least 3 color definitions, found: {colors_found}"


def test_rgb_tuples_used():
    """Ensure RGB tuples are used for colors."""
    source = _get_source_code()

    # Check for common RGB patterns
    has_rgb = "(255" in source or "(0, 0" in source or "(0,0" in source or "(128" in source

    assert has_rgb, "Expected RGB tuples like (255, 0, 0) for color definitions."


def test_screen_fill_called():
    """Ensure screen.fill() is called."""
    source = _get_source_code()
    assert ".fill(" in source, \
        "Expected screen.fill() to clear the screen before drawing."


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


def test_game_loop_exists():
    """Ensure a game loop (while loop) exists."""
    tree = _parse_ast()
    while_loops = sum(1 for node in ast.walk(tree) if isinstance(node, ast.While))

    assert while_loops >= 1, "Expected at least one while loop (game loop)."


def test_multiple_colors_used():
    """Ensure different colors are used for different shapes (Task 4)."""
    source = _get_source_code()
    source_lower = source.lower()

    colors = ["red", "green", "blue", "yellow", "white", "black", "cyan", "magenta"]
    colors_used = [c for c in colors if c in source_lower]

    assert len(colors_used) >= 3, \
        f"Expected at least 3 different colors for Task 4, found: {colors_used}"


def test_code_structure_complete():
    """Ensure substantial code is written."""
    source = _get_source_code()
    lines = source.split("\n")
    code_lines = [line for line in lines if line.strip() and not line.strip().startswith("#")]

    assert len(code_lines) >= 25, \
        f"Expected at least 25 lines of code (excluding comments), found {len(code_lines)}."


def test_creative_scene_elements():
    """Check for variety of shapes indicating creative scene (Task 4)."""
    source = _get_source_code()

    rect_used = "draw.rect" in source
    circle_used = "draw.circle" in source
    line_used = "draw.line" in source

    shapes_used = sum([rect_used, circle_used, line_used])
    assert shapes_used >= 3, \
        "Expected at least 3 different shape types (rect, circle, line) for Task 4."


# Keep pytest import last for consistency
import pytest  # noqa: E402
