---
publishDate: 2023-08-12T00:00:00Z
author: Unique Divine
title: 'Pyenv and Poetry: Setting Up a Professional Python Development Environment'
excerpt: ''
image: '/coding-4.png'
category: Coding
tags:
  - coding
  - python
---

### Pyenv for managing multiple Python interpreters

The [pyenv repo](https://github.com/pyenv/pyenv) contains usage and installation instructions. If you're on MacOS or a common Linux distro, you can install `pyenv` with brew.

```bash
brew install pyenv
```

You'll then need to add the following snippet to your shell config, e.g. your `.bash_profile`, `.bashrc`, or `.zshrc`.

```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv init --path)"
```

After using `source` on your config or restarting the shell, you should have the `pyenv` root command.

The command use to install any version of python is `pyenv install`. Display additional info for this command with `pyenv install --help`.

```bash
pyenv install 3.9.13 # example
```

Once you have a version installed, you can print out the versions on your machine with:

```bash
pyenv versions
```

```bash
# example output
  system
* 3.9.13 (set by /home/realu/.python-version)
  3.10.4
```

In this example, I have 2 different interpreters installed on my machine. The one with the `*` is currently set as my **global interpreter**. This is set manually using the `pyenv global` command.

```bash
pyenv global 3.10.4   # switches the global interpreter to 3.10.4
```

You can verify this works as expected using `python --version`. You may be familiar with using `python3` as the command instead of `python`. With `pyenv`, this is not necessary.

Reference: [malexer/cheatsheets/pyenv.md](https://github.com/malexer/cheatsheets/blob/master/pyenv.md)

### Poetry for dependency management and publishing packages

Reference: [Poetry docs](https://python-poetry.org/docs/)

Poetry can be installed with both `curl` and `pip`. I recommended using `curl` so that it will be global to your machine.

NOTE I highly, highly, highly recommend that you DO NOT use `brew` to install `poetry`. If you use `brew`, it's going to install directly to your system, which prevents you from being able to leverage `pyenv` to seamlessly switch between Python interpreters.

```bash
# installation with pip: recommended option in tandem with pyenv
pip install poetry
```

```bash
# For UNIX systems - installation with curl
curl -sSL https://install.python-poetry.org/ | python -
```

After this installation command, add the `poetry` binary to the path in your shell config.

```bash
export PATH=$PATH:$HOME/.poetry/bin
```

### Using poetry

To create a project from scratch, call `poetry new [pkg-name]`

To create a project from a pre-existing codebase, `cd` to the root where the package is located (the parent repo or directory to the package) and call:

```bash
poetry init
```

Both of these commands will prompt you to interactively create a `pyproject.toml`.

After confirming the generation of the project, you can find all of the options you specified inside the `pyproject.toml`. You can now install the packages.

```bash
poetry install
```

This will resolve dependencies between each of the project's packages and install them into a virtual environment.
