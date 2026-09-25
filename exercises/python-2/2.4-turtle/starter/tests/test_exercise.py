# tests/test_exercise.py

"""
Turtle Graphics Exercise Tests

Note: Turtle graphics are inherently visual and difficult to test automatically.
These tests focus on code structure and function definitions rather than visual output.
The turtle module requires a display, so we mock it for automated testing.
"""

import importlib
import sys
import ast
import os
from types import ModuleType
from unittest.mock import MagicMock, patch

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


def _get_function_names(tree: ast.Module) -> list:
    """Extract all function names from the AST."""
    return [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]


def _get_function_def(tree: ast.Module, name: str) -> ast.FunctionDef:
    """Get a function definition by name."""
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == name:
            return node
    return None


def _count_loop_usage(tree: ast.Module) -> int:
    """Count the number of for/while loops in the code."""
    count = 0
    for node in ast.walk(tree):
        if isinstance(node, (ast.For, ast.While)):
            count += 1
    return count


def _check_turtle_import(tree: ast.Module) -> bool:
    """Check if turtle module is imported."""
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name == "turtle":
                    return True
        elif isinstance(node, ast.ImportFrom):
            if node.module == "turtle":
                return True
    return False


# ---------------- Tests ----------------

def test_turtle_module_imported():
    """Ensure turtle module is imported."""
    tree = _parse_ast()
    assert _check_turtle_import(tree), "Expected 'import turtle' statement in exercise.py."


def test_exercise_file_exists():
    """Ensure exercise.py exists."""
    assert os.path.exists(f"{MODULE_NAME}.py"), "exercise.py file not found."


def test_uses_loops_for_shapes():
    """Ensure loops are used for drawing shapes (Task 1)."""
    tree = _parse_ast()
    loop_count = _count_loop_usage(tree)
    assert loop_count >= 1, "Expected at least one loop (for/while) for drawing shapes."


def test_draw_polygon_function_exists():
    """Ensure a polygon drawing function is defined (Task 2)."""
    tree = _parse_ast()
    func_names = _get_function_names(tree)

    # Check for common function names
    polygon_funcs = [name for name in func_names if "polygon" in name.lower() or "shape" in name.lower()]

    # Also accept draw_square, draw_triangle, etc.
    draw_funcs = [name for name in func_names if name.startswith("draw_")]

    assert polygon_funcs or draw_funcs, \
        "Expected a function for drawing shapes (e.g., draw_polygon, draw_square, draw_triangle)."


def test_draw_function_has_parameters():
    """Ensure drawing functions have appropriate parameters."""
    tree = _parse_ast()
    func_names = _get_function_names(tree)

    # Find drawing functions
    draw_funcs = [name for name in func_names if name.startswith("draw_") or "polygon" in name.lower()]

    if not draw_funcs:
        import pytest
        pytest.skip("No drawing functions found")

    # Check at least one has parameters
    has_params = False
    for func_name in draw_funcs:
        func_def = _get_function_def(tree, func_name)
        if func_def and len(func_def.args.args) >= 1:
            has_params = True
            break

    assert has_params, "Expected drawing functions to have parameters (e.g., size, color, sides)."


def test_uses_multiple_loops_for_pattern():
    """Ensure multiple loops or nested loops are used (Task 3)."""
    tree = _parse_ast()
    loop_count = _count_loop_usage(tree)

    # For Task 3 (drawing 6 squares with rotations), we expect at least 2 loops
    # (one outer for rotations, one inner for drawing)
    assert loop_count >= 2, \
        "Expected at least 2 loops for creating complex patterns (e.g., nested loops for Task 3)."


def test_code_uses_turtle_methods():
    """Ensure turtle methods are called in the code."""
    source = _get_source_code()
    source_lower = source.lower()

    turtle_methods = ["forward", "right", "left", "penup", "pendown", "color", "goto", "write"]
    methods_found = [m for m in turtle_methods if m in source_lower]

    assert len(methods_found) >= 3, \
        f"Expected at least 3 turtle methods to be used, found: {methods_found}"


def test_code_uses_color():
    """Ensure colors are used in the drawing."""
    source = _get_source_code()
    source_lower = source.lower()

    # Check for color-related code
    has_color = "color" in source_lower or any(
        color in source_lower for color in ["red", "blue", "green", "black", "white", "yellow"]
    )

    assert has_color, "Expected the code to use colors for drawing."


def test_code_uses_write_for_text():
    """Ensure write() method is used for displaying text (Task 4)."""
    source = _get_source_code()

    assert "write" in source.lower(), \
        "Expected write() method to be used for displaying text on the canvas."


def test_code_uses_penup_pendown():
    """Ensure penup() and pendown() are used for positioning."""
    source = _get_source_code()
    source_lower = source.lower()

    assert "penup" in source_lower or "pen_up" in source_lower or "pu()" in source_lower, \
        "Expected penup() to be used for positioning without drawing."


def test_code_structure_complete():
    """Ensure the code has substantial content beyond comments."""
    source = _get_source_code()

    # Remove comments and empty lines
    lines = source.split("\n")
    code_lines = [line for line in lines if line.strip() and not line.strip().startswith("#")]

    assert len(code_lines) >= 15, \
        f"Expected at least 15 lines of code (excluding comments), found {len(code_lines)}."


def test_uses_goto_for_positioning():
    """Check if goto() is used for positioning the turtle."""
    source = _get_source_code()
    assert "goto" in source.lower(), "Expected goto() to be used for positioning the turtle."


# Keep pytest import last for consistency
import pytest  # noqa: E402
