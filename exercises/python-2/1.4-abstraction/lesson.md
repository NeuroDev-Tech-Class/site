# Abstraction

## Overview

Abstraction is a principle of Object-Oriented Programming (OOP) that involves hiding the complex implementation details of an object and showing only the essential features. It helps in reducing programming complexity and effort. In Python, abstraction can be achieved by defining methods in the base class that do not contain implementation, forcing subclasses to provide the implementation.

---

## Base Class: Shape

The `Shape` class serves as our abstract base class with common data members and abstract methods that subclasses must implement.

```python
import math  # We'll need this later

# Base class with common data members and abstract methods
class Shape:
    def __init__(self, color):
        self.color = color  # Common attribute for all shapes

    def area(self):
        # Abstract method, needs to be implemented by subclasses
        raise NotImplementedError("Subclasses must implement this method")

    def perimeter(self):
        # Abstract method, needs to be implemented by subclasses
        raise NotImplementedError("Subclasses must implement this method")

    def display_info(self):
        # Common method that can be overridden by subclasses
        return f"A {self.color} shape"
```

### Key Points:
- The `Shape` class defines the interface that all shape subclasses must follow
- **Abstract methods** (`area()` and `perimeter()`) raise `NotImplementedError` to force subclasses to implement them
- **Common method** (`display_info()`) can be overridden by subclasses for specific implementations
- The `color` attribute is shared by all shape objects

---

## Subclass: Rectangle

The `Rectangle` class extends `Shape` and provides concrete implementations of the abstract methods.

```python
class Rectangle(Shape):
    def __init__(self, width, height, color):
        super().__init__(color)  # Call the constructor of the base class
        self.width = width
        self.height = height

    def area(self):
        # Implementing the abstract method
        return self.width * self.height

    def perimeter(self):
        # Implementing the abstract method
        return 2 * (self.width + self.height)

    def display_info(self):
        # Overriding the method to include additional information
        return f"A {self.color} rectangle with width {self.width} and height {self.height}"
```

### Key Points:
- `Rectangle` inherits from `Shape` and must implement all abstract methods
- Uses `super().__init__(color)` to initialize the parent class
- Provides specific implementations of `area()` and `perimeter()` for rectangles
- Overrides `display_info()` with rectangle-specific details

---

## Subclass: Circle

The `Circle` class extends `Shape` and provides its own implementations of the abstract methods.

```python
class Circle(Shape):
    def __init__(self, radius, color):
        super().__init__(color)  # Call the constructor of the base class
        self.radius = radius

    def area(self):
        # Implementing the abstract method
        return int(math.pi * self.radius ** 2)

    def perimeter(self):
        # Implementing the abstract method
        return int(2 * math.pi * self.radius)

    def display_info(self):
        # Overriding the method to include additional information
        return f"A {self.color} circle with radius {self.radius}"
```

### Key Points:
- `Circle` inherits from `Shape` and implements all abstract methods
- Uses mathematical formulas specific to circles
- Converts results to integers for cleaner output
- Provides circle-specific information in `display_info()`

---

## Usage Example

```python
# Creating objects of the subclasses
my_rectangle = Rectangle(10, 20, "blue")
my_circle = Circle(15, "red")

# Using the methods to demonstrate abstraction
print(my_rectangle.display_info())                         # A blue rectangle with width 10 and height 20
print(f"Rectangle Area: {my_rectangle.area()}")            # Rectangle Area: 200
print(f"Rectangle Perimeter: {my_rectangle.perimeter()}")  # Rectangle Perimeter: 60

print(my_circle.display_info())                            # A red circle with radius 15
print(f"Circle Area: {my_circle.area()}")                  # Circle Area: 706
print(f"Circle Perimeter: {my_circle.perimeter()}")        # Circle Perimeter: 94
```

### Output:
```
A blue rectangle with width 10 and height 20
Rectangle Area: 200
Rectangle Perimeter: 60
A red circle with radius 15
Circle Area: 706
Circle Perimeter: 94
```

---

## Benefits of Abstraction

1. **Complexity Management**: Hide implementation details and expose only what's necessary
2. **Code Reusability**: Define common behavior in base classes
3. **Enforced Interface**: Subclasses must implement required methods
4. **Flexibility**: Different subclasses can implement methods differently
5. **Maintainability**: Changes to implementation don't affect the interface

