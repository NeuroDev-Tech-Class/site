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


def _assert_contains_all(text: str, subs: list):
    low = text.lower()
    for s in subs:
        assert str(s).lower() in low, f"Expected '{s}' in: {text!r}"


# ---------------- Tests ----------------

def test_class_definitions_and_inheritance():
    """Ensure Instrument base class and child classes are defined with proper inheritance."""
    module = _reimport_module()

    Instrument = _get_class(module, "Instrument")
    Guitar = _get_class(module, "Guitar")
    Flute = _get_class(module, "Flute")

    # Verify inheritance
    assert issubclass(Guitar, Instrument), "Guitar should inherit from Instrument."
    assert issubclass(Flute, Instrument), "Flute should inherit from Instrument."


def test_base_class_attributes_and_display_info():
    """Ensure Instrument has name, material attributes and display_info method."""
    module = _reimport_module()
    Instrument = _get_class(module, "Instrument")

    inst = Instrument("Test Instrument", "Metal")
    assert hasattr(inst, "name"), "Instrument must have 'name' attribute."
    assert hasattr(inst, "material"), "Instrument must have 'material' attribute."
    assert inst.name == "Test Instrument"
    assert inst.material == "Metal"

    assert hasattr(inst, "display_info") and callable(inst.display_info), \
        "Instrument must have display_info() method."
    info = inst.display_info()
    assert isinstance(info, str), "display_info() must return a string."
    _assert_contains_all(info, ["Test Instrument", "Metal"])


def test_base_class_abstract_methods_raise_error():
    """Ensure play_sound and tune methods raise NotImplementedError in base class."""
    module = _reimport_module()
    Instrument = _get_class(module, "Instrument")

    inst = Instrument("Test", "Wood")

    # play_sound should raise NotImplementedError
    assert hasattr(inst, "play_sound") and callable(inst.play_sound), \
        "Instrument must have play_sound() method."
    try:
        inst.play_sound()
    except NotImplementedError:
        pass
    else:
        raise AssertionError("Instrument.play_sound() should raise NotImplementedError.")

    # tune should raise NotImplementedError
    assert hasattr(inst, "tune") and callable(inst.tune), \
        "Instrument must have tune() method."
    try:
        inst.tune()
    except NotImplementedError:
        pass
    else:
        raise AssertionError("Instrument.tune() should raise NotImplementedError.")


def test_guitar_class_attributes_and_methods():
    """Ensure Guitar has all required attributes and methods."""
    module = _reimport_module()
    Guitar = _get_class(module, "Guitar")

    guitar = Guitar("Acoustic Guitar", "Wood", 6)

    # Check attributes
    assert hasattr(guitar, "name"), "Guitar must have 'name' attribute."
    assert hasattr(guitar, "material"), "Guitar must have 'material' attribute."
    assert hasattr(guitar, "number_of_strings"), "Guitar must have 'number_of_strings' attribute."
    assert guitar.number_of_strings == 6

    # Check display_info includes all info
    assert hasattr(guitar, "display_info") and callable(guitar.display_info)
    info = guitar.display_info()
    assert isinstance(info, str), "display_info() must return a string."
    _assert_contains_all(info, ["Acoustic Guitar", "Wood", "6"])


def test_guitar_play_sound_and_tune(capsys):
    """Ensure Guitar.play_sound() and tune() print messages."""
    module = _reimport_module()
    Guitar = _get_class(module, "Guitar")

    guitar = Guitar("Electric Guitar", "Metal", 6)

    # play_sound should print something (not raise NotImplementedError)
    guitar.play_sound()
    out1 = capsys.readouterr().out
    assert out1.strip(), "Guitar.play_sound() should print a message."

    # tune should print something (not raise NotImplementedError)
    guitar.tune()
    out2 = capsys.readouterr().out
    assert out2.strip(), "Guitar.tune() should print a message."


def test_flute_class_attributes_and_methods():
    """Ensure Flute has all required attributes and methods."""
    module = _reimport_module()
    Flute = _get_class(module, "Flute")

    flute = Flute("Concert Flute", "Silver", "Transverse")

    # Check attributes
    assert hasattr(flute, "name"), "Flute must have 'name' attribute."
    assert hasattr(flute, "material"), "Flute must have 'material' attribute."
    assert hasattr(flute, "type"), "Flute must have 'type' attribute."
    assert flute.type == "Transverse"

    # Check display_info includes all info
    assert hasattr(flute, "display_info") and callable(flute.display_info)
    info = flute.display_info()
    assert isinstance(info, str), "display_info() must return a string."
    _assert_contains_all(info, ["Concert Flute", "Silver", "Transverse"])


def test_flute_play_sound_and_tune(capsys):
    """Ensure Flute.play_sound() and tune() print messages."""
    module = _reimport_module()
    Flute = _get_class(module, "Flute")

    flute = Flute("Recorder", "Plastic", "Recorder")

    # play_sound should print something (not raise NotImplementedError)
    flute.play_sound()
    out1 = capsys.readouterr().out
    assert out1.strip(), "Flute.play_sound() should print a message."

    # tune should print something (not raise NotImplementedError)
    flute.tune()
    out2 = capsys.readouterr().out
    assert out2.strip(), "Flute.tune() should print a message."


def test_objects_created_at_module_level():
    """Ensure at least one Guitar and one Flute object are created in the module."""
    module = _reimport_module()
    Guitar = _get_class(module, "Guitar")
    Flute = _get_class(module, "Flute")

    guitar_objs = [v for v in vars(module).values() if isinstance(v, Guitar)]
    flute_objs = [v for v in vars(module).values() if isinstance(v, Flute)]

    assert guitar_objs, "Expected at least one Guitar instance created in the module."
    assert flute_objs, "Expected at least one Flute instance created in the module."


def test_methods_used_and_printed(capsys):
    """Ensure the script uses the methods and prints output."""
    module = _reimport_module()
    out = capsys.readouterr().out
    assert out.strip(), "Expected the script to print output from using the methods."


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
