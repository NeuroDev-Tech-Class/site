# Recursion

## Overview

Recursion is a programming technique where a function calls itself in order to solve a problem. It breaks down complex problems into smaller, more manageable pieces.

### Key Components of Recursion

Every recursive function has two essential parts:

1. **Base Case**: The condition under which the function stops calling itself. Without a base case, recursion continues infinitely.
2. **Recursive Case**: The part where the function calls itself with modified parameters to progress toward the base case.

---

## Example 1: Factorial Calculation

### Understanding Factorial

The factorial of a non-negative integer $n$ is the product of all positive integers less than or equal to $n$. It's written as $n!$ and is defined as:

$$n! = n \times (n-1) \times (n-2) \times \ldots \times 1$$

For example: $5! = 5 \times 4 \times 3 \times 2 \times 1 = 120$

### Recursive Implementation

```python
def factorial(n):
    # Base case: if n is 0 or 1, return 1
    if n == 0 or n == 1:
        return 1
    else:
        # Recursive case: n * factorial of (n-1)
        return n * factorial(n - 1)

# Testing the factorial function
print("5! =", factorial(5))  # Output: 120
```

### Step-by-Step Execution

When we call `factorial(5)`, here's how the recursion unfolds:

```
factorial(5) → 5 * factorial(4)
factorial(4) → 4 * factorial(3)
factorial(3) → 3 * factorial(2)
factorial(2) → 2 * factorial(1)
factorial(1) → 1 (base case reached)
```

Now the calls return in reverse order:

```
factorial(1) = 1
factorial(2) = 2 * 1 = 2
factorial(3) = 3 * 2 = 6
factorial(4) = 4 * 6 = 24
factorial(5) = 5 * 24 = 120
```

### Key Points:
- **Base Case**: When $n = 0$ or $n = 1$, we return 1 (stops recursion)
- **Recursive Case**: Each call reduces $n$ by 1, moving toward the base case
- **Return Value**: Each level multiplies the result from the previous level

---

## Example 2: Fibonacci Series

### Understanding the Fibonacci Sequence

The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding numbers. The sequence starts with 0 and 1:

$$0, 1, 1, 2, 3, 5, 8, 13, 21, \ldots$$

Each term can be expressed as: $F(n) = F(n-1) + F(n-2)$

### Recursive Implementation

```python
def fibonacci(n):
    # Base cases: if n is 0 or 1, return n
    if n == 0:
        return 0
    elif n == 1:
        return 1
    else:
        # Recursive case: sum of the two preceding Fibonacci numbers
        return fibonacci(n - 1) + fibonacci(n - 2)

# Testing the Fibonacci function
print("Fibonacci of 7:", fibonacci(7))  # Output: 13
```

### Step-by-Step Execution

When we call `fibonacci(7)`, the recursion tree looks like:

```
fibonacci(7) → fibonacci(6) + fibonacci(5)
fibonacci(6) → fibonacci(5) + fibonacci(4)
fibonacci(5) → fibonacci(4) + fibonacci(3)
fibonacci(4) → fibonacci(3) + fibonacci(2)
fibonacci(3) → fibonacci(2) + fibonacci(1)
fibonacci(2) → fibonacci(1) + fibonacci(0)
fibonacci(1) → 1 (base case)
fibonacci(0) → 0 (base case)
```

Working backwards:

```
fibonacci(2) = 1 + 0 = 1
fibonacci(3) = 1 + 1 = 2
fibonacci(4) = 2 + 1 = 3
fibonacci(5) = 3 + 2 = 5
fibonacci(6) = 5 + 3 = 8
fibonacci(7) = 8 + 5 = 13
```

### Key Points:
- **Multiple Base Cases**: Returns 0 for $n=0$ and 1 for $n=1$
- **Multiple Recursive Calls**: Each call makes two additional recursive calls
- **Combines Results**: Adds the results from both recursive calls

---

## Important Considerations

### Stack Overflow Risk

Recursion is a powerful tool, but it must be used carefully. Every recursive function must have a base case that eventually stops the recursion. Without proper base cases, the function will result in **infinite recursion** and a **stack overflow error**.

```python
# ❌ Bad: No base case!
def bad_recursion(n):
    return bad_recursion(n - 1)  # Will crash!
```

### Performance Concerns

While recursion is elegant, some recursive solutions can be inefficient. For example, `fibonacci()` recalculates the same values many times:

```python
# fibonacci(7) calculates fibonacci(5) twice!
# fibonacci(5) calculates fibonacci(3) three times!
# This creates exponential time complexity
```

**Optimization Tip**: Use **memoization** (caching results) to improve recursive function performance.

```python
def fibonacci_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n == 0:
        return 0
    elif n == 1:
        return 1
    memo[n] = fibonacci_memo(n - 1, memo) + fibonacci_memo(n - 2, memo)
    return memo[n]
```

---

## Summary

- **Recursion** allows functions to solve problems by calling themselves
- **Base case** prevents infinite recursion and provides termination
- **Recursive case** breaks the problem into smaller subproblems
- Use recursion when it makes the code clearer and more intuitive
- Always ensure your base case is reachable to avoid stack overflow errors
- Consider optimization techniques like memoization for complex recursive problems

