# Inheritance Practice Exercise: Appliance Classes

# ============================================================================
# Task 1: Define a Base Class
# ============================================================================
# Define a base class called `Appliance` with the following attributes:
# - name (a string)
# - brand (a string)
# Add a method `display_info` to the `Appliance` class that returns the name and brand as a string.

class Appliance:
    # Write your code here
    pass


# ============================================================================
# Task 2: Define Child Classes
# ============================================================================
# Define two child classes that inherit from `Appliance`:
# - `WashingMachine`
#   - Additional attribute: `load_capacity` (an integer)
#   - Method: `wash_clothes`, which prints a message about washing clothes with the load capacity.
# - `Refrigerator`
#   - Additional attribute: `temperature` (an integer)
#   - Method: `cool_food`, which prints a message about cooling food with the temperature.
# Make sure that the `display_info` method in each child class includes information about the
# extra attribute.

class WashingMachine(Appliance):
    # Write your code here
    pass


class Refrigerator(Appliance):
    # Write your code here
    pass


# ============================================================================
# Task 3: Initialize Objects
# ============================================================================
# Create objects of both `WashingMachine` and `Refrigerator` classes with appropriate values.



# ============================================================================
# Task 4: Use the Methods
# ============================================================================
# Use the `display_info`, `wash_clothes`, and `cool_food` methods on your objects 
# and print the results.


