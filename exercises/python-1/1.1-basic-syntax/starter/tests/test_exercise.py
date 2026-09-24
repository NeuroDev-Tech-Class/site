import runpy
import io
import sys


def test_subtraction_output():
    captured = io.StringIO()
    sys.stdout = captured
    runpy.run_path("exercise.py")
    sys.stdout = sys.__stdout__

    output = captured.getvalue().strip()

    assert output, "Your program didn't print anything."

    try:
        value = int(output)
    except ValueError:
        raise AssertionError(f"Your output '{output}' is not a number.")

    assert (
        value != 0
    ), "Your subtraction printed 0. Did you remember to subtract two different numbers?"
