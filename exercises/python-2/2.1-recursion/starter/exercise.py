# Recursion Practice Exercises

# In this exercise, you will practice implementing recursive functions.
# Remember: Every recursive function needs a BASE CASE to stop the recursion!

# ============================================================================
# Task 1: Sum of Numbers
# ============================================================================
# Write a recursive function called `sum_numbers(n)` that:
# - Takes a positive integer `n` as input
# - Returns the sum of all numbers from 1 to n
# - For example: sum_numbers(5) should return 1 + 2 + 3 + 4 + 5 = 15
#
# HINT: Think about what the base case should be (when should recursion stop?)
#       Then think about the recursive case (what should we add to the recursive call?)
#
# Example usage:
# print(sum_numbers(5))   # Output: 15
# print(sum_numbers(10))  # Output: 55

def sum_numbers(n):
    # Write your code here
    pass


# ============================================================================
# Task 2: Power Function
# ============================================================================
# Write a recursive function called `power(base, exponent)` that:
# - Takes two integers: `base` and `exponent`
# - Returns base raised to the power of exponent (base^exponent)
# - For example: power(2, 3) should return 2^3 = 8
#
# HINT: base^exponent = base * base^(exponent-1)
#       What's the base case? When exponent reaches 0
#
# Example usage:
# print(power(2, 3))   # Output: 8
# print(power(5, 2))   # Output: 25
# print(power(3, 0))   # Output: 1

def power(base, exponent):
    # Write your code here
    pass


# ============================================================================
# Task 3: String Reversal
# ============================================================================
# Write a recursive function called `reverse_string(s)` that:
# - Takes a string `s` as input
# - Returns the string reversed
# - For example: reverse_string("hello") should return "olleh"
#
# HINT: The last character + the reverse of everything before it
#       String slicing: s[:-1] gives you all characters except the last one
#       String indexing: s[-1] gives you the last character
#
# Example usage:
# print(reverse_string("hello"))   # Output: olleh
# print(reverse_string("Python"))  # Output: nohtyP
# print(reverse_string(""))        # Output: 

def reverse_string(s):
    # Write your code here
    pass


# ============================================================================
# Task 4: Palindrome Checker
# ============================================================================
# Write a recursive function called `is_palindrome(s)` that:
# - Takes a string `s` as input
# - Returns True if the string is a palindrome, False otherwise
# - A palindrome is a word that reads the same forwards and backwards
# - For example: is_palindrome("racecar") returns True
#                is_palindrome("hello") returns False
#
# HINT: Check if the first and last characters match
#       Then recursively check the middle part of the string
#       s[1:-1] gives you everything except the first and last character
#
# Example usage:
# print(is_palindrome("racecar"))  # Output: True
# print(is_palindrome("hello"))    # Output: False
# print(is_palindrome("noon"))     # Output: True
# print(is_palindrome("a"))        # Output: True

def is_palindrome(s):
    # Write your code here
    pass


# ============================================================================
# Task 5: Challenge - Fibonacci with Memoization (Optional)
# ============================================================================
# The basic recursive fibonacci function is very slow because it recalculates
# the same values many times. Let's make it faster using memoization!
#
# Write a recursive function called `fibonacci_memo(n, memo=None)` that:
# - Takes an integer `n` and an optional dictionary `memo`
# - Returns the nth Fibonacci number
# - Uses memoization to cache results and avoid recalculation
# - The memo dictionary stores previously calculated results
#
# HINT: Before calculating, check if n is already in memo
#       If it is, return memo[n]
#       If not, calculate it, store it in memo, then return it
#
# Example usage:
# print(fibonacci_memo(7))   # Output: 13
# print(fibonacci_memo(30))  # Output: 832040 (fast!)

def fibonacci_memo(n, memo=None):
    # Initialize memo dictionary on first call
    if memo is None:
        memo = {}
    
    # Write your code here
    pass
