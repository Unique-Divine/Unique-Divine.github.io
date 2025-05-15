---
title: 'Coding in Go'
author: Unique Divine
image: '/coding-1.png'
excerpt: ''
publishDate: 2024-06-08
---

Notably, this is not the most comprehensive section of my [Coding
Commonplace](../code). That's odd because I've used Go more than any other
language in my professional programming career. Well over a million lines of code
at this point.

What I've not done is write much about it. This page should start to change that.

---

#### Table of Contents

- [Init](#init)
  - [1. Installation](#1-installation)
  - [Go Basics for Anki](#go-basics-for-anki)
  - [Structures](#structures)
- [Debugging](#debugging)
- [Testing](#testing)

## Init

### 1. Installation

#### Installation with sudo: not recommended

**Edit (2025): DO NOT install Go like this.** Instead, download a tar of Go as a
binary and add it to your system `$PATH`.

To install go version 1.13 on linux:

```bash
sudo apt-get upgrade
sudo apt-get update
sudo apt-get install golang-go
```

After resetting the terminal window, run `go version` to verify that this worked properly.

To uninstall golang with sudo, use

```sh
sudo apt-get remove golang-go
sudo apt-get remove --auto-remove golang-go
```

Q: When might you want to uninstall golang on Ubuntu?
A: If you find that `go version` and `sudo go version` are returning different results, you most likely have installed using `sudo apt-get` and it's causing problems.

#### Installation

Ref: https://sal.as/post/install-golan-on-wsl/

### Go Basics for Anki

Write a hello world golang program:

```go
// hello.go
package main

import "fmt"

func main() {
  fmt.Println("Hello, 世界")
}
```

There's a similar function to `fmt.Println` called `println`. Why use `fmt`?

In the "Bootstrapping" section of the [spec](), it says that "Current implementations provide several built-in functions useful during bootstrapping. These functions are documented for completeness but are not guaranteed to stay in the language. They do not return a result."
"Thus, [functions like `println` that are built into the language] are useful to developers because they lack dependencies (being built into the compiler) but not in production code. It also important to note that print and println report to `stderr`, not `stdout`." - Alexander on StackOverflow

Q: Run a golang code file named `hello.go` without building.
Use `go run hello.go` at the command prompt.

Q: Run a golang code file, `hello.go`, saving the compiled result for later use.
Use `go build hello.go`.

Q: After compiling with `go build hello.go`, run the file by...
executing the binary file with `./hello` at the prompt

Q: Import the packages for dealing with the operating system and and printing formatted output.

```go
import (
  "fmt"
  "os"
)
```

All of your projects live in the same place, your workspace. By default, this is a folder called "go" in your user directory. You can check this location by running `go env GOPATH`.

Functions start with the `func` keyword.

Write a function that sums two integers.

```go
func sum(x: int, y: int) int {
  return x + y
}
```

Initialize a variable `powerLevel` to 5 with explicit typing.

```go
var powerLevel int = 5
```

Initialize a variable `powerLevel` to 5 with implicit typing.

```go
powerLevel := 5
```

Write conditional logic that prints "oof" if `x` is greater than 0.

```go
if x > 0 {
  fmt.Println("oof")
}
```

Write conditional logic that prints "whale" if `x` is greater than 10, "minnow" if `x` is less than 1, and "shark" otherwise.

```go
if x > 10 {
  fmt.Println("whale")
} else if x < 1 {
  fmt.Println("minnow")
} else {
  fmt.Println("shark")
}
```

Create and an array, "point", that holds 2 ints.

```go
var point [2]int
```

Create a slice of ints called "arr".

```go
var arr []int
```

What will this function return?

```go
func foo() {
  var arr []int
  return arr
}
```

A: An empty slice, `[]`.

Write the type definition for a dictionary that maps strings to integers.
`map[string]int`

Write the type definition for a dictionary that maps `wallet` (`Wallet`) to `balance` (int).
`map[Wallet]int`

Declare a dictionary variable, `strIntMap`, that maps strings to integers.

```go
var strIntMap map[string]int
```

Def: To **Declare** a variable is to introduce the variable to the program by defining its type and name.

**Assigning to a variable** means providing the variable with a value.

To **initialize** a variable is to assign the variable with an intitial value.

**Instantiate** means to "create an instance of".

Will the following code run?

```go
func main() {
  var facts map[int]string
  facts[0] = "False"
  facts[1] = "True"
  fmt.Println(facts)
}
```

A: No, you'll get `panic: assignment to entry in nil map` because that's not how to initialize a map in go. You must use `make`: `make(map[int]string)`.

Initialize a dictionary, `goku`, that maps "powerLevel" to 9001.

```go
var goku = make(map[string]int)
goku["powerLevel"] = 9001
```

Q: What's another way to write this that will work?

```go
var facts = make(map[int]string)
```

A:

```go
facts := make(map[int]string)
```

How do you delete the "age" key-value pair?

```go
var goku = make(map[string]int)
goku["powerLevel"] = 9001
goku["age"] = 40
```

A: `delete(goku, "age")`

Cl: The `delete` method operates on `map`s.

Q: Print the values 0 through 4 going incrementing by 1.

```go
func main() {
  for i := 0; i < 4; i++ {
    fmt.Println(i)
  }
}
```

Q: Initalize a slice, `letters`, containing the letters "a", "b", "c"

```go
arr := []string{"a", "b", "c"}
// var arr = []string{"a", "b", "c"}
```

Q: Given that `arr := []string{"a", "b", "c"}`, iterate through the slice printing the indices and values.

```go
for index, value := range arr {
  fmt.Println(index, value)
}
```

Given that

```go
goku := make(map[string]int)
goku["powerLevel"] = 9001
goku["age"] = 40
```

Iterate through the dictionary printing the keys and values.

```go
for key, value := range goku {
  fmt.Println(key, value)
}
```

Q: What method allows you to take the square root of a number?
A: `math.Sqrt`

Q: Create a "person" struct with name (string) and age (int) fields.

```go
type person struct {
  name string
  age int
}
```

Given the "person" struct, initialize Naruto at age 22.

```go
type person struct {
  name string
  age int
}
```

```go
naruto := person{name: "Naruto", age: 22}
fmt.Println(naruto)
```

Q: If I give you a variable `x := 7`, how do you find its memory address?
A: `&x`

### Structures

<!-- Anki placeholder -->

Q: GO is not an object-oriented language like C++ or Java.

Q: Define a `Saiyan` structure with a name (string) and power (int).

A:

```go
type Saiyan struct {
    name string
    power int
}
```

Q: Initialize a `Saiyan`, "Goku", with a power of 9001.

```go
type Saiyan struct {
    name string
    power int
}
```

A:

```go
goku := Saiyan{
    name: "Goku",
    power: 9001,
}
```

Q:

```go
type Saiyan struct {
    name string
    power int
}
```

Is it valid to write the following?

```go
goku := Saiyan{}
// or
goku := Saiyan{name: "Goku"}
```

A: Yes, structures can have unassigned fields just like variables can have unassigned values.

Cl: Structures can have unassigned fields just like variables can have unassigned values.

Cl: Go passes arguments to a function as copies.

Q: What does the following print?

```go
package main

import "fmt"

type Saiyan struct {
  name  string
  power int
}

func main() {
  goku := Saiyan{"Goku", 9000}
  Super(goku)
  fmt.Println(goku.power)
}

func Super(s Saiyan) {
  s.power *= 2
}
```

A: Still 9000 because only the copy of `goku` became super, not the original variable. Changes made in `Super` weren't reflected in the caller.

Q:

```go
type Saiyan struct {
  name  string
  power int
}

func main() {
  goku := Saiyan{"Goku", 9000}
  Super(goku)
  fmt.Println(goku.power)
}

func Super(s Saiyan) {
  s.power *= 2
}
```

Q: If you have an interface, `Spec`, and want to verify that the type, `MyType`, implements `spec`, how can you check this at compile time?

```go
var _ Spec = (*MyType)(nil)
```

This will error at compile time:

```
prog.go:23: cannot use (*MyType)(nil) (type *MyType) as type Spec in assignment:
    *MyType does not implement Spec (missing Method method)
 [process exited with non-zero status]
```

Q: `*MyType` means pointer to `MyType`.

## golangci-lint

The standard linter is `golangci-lint`. You can install it with `go get`, however
in my experience,
the runs tend to be inconsistent across different machines with this pattern.
Likely due to caching.

I recommend using the docker container instead.

```bash
docker run --rm -v $(pwd):/app -v ~/.cache/golangci-lint/v1.64.8:/root/.cache -w /app golangci/golangci-lint:v1.64.8 golangci-lint run -v --fix 2>&1
```

To clean the cache inside the container, invoke `golangci-lint cache clean` inside the container, wiping everything in `/root/.cache`:

```bash
docker run --rm \
  -v ~/.cache/golangci-lint/v1.64.8:/root/.cache \
  golangci/golangci-lint:v1.64.8 \
  golangci-lint cache clean
```

## Golang: for loop can be modernized using range over int

For loops can range over integers [as of Go 1.22](https://tip.golang.org/doc/go1.22)

```go
// Normal way
for i := 0; i < 42069; i++ {
  // ...
}

// Range over int
for i := range 42069 {}

// And if you're not using i, go even simpler
for range 42069 {}
```

## Bytes in Go

## Debugging

```shell
go mod tidy
```

Opens permissions for the go directories that were unable to see the staandard library dependencies.

```shell
chown -R realu:realu $GOPATH
```

```shell
go clean -modcache
```

## Testing

#### Testify assert vs. require

In the [stretch/testify](github.com/stretchr/testify) package, the two packages "assert" and "require" can both be used to give a flavor of assert statements.

```go
import (
  "github.com/stretchr/testify/assert"
  "github.com/stretchr/testify/require"
)
```

Q: When is it better to use require versus assert?

It depends on the behavior you need. You get a log entry for each assertion with `assert`. However with `require`, the first failed requirement interrups and fails the complete test. This means that any requirements after the first failed one won't be evaluated; they'll be skipped.

Q: Test all go files visible from the current path.

```sh
go test ./...
```

To test with code coverage:

```sh
go test ./... -cover
```

Q: What does the `-race` flag do?

This enables the race detector when running tests. The race detector monitors
memory access at runtime to check for race conditions where goroutines access the
same variable concurrently, and at least one of them accesses a write operation.

When a race condition is detected, the output looks like:

```
==================
WARNING: DATA RACE
Read at 0x00c0000a0f70 by goroutine 7:
  main.main.func1()
      /path/to/main.go:14 +0x64

Previous write at 0x00c0000a0f70 by main goroutine:
  main.main()
      /path/to/main.go:16 +0x84

Goroutine 7 (running) created at:
  main.main()
      /path/to/main.go:13 +0x5c
==================
```
