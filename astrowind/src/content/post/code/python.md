---
publishDate: 2023-08-12T00:00:00Z
author: Unique Divine
title: 'Coding in Python'
excerpt: 'Python code reference and cookbook.'
image: '/coding-1.png'
category: Coding
tags:
  - coding
  - python
# metadata:
#   canonical: https://astrowind.vercel.app/get-started-website-with-astro-tailwind-css
---

#### Table of Contents - Python

- [Table of Contents - Python](#table-of-contents---python)
- [Poetry and Pyenv: Setting up a Professional Python Development Environment](#poetry-and-pyenv-setting-up-a-professional-python-development-environment)
- [Environment variables and `python-dotenv`](#environment-variables-and-python-dotenv)
- [Standard Library](#standard-library)
  - [File Handling - Reading and Writing Files](#file-handling---reading-and-writing-files)
  - [HTTP Requests](#http-requests)
  - [Command Line Applications - Argparse](#command-line-applications---argparse)
  - [Functools](#functools)
  - [Sort() and sorted()](#sort-and-sorted)
  - [Binary and other bases](#binary-and-other-bases)
    - [Display number in scientific notation.](#display-number-in-scientific-notation)
- [Writing Tests with `pytest`](#writing-tests-with-pytest)
  - [Fixtures](#fixtures)
  - [Choosing which tests to run in a suite with `-k`](#choosing-which-tests-to-run-in-a-suite-with--k)
  - [Else: Testing](#else-testing)
    - [Pytest Mock](#pytest-mock)
- [Working with Databases](#working-with-databases)
  - [MongoDB (pymongo)](#mongodb-pymongo)
- [Else](#else)
- [Publishing Packages on PyPi](#publishing-packages-on-pypi)
- [Protocol Buffers](#protocol-buffers)
  - [How does a protocol buffer solve this problem?](#how-does-a-protocol-buffer-solve-this-problem)
  - [Protocol Format](#protocol-format)
- [Miscellaneous](#miscellaneous)

---

## My Writings on Python

1. [Poetry and Pyenv: Setting up a Professional Python Development Environment](./python/setup-dev)

1. [Python: Environment variables and `python-dotenv`](./python/env-vars)

1. [Python: Dataclasses, Abstract Base Classes (ABC), and Object-Oriented Programming (OOP)](./python/dataclass-abc-oop)

---

## Standard Library

### File Handling - Reading and Writing Files

The `open()` function returns a file object.

File objects mediate access to on-disk files. File objects are also called streams.

Q: `file_name (str)` is the name of a file. How do you read the file line by line in Python?

```python
with open(file=file_name, mode="r") as file:
    for idx, line in enumerate(file):
        pass # line (str): A line in the file
```

The two arguments of `open()` are 'file' and 'mode'.

Modes of `open()`:

- Mode `'a'`: For appending data to the end of 'file'.
- Mode `'w'`: For writing only. An existing file with the same name as 'file' will be erased.
- Mode `'r+'`: opens a file for both reading and writing.

Q: Why use the `with` keyword with the `open` method?

It is good practice to use the `with` keyword when dealing with file objects because the file will be properly closed after its suite finishes even if an exception is raised at some point. Using `with` is also much shorter than writing equivalent `try-finally` blocks.

```python
with open(file="some_file") as file:
    pass
file.closed # returns True
```

Q: Creating a blank file.

```python
# Creates blank.txt

# some_path represents a path to some existing directory.
import os
path_to_file = os.path.join(some_path, "blank.txt")
with open(path_to_file, "w") as fh:
    pass
# Verify this worked with...
print(f"Directories and files at {some_path}: {os.listdir(some_path)}")
```

- Python glossary - file object [[docs](https://docs.python.org/3/glossary.html#term-file-object)]

Date: 21 年 6 月

---

### HTTP Requests

`pip install requests`

[Hypertext Transfer Protocol (HTTP)](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol#Request_methods) is a request-response protocol commonly used for sending data through web browsers.

**GET**

The GET request is for retrieving data without altering its state.

```python
url: str
response: requests.Response = requests.get(url)
```

**POST**

POST

The two simplest kinds of

---

### Command Line Applications - Argparse

### Functools

Python's [functools](https://docs.python.org/3/library/functools.html#module-functools) module is used for higher-order functions and operations on callable objects. It's a part of the standard library

Date: 21 年 8 月

---

### Sort() and sorted()

```python
import dataclasses

@dataclasses.dataclass
class Student:
    name: str
    grade: str
    age: int

    def __repr__(self):
        return repr((self.name, self.grade, self.age))

students = [Student('John', 'A', 15),
            Student('Jane', 'B', 12),
            Student('Dave', 'B', 10),]
```

Q: Sort the students by age in ascending order.

```python
sorted(students, key = lambda student: student.age)
```

Q: Sort the students by age in descending order.

```python
sorted(students, key = lambda student: student.age, reverse=True)
```

Q: What is sorting stability? → **Stable** sorting algorithms maintain the relative order of records with equal keys, sorting repeated elements in the same order that they appear in the input.

Cloze:

- Python sorts are guaranteed to be stable.
- Because of this, when multiple records have the same key, their original order is preserved.

Q: Sort the students by descending grade and then ascending age.

```python
students = sorted(students, key=lambda s: s.age)
students = sorted(students, key=lambda s: s.grade, reverse=True)
```

---

### Binary and other bases

Q: Return a binary representation of the given number.

```python
def int2binary(i: int) -> str:
    ...
```

→

```python
def int2binary(i: int) -> str:
    return bin(i)

>>> int2binary(3)
'0b11'
```

Q: A binary representation string has "0b" at the front. If you have an integer, `i`, and want its binary representation without the "0b", how can you return that efficiently?

```python
i: int
>>> f"{i:b}"
>>> format(i, "b")  # equivalent
```

See https://www.programiz.com/python-programming/methods/built-in/format

Q:

```python
def add_binary(a: str, b: str):
    ...
```

Given two binary strings, `a` and `b`, return their sum as a binary string. As binary strings, `a` and `b` consist only of "0" and "1" characters.

```python
def add_binary(a: str, b: str) -> str:
    a: int = int(a, base=2)
    b: int = int(b, base=2)
    return f"{a + b:b}"
    # return format(a + b, "b") # equivalent
```

---

Q: Return the index of the first occurence of 'needle' in 'haystack', or return -1 if 'needle' is not part of 'haystack'. Return 0 if 'needle' is an empty string.

```python
def find_needle(haystack: str, needle: str) -> int:
    ...
```

```python
def find_needle(haystack: str, needle: str) -> int:
    if needle == "":
        return 0
    str_len: int = len(needle)
    for i in range(len(haystack) - str_len + 1):
        if haystack[i:i + str_len] == needle:
            return i
    return -1
```

Q: How do you combine an iterable of strings into one string in Python? A: Use `s.join(txt)`, where `s` is a string that specifies how to join and `txt` is the iterable of strings.

Q: Return the strings combined into one.

```python
text = ['Stay', 'gold,', 'Ponyboy.']
```

```python
>>> " ".join(text)
'Stay gold, Ponyboy.'
```

Q: Implement a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.

```python
def longest_common_prefix(strs: List[str]) -> str:
    ...
```

A:

```python
def longest_common_prefix(strs: List[str]) -> str:
    member: str = strs[0]
    common_prefix: List[str] = []
    max_idx: int = min([len(s) for s in strs])
    for i, char in enumerate(member):
        if i == max_idx:
            break
        if all([char == s[i] for s in strs]):
            common_prefix.append(char)
        else:
            break
    if len(common_prefix) == 0:
        return ""
    else:
        return "".join(common_prefix)
```

Q: Implement a function that reverses an array of strings in-place without creating another array.

```python
def reverse(strs: List[str]) -> None:
    ...
```

A:

```python
def reverse(strs: List[str]) -> None:
    stop_idx = len(strs) // 2
    for i, s in enumerate(strs):
        if i == stop_idx:
            break
        back_s = strs[-(i + 1)]
        strs[i] = back_s
        strs[-(i + 1)] = s
```

#### Display number in scientific notation.

```python
def num_in_scientific_notation(num: float) -> str:
    return "{:e}".format(num)
```

---

## Writing Tests with `pytest`

### Fixtures

```python
import pytest

@pytest.fixture
def foo_obj() -> SomeType:
  foo_val: SomeType
  // ...
  return foo_val
```

Other tests can access this fixture by specifying it as a required argument.

```python
def test_a(foo_obj):
  ... // test logic here

def test_b(foo_obj):
  ... // test logic here
```

### Choosing which tests to run in a suite with `-k`

When working with pytest, you often want to run a specific subset of your tests.
One of the ways to filter and select which tests to run is by using the `-k` option
followed by an expression.

The `-k` option allows you to run tests by their names. It matches the test names
and any substring of names based on the expression you provide.

Examples:

Run all tests containing the substring "arg"

```python
pytest -k arg
```

NOT: Run all tests that do NOT contain "arg"

```python
pytest -k "not arg"
```

AND: Run all tests that contain "A" and "B"

```python
pytest -k "A and B"
```

OR: Run all tests that contain either "A" or "B" (inclusive or)

```python
pytest -k "A or B"
```

### Else: Testing

**Disabling warnings**

To ignore pytest warnings at the command line: `pytest -p no:warnings`

See: https://docs.pytest.org/en/latest/how-to/capture-warnings.html#disabling-warnings-summary

#### Pytest Mock

The standard solution to creating mock objects in python is the [`unittest.mock` library](https://docs.python.org/3/library/unittest.mock.html). This section goes over how to create mocks in pytest with [pytest-mock](https://github.com/pytest-dev/pytest-mock)

---

## Working with Databases

### MongoDB (pymongo)

Pymongo assumes MongoDB is installed and running on the default host and port. If this is not the case, go to: https://docs.mongodb.com/manual/installation/ .

You'll notice there are two installation types to choose from: community and enterprise edition. According to [a thread on the mongodb forums](https://www.mongodb.com/community/forums/t/difference-between-enterprise-and-community-server-and-will-they-conflict-if-both-are-installed/76695),

> "Core server features for developers are generally the same, but a MongoDB
> Enterprise subscription includes additional operational and management
> features, a commercial license (warranty & idemnification), as well as access
> to proactice support and on-demand training.

In my case, I only needed the community edition.

There are two main steps for this installation.

1. Install MondoDB Server: [[installation instructions
   (Windows)](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)]
2. Install MongoDB Shell (mongosh): [[installation
   instructions](https://docs.mongodb.com/mongodb-shell/install/)]

The installation instructions for Community Edition are toward the bottom of the page (at the above link) where it says "Procedure". You're finished with step 1 when you can start MongoDB with\
`"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath="c:\data\db"`

1. Connect to a MongoDB deployment using the mongosh [\[docs\]](https://docs.mongodb.com/mongodb-shell/connect/#std-label-mdb-shell-connect).

[Continue from here](https://docs.mongodb.com/mongodb-shell/connect/#std-label-mdb-shell-connect)

At this point you should be able to type `mongosh` at the prompt and see the
MongoDB Shell run. However, the commands `mongo`, `mongod`, and `mongos` won't
run on Windows. To enable these commands, you need to add shortcuts to each
command's corresponding executable to the system's environment variables.

1. Hit the Windows key, then type environment variables and hit enter.
   Alternatively, open the Control Panel and select "Edit the system environment
   variables".
2. Under the "Advanced" tab, select `Environment Variables`.
3. Under "System Variables", select `New`.
4. Add each command's name to one field its executable path to the other field.
   For me, `mongo`'s executable was at

   ```
   "C:\Program Files\MongoDB\Server\5.0\bin\mongo.exe"
   ```

   The other two executables were in the same directory.

Now, `mongo` and `mongod` work, but what do they do?

`mongo`: Opens the Mongo Shell, an interactive command line interface that uses
JavaScript and a related API to interact with the MongoDB client. Mongo shell is
the default client for the MongoDB database server.

- Used for data manipulation
- Used for management of database instances

`mongod`: Manages all of the MongoDB server tasks. `mongod` is a background
process used by MongoDB. It's short for "Mongo Daemon".

**References MongoDB:**

- Jayatilake, Navindu. 2019. How to get started with MongoDB in 10 minutes. [[article](https://www.freecodecamp.org/news/learn-mongodb-a4ce205e7739/)]
- [Pymongo tutorial](https://pymongo.readthedocs.io/en/stable/tutorial.html)

---

## Else

### Publishing Packages on PyPi

References:

- https://packaging.python.org/en/latest/tutorials/packaging-projects/
- Publishing (Perfect) Python Packages on PyPi. 2020. https://youtu.be/GIF3LaRqgXo

Suppose you're in the root directory of a GitHub repository.

Create a Python package as a subdirectory of `src` in the repo's root. We'll call this `pkg` (repo/src/pkg).

Create a blank module called "setup.py" (repo/setup.py), then open it up in your favorite text editor.

```python
import setuptools

setuptools.setup(
    name="pkg-pypi-name", # The name on PyPi. What you pip install.
    version="0.0.1",
    description=("A Python package description"),
    package_dir={'': 'src'},
)
```

Think of each line of the `setup()` method as configuration for the package.

Arguments of `setuptools.setup`:

- `name`: The name on PyPi. This is the "x" in "pip install x".
- `version`: Version number for the package. 0.0.x version numbers imply that the package is unstable. It's good to start out with an unstable version number before publishing the package so that the people won't see failing code flags just because there's some packaging issue.
- `package_dir`: A map (dictionary) that tells setuptools the name of the package's parent directory.

python3 -m pip install --upgrade build

Now, run `python setup.py bdist_wheel`. This will create `build`, `build/lib`, and `dist` directories inside the repository.

- `dist`: Houses the outputted wheel file.
- Running the `bdist_wheel` also creates a `src/pkg.egg-info` directory. You should git ignore this.

Testing the local package install.

```bash
pip install -e .
```

Check out gitignore.io for standard ignores for common frameworks.

Try running:

```
python -m twine upload --repository testpypi dist/* --verbose
```

If the command fails, you'll need to make source code or configuration changes and re-run `python -m build` in the same directory as your `pyproject.toml`. Then, you can keep checking the "twine" command.

After this command runs successfully, you should be able to view your published packaged on test.pypi.org and install it locally with

```bash
python -m pip install --index-url https://test.pypi.org/simple/ --no-deps your-package-name
```

To uninstall this local installation, run

```bash
python -m pip uninstall your-package-name
```

---

## Protocol Buffers

Terms to know: .proto file, protocol buffer compiler, protcol buffer API, messages of a protocol buffer API

Protocol buffers are the flexible, efficient, automated solution to solve the problem of how to serialize and retrieve structured data between programming interfaces, e.g. C++ and Python.

#### How does a protocol buffer solve this problem?

A **protocol buffer compiler** creates a class that implements automatic encoding and parsing of the protocol buffer data with an efficient binary format. The generated class provides attributes and fields for the objects that make up a protocol buffer, abstracting away the complexity of reading and writing the protocol buffer as a unit.

- The protocol buffer format supports future development efforts by making it easy to extend the format over time in such that the code can still read data encoded with an old format.

#### Protocol Format

References:

- Google. Protocol Buffer Basics: Python [[docs](https://developers.google.com/protocol-buffers/docs/pythontutorial)]

---

## Miscellaneous

**Google Code Styling with YAPF**

Install YAPF via pip: `pip install yapf`

To see usage instructions: `yapf --help`

The main command you'll use is `yapf -i [python-file]`

**Writing to Excel Files with XlsxWriter**

Installation

- Conda install
  `conda install -c conda-forge XlsxWriter`
- Pip install
  `pip install XlsxWriter`

```python
# hello-xlsx-writer.py
import xlsxwriter

workbook = xlsxwriter.Workbook('hello.xlsx')
worksheet = workbook.add_worksheet()

worksheet.write('A1', 'Hello world')

workbook.close()
```

References:

- https://xlsxwriter.readthedocs.io/
- https://xlsxwriter.readthedocs.io/tutorial02.html
- https://stackoverflow.com/questions/16560289/using-python-write-an-excel-file-with-columns-copied-from-another-excel-file

**ML Finance Project**

[**example w/ multivariate time series in PyTorch**](https://stackabuse.com/time-series-prediction-using-lstm-with-pytorch-in-python/)

Q: Neural networks can be constructed using the `torch.nn` Python module.

Q: Import the package for constructing neural networks in PyTorch.

```python
import torch.nn as nn
```

Q: Seaborn comes with built-in datasets.

Q: Load seaborn’s flights dataset.

```python
flight_data = sns.load_dataset("flights")
```

Q: Why must time series data be scaled for sequence predictions? : When a network is fit on unscaled data, it is possible for large inputs to slow down the learning and convergence of your network and in some cases prevent the network from effectively learning your problem.

Q: What's the sklearn import for min-max scaling data?

```python
from sklearn import preprocessing
scaler = preprocessing.MinMaxScaler()
```

We know the field is fast moving. If the reader looking for more recent free reading resources, there are some good introductory/tutorial/survey papers on Arxiv
