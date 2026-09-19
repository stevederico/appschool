# Python - Interview Ready Guide

**1. Fundamentals** - What It Is, Python vs JavaScript

**2. Basic Syntax** - Variables, Types, Strings, Operators

**3. Data Structures** - Lists, Dictionaries, Sets, Tuples

**4. Control Flow** - Conditionals, Loops, Comprehensions

**5. Functions** - Definitions, Args/Kwargs, Lambda, Decorators

**6. OOP** - Classes, Inheritance, Magic Methods

**7. Error Handling** - Try/Except, Custom Exceptions

**8. File I/O** - Reading, Writing, Context Managers

**9. Modules** - Imports, Packages, Virtual Environments

**10. Async** - async/await, Concurrency

**11. Interview Prep** - Common Questions, Practice Project

---

## What It Is

Python is a high-level, interpreted programming language known for its readability and simplicity. Created by Guido van Rossum and first released in 1991, Python emphasizes code readability with its use of significant whitespace and clean syntax.

Python's philosophy (The Zen of Python) prioritizes:
- Readability counts
- Simple is better than complex
- There should be one obvious way to do it

This makes Python an excellent first language and a powerful tool for experienced developers. It's used extensively in web development, data science, machine learning, automation, and scripting.

```python
# Python is readable by design
def greet(name):
    return f"Hello, {name}!"

users = ["Alice", "Bob", "Charlie"]
greetings = [greet(user) for user in users]
print(greetings)
# ['Hello, Alice!', 'Hello, Bob!', 'Hello, Charlie!']
```

---

## Python vs JavaScript

Coming from JavaScript, here are key differences:

| Concept | JavaScript | Python |
|---------|-----------|--------|
| Indentation | Optional (style) | Required (syntax) |
| Variables | `let`, `const`, `var` | Just assign |
| None/Null | `null`, `undefined` | `None` |
| Boolean | `true`, `false` | `True`, `False` |
| Arrays | `[]` | Lists `[]` |
| Objects | `{}` | Dictionaries `{}` |
| Functions | `function` or `=>` | `def` or `lambda` |
| Print | `console.log()` | `print()` |
| String format | Template literals | f-strings |
| And/Or | `&&`, `||` | `and`, `or` |
| Not | `!` | `not` |
| Equality | `===` | `==` |

```javascript
// JavaScript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((a, b) => a + b, 0);
```

```python
# Python
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
evens = [n for n in numbers if n % 2 == 0]
total = sum(numbers)  # Built-in sum function
```

---

## Basic Syntax

### Variables and Types

```python
# Variables - no declaration keyword needed
name = "Steve"
age = 30
price = 19.99
is_active = True

# Type checking
type(name)      # <class 'str'>
type(age)       # <class 'int'>
type(price)     # <class 'float'>
type(is_active) # <class 'bool'>

# Multiple assignment
x, y, z = 1, 2, 3
a = b = c = 0

# Type conversion
str(42)         # "42"
int("42")       # 42
float("3.14")   # 3.14
bool(1)         # True
bool(0)         # False
list("abc")     # ['a', 'b', 'c']
```

### Strings

```python
# String creation
single = 'Hello'
double = "World"
multi = """This is
a multi-line
string"""

# f-strings (formatted string literals) - like template literals
name = "Steve"
age = 30
message = f"Hello, {name}! You are {age} years old."
calc = f"2 + 2 = {2 + 2}"

# String methods
text = "hello world"
text.upper()         # "HELLO WORLD"
text.lower()         # "hello world"
text.title()         # "Hello World"
text.capitalize()    # "Hello world"
text.strip()         # Remove whitespace
text.split()         # ["hello", "world"]
text.split(",")      # Split on comma
text.replace("o", "0")  # "hell0 w0rld"
text.startswith("hello")  # True
text.endswith("world")    # True
"world" in text      # True

# String slicing
s = "Python"
s[0]      # "P"
s[-1]     # "n" (last character)
s[0:3]    # "Pyt" (indices 0, 1, 2)
s[2:]     # "thon" (from index 2 to end)
s[:3]     # "Pyt" (start to index 3)
s[::2]    # "Pto" (every 2nd character)
s[::-1]   # "nohtyP" (reversed)
```

### Numbers

```python
# Integers
x = 42
big = 1_000_000  # Underscores for readability

# Floats
pi = 3.14159
sci = 1.5e-10   # Scientific notation

# Operations
10 + 3   # 13 (addition)
10 - 3   # 7 (subtraction)
10 * 3   # 30 (multiplication)
10 / 3   # 3.333... (true division)
10 // 3  # 3 (floor division)
10 % 3   # 1 (modulo)
10 ** 3  # 1000 (exponent)

# Built-in functions
abs(-5)         # 5
round(3.7)      # 4
round(3.14159, 2)  # 3.14
min(1, 2, 3)    # 1
max(1, 2, 3)    # 3
pow(2, 3)       # 8
```

### Booleans and Comparisons

```python
# Boolean values
is_valid = True
is_empty = False

# Comparison operators
x == y   # Equal
x != y   # Not equal
x > y    # Greater than
x < y    # Less than
x >= y   # Greater or equal
x <= y   # Less or equal

# Logical operators
True and False   # False
True or False    # True
not True         # False

# Chained comparisons (Python unique feature)
1 < x < 10       # True if x is between 1 and 10
a == b == c      # True if all equal

# Truthy/Falsy values
# Falsy: None, False, 0, 0.0, "", [], {}, set()
# Everything else is truthy

if []:
    print("Won't print - empty list is falsy")
    
if [1, 2, 3]:
    print("Will print - non-empty list is truthy")
```

---

## Data Structures

### Lists (like JavaScript arrays)

```python
# Creating lists
numbers = [1, 2, 3, 4, 5]
mixed = [1, "two", 3.0, True]
empty = []

# Accessing elements
numbers[0]      # 1 (first)
numbers[-1]     # 5 (last)
numbers[1:3]    # [2, 3] (slice)

# Modifying lists
numbers.append(6)       # Add to end
numbers.insert(0, 0)    # Insert at index
numbers.extend([7, 8])  # Add multiple
numbers.remove(3)       # Remove first occurrence
numbers.pop()           # Remove and return last
numbers.pop(0)          # Remove and return at index
del numbers[0]          # Delete at index

# List operations
len(numbers)            # Length
numbers.sort()          # Sort in place
sorted(numbers)         # Return sorted copy
numbers.reverse()       # Reverse in place
numbers.index(3)        # Find index of value
numbers.count(3)        # Count occurrences
3 in numbers            # Check membership

# List comprehensions (powerful!)
squares = [x ** 2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]

pairs = [(x, y) for x in [1, 2] for y in [3, 4]]
# [(1, 3), (1, 4), (2, 3), (2, 4)]
```

### Dictionaries (like JavaScript objects)

```python
# Creating dictionaries
user = {
    "name": "Steve",
    "age": 30,
    "email": "steve@test.com"
}

# Accessing values
user["name"]            # "Steve"
user.get("name")        # "Steve"
user.get("phone", "N/A")  # "N/A" (default if missing)

# Modifying dictionaries
user["age"] = 31        # Update
user["phone"] = "123"   # Add new key
del user["phone"]       # Delete key
user.pop("email")       # Remove and return

# Dictionary methods
user.keys()             # dict_keys(['name', 'age'])
user.values()           # dict_values(['Steve', 30])
user.items()            # dict_items([('name', 'Steve'), ('age', 30)])
"name" in user          # True (check key exists)

# Iterating
for key in user:
    print(key, user[key])

for key, value in user.items():
    print(f"{key}: {value}")

# Dictionary comprehensions
squares = {x: x ** 2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

### Tuples (immutable lists)

```python
# Creating tuples
point = (10, 20)
single = (42,)  # Single element needs comma
coords = 10, 20  # Parentheses optional

# Accessing (like lists)
point[0]        # 10
point[-1]       # 20

# Unpacking
x, y = point    # x=10, y=20
first, *rest = [1, 2, 3, 4]  # first=1, rest=[2, 3, 4]

# Tuples are immutable
point[0] = 5    # Error! Cannot modify

# Use cases: function return values, dict keys, data integrity
def get_coordinates():
    return (10, 20)

x, y = get_coordinates()
```

### Sets (unique values)

```python
# Creating sets
numbers = {1, 2, 3, 3, 4}  # {1, 2, 3, 4} - duplicates removed
from_list = set([1, 2, 2, 3])
empty = set()  # {} creates empty dict, not set

# Set operations
a = {1, 2, 3}
b = {2, 3, 4}

a | b   # Union: {1, 2, 3, 4}
a & b   # Intersection: {2, 3}
a - b   # Difference: {1}
a ^ b   # Symmetric difference: {1, 4}

# Modifying sets
a.add(5)
a.remove(1)     # Error if not exists
a.discard(1)    # No error if not exists
a.pop()         # Remove arbitrary element

# Set comprehensions
evens = {x for x in range(10) if x % 2 == 0}
```

---

## Control Flow

### Conditionals

```python
# if/elif/else
age = 20

if age < 18:
    print("Minor")
elif age < 65:
    print("Adult")
else:
    print("Senior")

# Ternary expression
status = "adult" if age >= 18 else "minor"

# Match statement (Python 3.10+, like switch)
match status:
    case "pending":
        process_pending()
    case "approved":
        process_approved()
    case "rejected":
        process_rejected()
    case _:
        handle_unknown()
```

### Loops

```python
# for loop
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

for i in range(2, 10, 2):  # start, stop, step
    print(i)  # 2, 4, 6, 8

for item in [1, 2, 3]:
    print(item)

for char in "hello":
    print(char)

for key, value in user.items():
    print(f"{key}: {value}")

# enumerate for index and value
for i, item in enumerate(["a", "b", "c"]):
    print(f"{i}: {item}")

# zip for parallel iteration
names = ["Alice", "Bob"]
ages = [25, 30]
for name, age in zip(names, ages):
    print(f"{name} is {age}")

# while loop
count = 0
while count < 5:
    print(count)
    count += 1

# break and continue
for i in range(10):
    if i == 3:
        continue  # Skip this iteration
    if i == 7:
        break     # Exit loop
    print(i)

# else clause (runs if loop completes without break)
for i in range(5):
    if i == 10:
        break
else:
    print("Loop completed without break")
```

---

## Functions

### Basic Functions

```python
# Function definition
def greet(name):
    """Return a greeting message."""  # Docstring
    return f"Hello, {name}!"

# Calling functions
message = greet("Steve")

# Default parameters
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Steve")           # "Hello, Steve!"
greet("Steve", "Hi")     # "Hi, Steve!"

# Keyword arguments
greet(greeting="Hey", name="Steve")

# Multiple return values (as tuple)
def get_stats(numbers):
    return min(numbers), max(numbers), sum(numbers)

minimum, maximum, total = get_stats([1, 2, 3, 4, 5])
```

### Args and Kwargs

```python
# *args - variable positional arguments
def sum_all(*numbers):
    return sum(numbers)

sum_all(1, 2, 3)      # 6
sum_all(1, 2, 3, 4, 5)  # 15

# **kwargs - variable keyword arguments
def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Steve", age=30)

# Combined
def func(required, *args, **kwargs):
    print(required)
    print(args)
    print(kwargs)

func("hello", 1, 2, 3, key="value")
```

### Lambda Functions

```python
# Lambda - anonymous functions
square = lambda x: x ** 2
add = lambda x, y: x + y

# Common with map, filter, sorted
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))

# Sorting with key function
users = [{"name": "Bob", "age": 30}, {"name": "Alice", "age": 25}]
sorted_users = sorted(users, key=lambda u: u["age"])
```

### Type Hints

```python
# Python 3.5+ type annotations
def greet(name: str) -> str:
    return f"Hello, {name}!"

def process(items: list[int]) -> dict[str, int]:
    return {"count": len(items), "sum": sum(items)}

# Optional and Union
from typing import Optional, Union

def find_user(user_id: int) -> Optional[dict]:
    # Returns dict or None
    pass

def process(value: Union[str, int]) -> str:
    # Accepts string or int
    return str(value)

# Python 3.10+ simplified syntax
def process(value: str | int) -> str:
    return str(value)
```

---

## Classes and OOP

### Basic Classes

```python
class User:
    """A simple user class."""
    
    # Class variable (shared by all instances)
    default_role = "user"
    
    def __init__(self, name: str, email: str):
        """Initialize user with name and email."""
        # Instance variables
        self.name = name
        self.email = email
        self.role = User.default_role
    
    def greet(self) -> str:
        """Return a greeting."""
        return f"Hello, I'm {self.name}"
    
    def __str__(self) -> str:
        """String representation."""
        return f"User({self.name}, {self.email})"
    
    def __repr__(self) -> str:
        """Developer representation."""
        return f"User(name='{self.name}', email='{self.email}')"

# Creating instances
user = User("Steve", "steve@test.com")
print(user.name)      # Steve
print(user.greet())   # Hello, I'm Steve
print(user)           # User(Steve, steve@test.com)
```

### Inheritance

```python
class Animal:
    def __init__(self, name: str):
        self.name = name
    
    def speak(self) -> str:
        raise NotImplementedError("Subclass must implement")

class Dog(Animal):
    def speak(self) -> str:
        return f"{self.name} says Woof!"

class Cat(Animal):
    def speak(self) -> str:
        return f"{self.name} says Meow!"

dog = Dog("Buddy")
print(dog.speak())  # Buddy says Woof!

# Check inheritance
isinstance(dog, Dog)     # True
isinstance(dog, Animal)  # True
issubclass(Dog, Animal)  # True
```

### Properties and Encapsulation

```python
class Circle:
    def __init__(self, radius: float):
        self._radius = radius  # Convention: underscore = private
    
    @property
    def radius(self) -> float:
        """Get the radius."""
        return self._radius
    
    @radius.setter
    def radius(self, value: float):
        """Set the radius with validation."""
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value
    
    @property
    def area(self) -> float:
        """Calculated property."""
        return 3.14159 * self._radius ** 2

circle = Circle(5)
print(circle.radius)  # 5
print(circle.area)    # 78.54...
circle.radius = 10    # Uses setter
circle.radius = -1    # Raises ValueError
```

### Dataclasses (Python 3.7+)

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class User:
    name: str
    email: str
    age: int
    role: str = "user"  # Default value
    tags: list[str] = field(default_factory=list)

# Automatically generates __init__, __repr__, __eq__
user = User("Steve", "steve@test.com", 30)
print(user)  # User(name='Steve', email='steve@test.com', age=30, role='user', tags=[])

# Immutable dataclass
@dataclass(frozen=True)
class Point:
    x: float
    y: float
```

---

## Error Handling

```python
# try/except
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero!")

# Multiple exceptions
try:
    value = int("not a number")
except ValueError:
    print("Invalid number")
except TypeError:
    print("Type error")
except (ValueError, TypeError) as e:
    print(f"Error: {e}")

# else and finally
try:
    result = 10 / 2
except ZeroDivisionError:
    print("Division error")
else:
    print(f"Result: {result}")  # Runs if no exception
finally:
    print("Cleanup")  # Always runs

# Raising exceptions
def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

# Custom exceptions
class ValidationError(Exception):
    def __init__(self, message, field=None):
        super().__init__(message)
        self.field = field

raise ValidationError("Invalid email", field="email")
```

---

## File I/O

```python
# Reading files
with open("file.txt", "r") as f:
    content = f.read()         # Entire file as string
    
with open("file.txt", "r") as f:
    lines = f.readlines()      # List of lines

with open("file.txt", "r") as f:
    for line in f:             # Iterate line by line (memory efficient)
        print(line.strip())

# Writing files
with open("output.txt", "w") as f:
    f.write("Hello, World!\n")
    f.writelines(["Line 1\n", "Line 2\n"])

# Append mode
with open("log.txt", "a") as f:
    f.write("New log entry\n")

# JSON
import json

# Write JSON
data = {"name": "Steve", "age": 30}
with open("data.json", "w") as f:
    json.dump(data, f, indent=2)

# Read JSON
with open("data.json", "r") as f:
    data = json.load(f)

# JSON strings
json_str = json.dumps(data)
data = json.loads(json_str)
```

---

## Modules and Packages

```python
# Importing modules
import math
math.sqrt(16)  # 4.0

from math import sqrt, pi
sqrt(16)  # 4.0

from math import *  # Import all (avoid in production)

import math as m  # Alias
m.sqrt(16)

# Creating modules
# mymodule.py
def greet(name):
    return f"Hello, {name}!"

PI = 3.14159

# main.py
import mymodule
mymodule.greet("Steve")

from mymodule import greet
greet("Steve")

# Package structure
# mypackage/
#   __init__.py
#   module1.py
#   module2.py
#   subpackage/
#     __init__.py
#     module3.py

from mypackage import module1
from mypackage.subpackage import module3
```

---

## Common Standard Library

```python
# os - Operating system interface
import os

os.getcwd()                    # Current directory
os.listdir(".")                # List directory
os.path.exists("file.txt")     # Check if exists
os.path.join("dir", "file")    # Join paths
os.environ.get("API_KEY")      # Environment variables
os.makedirs("dir/subdir", exist_ok=True)

# datetime - Date and time
from datetime import datetime, timedelta

now = datetime.now()
today = datetime.today().date()
formatted = now.strftime("%Y-%m-%d %H:%M:%S")
parsed = datetime.strptime("2024-01-15", "%Y-%m-%d")
future = now + timedelta(days=7)

# collections - Specialized containers
from collections import Counter, defaultdict, namedtuple

counter = Counter(["a", "b", "a", "c", "a"])  # {'a': 3, 'b': 1, 'c': 1}
counter.most_common(2)  # [('a', 3), ('b', 1)]

dd = defaultdict(list)
dd["key"].append(1)  # No KeyError for missing keys

Point = namedtuple("Point", ["x", "y"])
p = Point(10, 20)

# itertools - Iterator tools
from itertools import chain, combinations, permutations

list(chain([1, 2], [3, 4]))  # [1, 2, 3, 4]
list(combinations([1, 2, 3], 2))  # [(1,2), (1,3), (2,3)]

# functools - Higher-order functions
from functools import reduce, lru_cache

total = reduce(lambda a, b: a + b, [1, 2, 3, 4])  # 10

@lru_cache(maxsize=100)
def expensive_function(n):
    # Results are cached
    return n ** 2
```

---

## Async/Await

```python
import asyncio

# Async function
async def fetch_data(url: str) -> dict:
    print(f"Fetching {url}...")
    await asyncio.sleep(1)  # Simulate network delay
    return {"url": url, "data": "..."}

# Running async code
async def main():
    result = await fetch_data("https://api.example.com")
    print(result)

asyncio.run(main())

# Concurrent execution
async def main():
    # Run multiple coroutines concurrently
    results = await asyncio.gather(
        fetch_data("url1"),
        fetch_data("url2"),
        fetch_data("url3")
    )
    print(results)

# With aiohttp for real HTTP requests
import aiohttp

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.json()

async def main():
    async with aiohttp.ClientSession() as session:
        data = await fetch(session, "https://api.example.com/data")
        print(data)
```

---

## Virtual Environments

```bash
# Create virtual environment
python -m venv venv

# Activate
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install packages
pip install requests flask

# Save dependencies
pip freeze > requirements.txt

# Install from requirements
pip install -r requirements.txt

# Deactivate
deactivate
```

---

## Interview Questions

**Q: What is Python and what are its key features?**

A: Python is a high-level, interpreted, dynamically-typed language known for readability. Key features: significant whitespace (indentation matters), duck typing, extensive standard library, garbage collection, support for multiple paradigms (OOP, functional, procedural). Used in web development, data science, ML, automation, and scripting.

**Q: Explain list comprehensions.**

A: List comprehensions provide a concise way to create lists. Syntax: `[expression for item in iterable if condition]`. Example: `[x**2 for x in range(10) if x % 2 == 0]` creates squares of even numbers. More readable than map/filter for simple transformations. Also available for dicts, sets, and generators.

**Q: What's the difference between `==` and `is`?**

A: `==` compares values (equality), `is` compares identity (same object in memory). `a == b` is True if they have equal values. `a is b` is True only if both reference the exact same object. Use `is` for None checks (`if x is None`), `==` for value comparisons.

**Q: Explain *args and **kwargs.**

A: `*args` collects extra positional arguments into a tuple. `**kwargs` collects extra keyword arguments into a dictionary. Use when you don't know how many arguments will be passed. Can unpack with `*` and `**` when calling functions: `func(*list_args, **dict_kwargs)`.

**Q: What are decorators?**

A: Decorators are functions that modify other functions. They wrap functions to add behavior. Syntax: `@decorator` above function definition. Common uses: logging, timing, authentication, caching. Example: `@lru_cache` for memoization. Can be chained and can accept arguments.

**Q: Explain Python's GIL.**

A: Global Interpreter Lock (GIL) is a mutex in CPython that allows only one thread to execute Python bytecode at a time. This limits true parallelism for CPU-bound tasks. Workarounds: multiprocessing for CPU tasks (separate processes, no GIL), asyncio for I/O-bound tasks. GIL doesn't affect multi-threading for I/O operations.

**Q: What are generators?**

A: Generators are functions that yield values one at a time instead of returning a complete list. Use `yield` instead of `return`. Memory efficient for large sequences since values are generated on demand. Generator expressions: `(x**2 for x in range(1000000))`. Support iteration protocol.

---

## Practice Project

Build a CLI tool that fetches and processes data:

**Requirements:**
1. Use argparse for command-line arguments
2. Fetch data from an API using requests
3. Process and filter the data
4. Output as JSON or formatted text
5. Handle errors gracefully
6. Use type hints throughout
7. Include unit tests with pytest

---

## Resources

- https://docs.python.org/3/tutorial/ (Official tutorial)
- https://realpython.com/ (Tutorials and guides)
- https://automatetheboringstuff.com/ (Free book)
- https://www.learnpython.org/ (Interactive tutorial)
