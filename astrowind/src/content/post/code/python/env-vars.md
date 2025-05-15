---
publishDate: 2023-08-12T00:00:00Z
author: Unique Divine
title: Environment Variables in Python
excerpt: "Python code reference and cookbook."
image: "/coding-3.png"
category: Coding
tags:
  - coding
  - python
# metadata:
#   canonical: https://astrowind.vercel.app/get-started-website-with-astro-tailwind-css
---

Q: Difference between `os.getenv` and `os.environ`

#### When the environment variable has been set, there is no difference.

```bash
$ python -m timeit -s 'import os' 'os.environ.get("ENV_VAR_FOO")'
200000 loops, best of 5: 1.65 usec per loop

$ python -m timeit -s 'import os' 'os.getenv("ENV_VAR_FOO")'
200000 loops, best of 5: 1.83 usec per loop
```

`os.environ` is of the built-in type `_Environ`, which is a `MutableMapping`.

```python
from _collections_abc import MutableMapping
class _Environ(MutableMapping):
  ...
```

In other words, `os.environ` is a dictionary. Its keys-value pairs are formed by your environment variables.

```python
import dotenv # poetry add python-dotenv

dotenv.load_dotenv()
```
