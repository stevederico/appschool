# Scala - Interview Ready Guide

**1. Fundamentals** - What It Is, Basic Syntax

**2. Classes and Objects** - Case Classes, Companion Objects

**3. Pattern Matching** - Match Expressions, Extractors

**4. Error Handling** - Option, Either, Try

**5. Collections** - List, Map, Set, Transformations

**6. Traits** - Mixins, Trait Stacking

**7. Interview Prep** - Common Questions

---

## What It Is

Scala is a strongly-typed language combining object-oriented and functional programming. It runs on the JVM, interoperates with Java, and is used extensively for big data (Apache Spark) and backend services.

---

## Basic Syntax

```scala
// Variables
val x = 10        // Immutable (like const)
var y = 20        // Mutable

// Type inference
val name: String = "Steve"
val age = 30      // Int inferred

// Functions
def add(a: Int, b: Int): Int = a + b

def greet(name: String): String = {
    s"Hello, $name!"
}

// Anonymous functions (lambdas)
val double = (x: Int) => x * 2
val add = (a: Int, b: Int) => a + b

// Higher-order functions
val nums = List(1, 2, 3, 4, 5)
nums.map(_ * 2)           // List(2, 4, 6, 8, 10)
nums.filter(_ > 2)        // List(3, 4, 5)
nums.reduce(_ + _)        // 15
nums.foldLeft(0)(_ + _)   // 15
```

---

## Classes and Objects

```scala
// Class
class Person(val name: String, var age: Int) {
    def greet(): String = s"Hi, I'm $name"
}

// Case class (immutable data class)
case class User(name: String, email: String)

val user = User("Steve", "steve@test.com")
val user2 = user.copy(email = "new@test.com")
user == User("Steve", "steve@test.com")  // true (structural equality)

// Object (singleton)
object Database {
    def connect(): Unit = println("Connected")
}

// Companion object
object Person {
    def apply(name: String): Person = new Person(name, 0)
}
val p = Person("Steve")  // Calls apply
```

---

## Pattern Matching

```scala
val x = 2
x match {
    case 1 => "one"
    case 2 => "two"
    case _ => "other"
}

// With case classes
sealed trait Shape
case class Circle(radius: Double) extends Shape
case class Rectangle(width: Double, height: Double) extends Shape

def area(shape: Shape): Double = shape match {
    case Circle(r) => Math.PI * r * r
    case Rectangle(w, h) => w * h
}

// Guards
def classify(x: Int): String = x match {
    case n if n < 0 => "negative"
    case 0 => "zero"
    case n if n > 0 => "positive"
}
```

---

## Option and Error Handling

```scala
// Option (no null)
def findUser(id: Int): Option[User] = {
    if (id > 0) Some(User("Steve", "steve@test.com"))
    else None
}

findUser(1).getOrElse(User("Guest", ""))
findUser(1).map(_.name).getOrElse("Unknown")

// Either
def divide(a: Int, b: Int): Either[String, Int] = {
    if (b == 0) Left("Cannot divide by zero")
    else Right(a / b)
}

divide(10, 2) match {
    case Right(result) => println(result)
    case Left(error) => println(error)
}

// Try
import scala.util.{Try, Success, Failure}

Try("42".toInt) match {
    case Success(n) => println(n)
    case Failure(e) => println(e.getMessage)
}
```

---

## Collections

```scala
// Immutable by default
val list = List(1, 2, 3)
val set = Set(1, 2, 2, 3)  // Set(1, 2, 3)
val map = Map("a" -> 1, "b" -> 2)

// Operations
list :+ 4           // Append: List(1, 2, 3, 4)
0 :: list           // Prepend: List(0, 1, 2, 3)
list ++ List(4, 5)  // Concat

// For comprehension
val result = for {
    x <- List(1, 2, 3)
    y <- List(4, 5)
} yield x * y
// List(4, 5, 8, 10, 12, 15)
```

---

## Traits

```scala
trait Printable {
    def format: String
    def print(): Unit = println(format)  // Default implementation
}

trait Loggable {
    def log(msg: String): Unit = println(s"[LOG] $msg")
}

class Document(content: String) extends Printable with Loggable {
    def format: String = content
}
```

---

## Interview Questions

**Q: What is Scala?**

A: Scala combines OOP and functional programming on the JVM. Features: type inference, pattern matching, immutability by default, case classes, traits. Used for Spark, Akka, backend services.

**Q: Explain val vs var.**

A: `val` is immutable (final), `var` is mutable. Prefer `val` for functional programming, thread safety, and cleaner code.

**Q: What are case classes?**

A: Immutable data classes with auto-generated equals, hashCode, toString, copy, and pattern matching support. Used for domain modeling and data transfer.

**Q: Explain Option.**

A: Container for optional values. `Some(value)` or `None`. Eliminates null. Use map/flatMap/getOrElse to work with values safely.

---

## Resources

- https://docs.scala-lang.org/
- https://www.scala-exercises.org/
