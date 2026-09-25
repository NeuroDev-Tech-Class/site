# Operator Overloading Practice Exercise: BankAccount Class

# ============================================================================
# Task 1: Understand Operator Overloading
# ============================================================================
# Review the BankAccount class below. It already implements:
# - __init__: Initialize the account with a balance
# - __add__: Combine two accounts (merge balances)
# - __str__: Return a string representation of the account
#
# Your job is to add support for the subtract (-) operator.

class BankAccount:
    def __init__(self, balance):
        self.balance = balance

    def __add__(self, other):
        return BankAccount(self.balance + other.balance)

    def __str__(self):
        return f"BankAccount(balance: ${self.balance:.2f})"

    # ====================================================================
    # Task 2: Implement the __sub__ Method
    # ====================================================================
    # Add a method that overloads the - operator using __sub__.
    # It should take a numeric value (amount) and return a new BankAccount
    # with the balance reduced by that amount.
    # 
    # Hint: This is similar to __add__, but for subtraction.
    #
    # Write your code here
    pass


# ============================================================================
# Task 3: Test Your Implementation
# ============================================================================
# Once you've implemented __sub__, create a BankAccount object and test
# the subtraction operator to withdraw money.
# Your code should demonstrate using both the __add__ and __sub__ operators.

