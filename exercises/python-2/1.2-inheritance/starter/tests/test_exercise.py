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


def _get_attr(module: ModuleType, name: str):
    obj = getattr(module, name, None)
    assert obj is not None, f"Expected '{name}' to be defined."
    return obj


def _assert_contains_all(text: str, subs: list[str]):
    low = text.lower()
    for s in subs:
        assert str(s).lower() in low, f"Expected '{s}' in: {text!r}"


# ---------------- Tests ----------------

def test_class_definitions_and_inheritance():
    module = _reimport_module()

    Appliance = _get_attr(module, "Appliance")
    WashingMachine = _get_attr(module, "WashingMachine")
    Refrigerator = _get_attr(module, "Refrigerator")

    assert isinstance(Appliance, type), "Appliance must be a class."
    assert isinstance(WashingMachine, type), "WashingMachine must be a class."
    assert isinstance(Refrigerator, type), "Refrigerator must be a class."

    assert issubclass(WashingMachine, Appliance), "WashingMachine should inherit from Appliance."
    assert issubclass(Refrigerator, Appliance), "Refrigerator should inherit from Appliance."

    # Base class has name, brand and display_info()
    base = Appliance("BaseThing", "BaseBrand")
    assert hasattr(base, "name") and hasattr(base, "brand")
    assert hasattr(base, "display_info") and callable(base.display_info)
    info = base.display_info()
    assert isinstance(info, str) and info
    _assert_contains_all(info, ["BaseThing", "BaseBrand"])


def test_child_classes_attributes_and_display_info():
    module = _reimport_module()
    Appliance = module.Appliance
    WashingMachine = module.WashingMachine
    Refrigerator = module.Refrigerator

    wm = WashingMachine(name="Super Wash 3000", brand="WashCorp", load_capacity=7)
    fr = Refrigerator(name="CoolKeeper", brand="CoolBrand", temperature=4)

    # Child-specific attributes
    assert hasattr(wm, "load_capacity"), "WashingMachine must have load_capacity."
    assert hasattr(fr, "temperature"), "Refrigerator must have temperature."

    # display_info should include base and extra attributes
    wm_info = wm.display_info()
    fr_info = fr.display_info()
    assert isinstance(wm_info, str) and isinstance(fr_info, str)
    _assert_contains_all(wm_info, ["Super Wash 3000", "WashCorp", "7"])
    _assert_contains_all(fr_info, ["CoolKeeper", "CoolBrand", "4"])


def test_behavior_methods_print(monkeypatch, capsys):
    module = _reimport_module()
    WashingMachine = module.WashingMachine
    Refrigerator = module.Refrigerator

    wm = WashingMachine(name="X", brand="Y", load_capacity=10)
    fr = Refrigerator(name="A", brand="B", temperature=2)

    # Methods must exist
    assert hasattr(wm, "wash_clothes") and callable(wm.wash_clothes), "Missing wash_clothes()"
    assert hasattr(fr, "cool_food") and callable(fr.cool_food), "Missing cool_food()"

    wm.wash_clothes()
    out1 = capsys.readouterr().out
    assert out1.strip(), "wash_clothes() should print a message."
    _assert_contains_all(out1, ["wash", "10"])  # flexible wording, must mention load capacity

    fr.cool_food()
    out2 = capsys.readouterr().out
    assert out2.strip(), "cool_food() should print a message."
    _assert_contains_all(out2, ["cool", "2"])  # flexible wording, must mention temperature


def test_objects_instantiated_and_printed(monkeypatch, capsys):
    """
    Ensure at least one instance of each child class is created at module level,
    and that the script prints something (likely via display_info or behavior methods).
    """
    module = _reimport_module()
    WashingMachine = module.WashingMachine
    Refrigerator = module.Refrigerator

    wm_objs = [v for v in vars(module).values() if isinstance(v, WashingMachine)]
    fr_objs = [v for v in vars(module).values() if isinstance(v, Refrigerator)]
    assert wm_objs, "Expected at least one WashingMachine instance created in the module."
    assert fr_objs, "Expected at least one Refrigerator instance created in the module."

    out = capsys.readouterr().out
    assert out.strip(), "Expected the script to print results from using the methods."


def test_reimport_safe():
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
