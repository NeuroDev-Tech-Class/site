# Polymorphism Practice Exercise: Vehicle Classes

# ============================================================================
# Task 1: Define the Base Class
# ============================================================================
# Define a base class `Vehicle` with an initializer that accepts the vehicle's `name`.
# This class should have a method `move` that raises a NotImplementedError, indicating 
# that derived classes should implement this method.

class Vehicle:
    # Write your code here
    pass


# ============================================================================
# Task 2: Define the Derived Classes
# ============================================================================
# Define three derived classes: `Car`, `Bike`, and `Boat`. Each class should inherit 
# from `Vehicle` and implement the `move` method. The `move` method should return a 
# string describing how the vehicle moves. For example, a `Car` might return 
# "The car drives on roads", a `Bike` might return "The bike pedals on paths", and a 
# `Boat` might return "The boat sails on water".

class Car(Vehicle):
    # Write your code here
    pass


class Bike(Vehicle):
    # Write your code here
    pass


class Boat(Vehicle):
    # Write your code here
    pass


# ============================================================================
# Task 3: Create Objects
# ============================================================================
# Create instances of `Car`, `Bike`, and `Boat` with appropriate names.



# ============================================================================
# Task 4: Demonstrate Polymorphism
# ============================================================================
# Use a loop to iterate over a list of these instances and call the `move` method 
# on each one, printing the result.


