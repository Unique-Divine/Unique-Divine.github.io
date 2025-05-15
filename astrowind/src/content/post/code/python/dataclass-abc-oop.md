---
title: "Python: Dataclasses, Abstract Base Classes (ABC), and Object-Oriented Programming (OOP)"
publishDate: 2021-07-10
image: "/coding-2.png"
type: post
category: Coding
tags:
 - coding
 - python
readingTime: 4 Min read
---

## Abstract Base Classes

An abstract base class specifies the interface that a class should adhere to and acts as an agreement between different parts of a program.

Q: Import the abstract base class and abstract method.

```python
from abc import ABC, abstractmethod
```

Q: Define a short abstract base class, "HelloWorld", with an abstract method called "hello" that should return a string.

```python
from abc import ABC, abstractmethod

class HelloWorld(ABC):

    @abstractmethod
    def hello(self) -> str:
        pass
```

Attempting to create an instance of an abstract base class (ABC) raises an error. You can, however, **create subclasses that inherit from the ABC**. An ABC purely defines the kind of methods that a class that inherits from the ABC should have.

```python
# Assume the ABC, HelloWorld, is implemented in the same file.
class JapaneseHelloWorld(HelloWorld):
    def hello(self) -> str:
        return "こんにちは、世界！"

class ChineseHelloWorld(HelloWorld):
    def hello(self) -> str:
        return "你好世界！"
```

Attempting to create an instance of one of the concrete classes, "JapaneseHelloWorld" and "ChineseHelloWorld", without implementing the "hello" method would raise an error too.

## Data classes

Python's `dataclass` functionality allows you to write shorter code and initialize, print, compare, and order data much more easily.

Why use data classes?

A class for a data container is often used differently. Many instances may need to be made. You probably want to order them, compare them, easily inspect the data inside them, etc.

Regular classes don't provide much built-in convenient functionality for data oriented classes. Classes that build around a behavior may not have as many instances or be conducive to representing data structures. Because of this, some programming languages provide a type of class that is better tuned to storing data, e.g. C#'s struct type that is good for representing data structures.

**Simplest data class: All required arguments**

Data classes have a built-in initialize that will help you quickly fill in an object with data. There are easy ways to print compare and order them.

```python
# Regular class
class Person:
    """A person that has a name, job, and age."""
    name: str
    job: str
    age: int

    def __init__(self, name, job, age):
        self.name = name
        self.job = job
        self.age = age

p1 = Person(name='Joe', job='SDE', age=25)
```

Q: Implement this as a `dataclass`:

```python
from dataclasses import dataclass

@dataclass
class Person:
    """A person that has a name, job, and age."""
    name: str
    job: str
    age: int
```

**Data class with default arguments**

Let's say all of our people usually have the same job title, which is software development engineer ("SDE"). We'd want to set this as a default parameter to save some typing.

```python
from dataclasses import dataclass

@dataclass
class Person:
    """A person that has a name, job, and age."""
    name: str
    job: str = "SDE"
    age: int

p1 = Person(name='Joe', age=25)
```

**Data class with attributes that depend on other parameters**

Dynamically generated attributes can be defined in data classes using the `field` functionality in combination with `__post_init__`.

For example, let's say that the 'age' parameter automatically specifies a job if it's low enough. Otherwise, 'job' will default to "SDE" like before.

```python
from dataclasses import dataclass, field

@dataclass
class Person:
    """A person that has a name, job, and age."""
    name: str
    job: str = field(default = "SDE", init = False)
    age: int

    def __post_init__(self):
        age = self.age
        if (self.job == "SDE") and (age <= 18):
            if age >= 14 and age <= 18:
                self.job = "Student - high school"
            elif age >= 12 and age <= 14:
                self.job = "Student - middle school"
            elif age >= 5 and age <= 12:
                self.job = "Student - elementary school"
            else:
                self.job = "Baby, toddler, or pre-K"
```

Reference: ArjanCodes. 2021. If you're not using Python DATA CLASSES yet, you should. 🚀 [[YouTube](https://youtu.be/vRVVyl9uaZc)]

#### Prefer composition over inheritance

Inheritance makes it difficult to duplicate functionality to different classes.

With composition, our goal is to separate out concepts so that they can be combined in meaningful ways. We're not creating hierarchies of classes.

If we have a class that we want to make subclasses of, it's beneficial to make the first one an abstract base class.

```python
from abc import ABC, abstractmethod
from typing import Optional

class FFNN(ABC):
    """Represents a PyTorch module for a feed-forward neural network."""

    @abstractmethod
    def forward()
        """TODO"""
```

Reference: ArjanCodes. Why COMPOSITION is better than INHERITANCE - detailed Python example. 2021. [[YouTube](https://youtu.be/0mcP8ZpUR38)]

#### `NamedTuple` and `TypedDict`

[PEP 589 – TypedDict: Type Hints for Dictionaries with a Fixed Set of Keys](https://peps.python.org/pep-0589/)

> Representing an object or structured data using (potentially nested)
> dictionaries with string keys (instead of a user-defined class) is a common
> pattern in Python programs. Representing JSON objects is perhaps the canonical
> use case, and this is popular enough that Python ships with a JSON library.
> This PEP proposes a way to allow such code to be type checked more effectively.

```python
from typing import TypedDict

class Movie(TypedDict):
    name: str
    year: int

# a type checker should accept this code:
movie: Movie = {'name': 'Blade Runner',
                'year': 1982}
```
