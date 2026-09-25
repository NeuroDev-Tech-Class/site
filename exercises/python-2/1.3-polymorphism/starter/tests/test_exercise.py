# tests/test_exercise.py

import importlib
import sys
from types import ModuleType

MODULE_NAME = "exercise"


# ---------------- Helpers ----------------

def _reimport_module() -> ModuleType:
    """Re-import the student's module fresh."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _get_class(module: ModuleType, name: str):
    cls = getattr(module, name, None)
    assert cls is not None, f"Expected class '{name}' to be defined."
    assert isinstance(cls, type), f"'{name}' must be a class."
    return cls


# ---------------- Tests ----------------

def test_class_hierarchy_and_move_overridden():
    """Ensure Vehicle is abstract and derived classes override move()."""
    module = _reimport_module()
    Vehicle = _get_class(module, "Vehicle")
    Car = _get_class(module, "Car")
    Bike = _get_class(module, "Bike")
    Boat = _get_class(module, "Boat")

    # Inheritance
    for cls in (Car, Bike, Boat):
        assert issubclass(cls, Vehicle), f"{cls.__name__} should inherit from Vehicle."

    # Base class move() should raise NotImplementedError
    v = Vehicle("Generic Vehicle")
    try:
        v.move()
    except NotImplementedError:
        pass
    else:
        raise AssertionError("Vehicle.move() should raise NotImplementedError.")

    # Derived classes override move()
    for cls in (Car, Bike, Boat):
        obj = cls("X")
        msg = obj.move()
        assert isinstance(msg, str) and msg, f"{cls.__name__}.move() must return a string."
        # Each move message should describe correct movement
        if cls is Car:
            assert "drive" in msg.lower() or "road" in msg.lower(), "Car.move() should describe driving on roads."
        elif cls is Bike:
            assert "pedal" in msg.lower() or "path" in msg.lower(), "Bike.move() should describe pedaling on paths."
        elif cls is Boat:
            assert "sail" in msg.lower() or "water" in msg.lower(), "Boat.move() should describe sailing on water."


def test_objects_created_and_loop_prints(monkeypatch, capsys):
    """
    Ensure at least one instance of each derived class is created and
    their move() methods are used in a loop that prints results.
    """
    module = _reimport_module()
    Car = _get_class(module, "Car")
    Bike = _get_class(module, "Bike")
    Boat = _get_class(module, "Boat")

    car_objs = [v for v in vars(module).values() if isinstance(v, Car)]
    bike_objs = [v for v in vars(module).values() if isinstance(v, Bike)]
    boat_objs = [v for v in vars(module).values() if isinstance(v, Boat)]

    assert car_objs, "Expected at least one Car instance created in the module."
    assert bike_objs, "Expected at least one Bike instance created in the module."
    assert boat_objs, "Expected at least one Boat instance created in the module."

    # The module should print the results of calling move() in a loop
    out = capsys.readouterr().out.strip()
    assert out, "Expected printed output from loop calling move()."
    lower_out = out.lower()
    assert any(word in lower_out for word in ["drive", "pedal", "sail", "road", "path", "water"]), (
        "Expected printed move() results describing movement."
    )


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
