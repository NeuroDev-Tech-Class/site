# Inheritance in Python

Inheritance is one of the core concepts of Object-Oriented Programming (OOP).  
It allows a class to reuse, extend, or modify the behavior of another class.

- The **parent class** (base class) is the class being inherited from.  
- The **child class** (derived class) inherits methods and properties from the parent.

---

## Parent Class Example

```python
class Animal:
    def __init__(self, name, category):
        self.name = name
        self.category = category

    def display_info(self):
        return f"{self.name} is a {self.category}"
```

---

## Child Class: Bird

```python
class Bird(Animal):
    def __init__(self, name, category, can_fly):
        super().__init__(name, category)
        self.can_fly = can_fly

    def display_info(self):
        info = super().display_info()
        if self.can_fly:
            return f"{info} and can fly."
        else:
            return f"{info} and cannot fly."

    def fly(self):
        if self.can_fly:
            return f"{self.name} is flying!"
        else:
            return f"{self.name} cannot fly."
```

---

## Child Class: Fish

```python
class Fish(Animal):
    def __init__(self, name, category, habitat):
        super().__init__(name, category)
        self.habitat = habitat

    def display_info(self):
        return f"{super().display_info()} and lives in {self.habitat}."

    def swim(self):
        return f"{self.name} is swimming in {self.habitat}."
```

---

## Creating Objects & Using Methods

```python
eagle = Bird("Eagle", "bird", True)
penguin = Bird("Penguin", "bird", False)
salmon = Fish("Salmon", "fish", "freshwater")
clownfish = Fish("Clownfish", "fish", "saltwater")

print(eagle.display_info())
print(eagle.fly())

print(penguin.display_info())
print(penguin.fly())

print(salmon.display_info())
print(salmon.swim())

print(clownfish.display_info())
print(clownfish.swim())
```

---

## Why Inheritance Is Useful

- Avoids repeating code (DRY principle).  
- Provides a logical hierarchy for your classes.  
- Allows extension and customization of base class behavior.  
- Makes code more flexible and easier to maintain.


