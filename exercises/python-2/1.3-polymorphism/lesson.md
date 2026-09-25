# Polymorphism in Python

Polymorphism is a key feature of Object-Oriented Programming (OOP) that allows the **same method name** to be used across different objects, even when the underlying implementations differ.  
This enables flexibility, cleaner code, and interchangeable object behavior.

A common phrase that describes this concept is **"duck typing"**:

> *"If it walks like a duck and it quacks like a duck, it must be a duck."*

In Python, if an object implements the required method, it can be used—its specific class doesn’t matter.

---

## Base Class Example

The `Animal` class defines a method `speak()`, which child classes are expected to override.

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        raise NotImplementedError("Subclasses must implement this method")
```

---

## Derived Classes Implementing Polymorphism

Each subclass provides its own version of `speak()`.

```python
class Dog(Animal):
    def speak(self):
        return f"{self.name} says 'Woof'"

class Cat(Animal):
    def speak(self):
        return f"{self.name} says 'Meow'"

class Bird(Animal):
    def speak(self):
        return f"{self.name} says 'Chirp'"
```

---

## Using Polymorphism in Action

Different objects share the same interface (`speak()`),  
but each one behaves according to its own implementation.

```python
my_dog = Dog("Rascal")
my_cat = Cat("Cookie")
my_bird = Bird("Petey")

animals = [my_dog, my_cat, my_bird]

for animal in animals:
    print(animal.speak())
```

### Output

```
Rascal says 'Woof'
Cookie says 'Meow'
Petey says 'Chirp'
```

---

## Why Polymorphism Matters

- Lets you write **generic code** that works with multiple object types.  
- Encourages designing systems around **shared interfaces**.  
- Makes code easier to extend—just create a new class with the expected methods.  
- Helps avoid large if/else or switch statements based on object type.

Polymorphism simplifies program design and enhances flexibility in OOP systems.



