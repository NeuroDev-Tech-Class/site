# Classes, Objects, and Encapsulation in Python

Object-Oriented Programming (OOP) allows you to model real-world concepts using **classes** and **objects**.  
A **class** is a blueprint, and an **object** is an instance created from that blueprint.

This combined lesson includes:

1. **Classes and Objects** — how to define and use classes.  
2. **Encapsulation** — how to protect and manage an object's internal data.

---

## 1. Classes and Objects in Python

### Defining a Simple Class

Below is a simple class that represents a car. It defines attributes such as brand, model, year, and color, and provides methods for displaying and updating information.

```python
class Car:
    def __init__(self, brand, model, year, color):
        self.brand = brand
        self.model = model
        self.year = year
        self.color = color

    def display_info(self):
        return f"Car: {self.color} {self.year} {self.brand} {self.model}"

    def update_year(self, new_year):
        self.year = new_year
```

---

### Creating Objects

```python
your_car = Car("Chevrolet", "Impala", 2015, "Silver")
print(your_car.display_info())
# Output: Car: Silver 2015 Chevrolet Impala
```

---

### Updating Attributes With Methods

```python
my_car = Car("Honda", "Accord", 2003, "White")
print(my_car.display_info())

my_car.update_year(2021)
print(my_car.display_info())
```

---

### Accessing Attributes Directly

```python
print(my_car.brand)
print(my_car.model)

my_car.color = "Black"
print(my_car.display_info())
```

---

### Summary: Classes and Objects

- A class defines structure and behavior.  
- The `__init__` method initializes new objects.  
- Methods provide controlled behavior and updates.  
- Attributes can be accessed directly, but using methods is preferred.

---

## 2. Encapsulation

### What Is Encapsulation?

Encapsulation bundles data and methods into a class and restricts unwanted direct access.  
Python does not strictly enforce access control, but uses conventions such as:

- `_attribute` → intended as private  
- Getter/setter methods → preferred way to access/modify data  

---

## Encapsulating a Class in Python

```python
class Car:
    def __init__(self, brand, model, year, color):
        self._brand = brand
        self._model = model
        self._year = year
        self._color = color

    def get_brand(self):
        return self._brand
    def set_brand(self, brand):
        self._brand = brand

    def get_model(self):
        return self._model
    def set_model(self, model):
        self._model = model

    def get_year(self):
        return self._year
    def set_year(self, year):
        self._year = year

    def get_color(self):
        return self._color
    def set_color(self, color):
        self._color = color

    def display_info(self):
        return f"Car: {self._color} {self._year} {self._brand} {self._model}"
```

---

### Using an Encapsulated Object

```python
my_car = Car("Toyota", "Camry", 2018, "Blue")
print(my_car.display_info())

my_car.set_year(2022)
my_car.set_color("Red")
print(my_car.display_info())

print(my_car.get_brand())
print(my_car.get_model())
```

---

### Avoiding Direct Access

```python
# Discouraged:
# my_car._year = 2025

# Preferred:
my_car.set_year(2025)
```

---

## Final Summary

- **Classes and Objects** define reusable structures and behavior.  
- **Encapsulation** protects internal data and promotes clean, maintainable code.  
- Python uses naming conventions and getter/setter methods rather than strict access control.

These concepts form the foundation for designing reliable, modular programs in Python.
