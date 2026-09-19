# C++ - Interview Ready Guide

**1. Fundamentals** - What It Is, Basic Syntax

**2. Memory Management** - new/delete, RAII, Smart Pointers

**3. Classes and OOP** - Constructors, Inheritance, Virtual Functions

**4. Templates** - Function Templates, Class Templates, Specialization

**5. STL Containers** - vector, map, set, unordered_map

**6. Modern C++** - auto, lambda, move semantics, constexpr

**7. Interview Prep** - Common Questions

---

## What It Is

C++ is a high-performance, general-purpose programming language created by Bjarne Stroustrup in 1979 as an extension of C. It adds object-oriented features, templates, and the STL while maintaining C's low-level memory control.

C++ is used for:
- Operating systems (Windows, macOS components)
- Game engines (Unreal, Unity internals)
- Browsers (Chrome, Firefox)
- Databases (MySQL, MongoDB)
- Embedded systems
- High-frequency trading
- Compilers and interpreters

---

## Basic Syntax

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
    // Variables
    int x = 10;
    double pi = 3.14159;
    bool flag = true;
    char c = 'A';
    std::string name = "Steve";
    
    // Output
    std::cout << "Hello, " << name << std::endl;
    
    // Input
    std::cin >> x;
    
    // Arrays
    int arr[5] = {1, 2, 3, 4, 5};
    
    // Vector (dynamic array)
    std::vector<int> vec = {1, 2, 3};
    vec.push_back(4);
    
    // Loops
    for (int i = 0; i < 5; i++) {
        std::cout << i << std::endl;
    }
    
    for (int val : vec) {  // Range-based for
        std::cout << val << std::endl;
    }
    
    return 0;
}
```

---

## Memory Management

```cpp
// Stack allocation (automatic)
int x = 10;  // Deallocated when scope ends

// Heap allocation (manual)
int* ptr = new int(42);
delete ptr;  // Must free manually

int* arr = new int[10];
delete[] arr;  // Array deletion

// Smart pointers (C++11+, preferred)
#include <memory>

std::unique_ptr<int> uptr = std::make_unique<int>(42);
// Automatically deleted when out of scope

std::shared_ptr<int> sptr = std::make_shared<int>(42);
// Reference counted, deleted when count reaches 0

std::weak_ptr<int> wptr = sptr;  // Non-owning reference
```

---

## Classes and OOP

```cpp
class Animal {
protected:
    std::string name;
    
public:
    // Constructor
    Animal(const std::string& n) : name(n) {}
    
    // Virtual destructor (important for inheritance)
    virtual ~Animal() = default;
    
    // Virtual method (can be overridden)
    virtual void speak() const {
        std::cout << name << " makes a sound" << std::endl;
    }
    
    // Pure virtual (abstract method)
    virtual void move() const = 0;
};

class Dog : public Animal {
public:
    Dog(const std::string& n) : Animal(n) {}
    
    void speak() const override {
        std::cout << name << " barks" << std::endl;
    }
    
    void move() const override {
        std::cout << name << " runs" << std::endl;
    }
};

// Usage
std::unique_ptr<Animal> animal = std::make_unique<Dog>("Buddy");
animal->speak();  // "Buddy barks"
```

---

## Templates

```cpp
// Function template
template<typename T>
T max(T a, T b) {
    return (a > b) ? a : b;
}

int result = max(3, 5);       // int version
double d = max(3.14, 2.71);   // double version

// Class template
template<typename T>
class Stack {
private:
    std::vector<T> data;
    
public:
    void push(const T& item) {
        data.push_back(item);
    }
    
    T pop() {
        T item = data.back();
        data.pop_back();
        return item;
    }
};

Stack<int> intStack;
Stack<std::string> strStack;
```

---

## STL Containers

```cpp
#include <vector>
#include <map>
#include <set>
#include <unordered_map>

// Vector
std::vector<int> v = {1, 2, 3};
v.push_back(4);
v[0];  // Access
v.size();

// Map (ordered)
std::map<std::string, int> ages;
ages["Alice"] = 30;
ages.count("Alice");  // Check existence

// Unordered map (hash map)
std::unordered_map<std::string, int> fast_ages;

// Set
std::set<int> unique_nums = {3, 1, 4, 1, 5};  // {1, 3, 4, 5}

// Iteration
for (const auto& [key, value] : ages) {
    std::cout << key << ": " << value << std::endl;
}
```

---

## Modern C++ Features (C++11/14/17/20)

```cpp
// Auto type deduction
auto x = 42;           // int
auto vec = std::vector<int>{1, 2, 3};

// Lambda expressions
auto add = [](int a, int b) { return a + b; };
auto capture = [&x]() { return x * 2; };  // Capture by reference

// Range-based for
for (const auto& item : container) { }

// nullptr (not NULL)
int* ptr = nullptr;

// Move semantics
std::vector<int> v1 = {1, 2, 3};
std::vector<int> v2 = std::move(v1);  // v1 is now empty

// Optional (C++17)
#include <optional>
std::optional<int> maybe_value = std::nullopt;

// Structured bindings (C++17)
auto [x, y] = std::make_pair(1, 2);
```

---

## Interview Questions

**Q: What's the difference between stack and heap?**

A: Stack: automatic, fast, limited size, LIFO. Heap: manual (new/delete), slower, larger, fragmentation possible. Use stack for small, short-lived objects. Heap for dynamic-size or long-lived objects. Smart pointers manage heap memory automatically.

**Q: Explain virtual functions.**

A: Virtual functions enable runtime polymorphism. Base class pointer can call derived class implementation. Uses vtable (virtual table) for dispatch. Pure virtual (= 0) makes class abstract. Always use virtual destructors in base classes.

**Q: What are smart pointers?**

A: Automatic memory management. unique_ptr: sole ownership, can't copy. shared_ptr: shared ownership via reference counting. weak_ptr: non-owning reference, prevents cycles. Prefer over raw pointers.

**Q: Explain RAII.**

A: Resource Acquisition Is Initialization. Resources (memory, files, locks) are acquired in constructor, released in destructor. Guarantees cleanup even with exceptions. Foundation of C++ resource management.

---

## Resources

- https://en.cppreference.com/
- https://isocpp.org/
- https://www.learncpp.com/
