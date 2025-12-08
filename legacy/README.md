---
title: "Unique Divine"
# NOTE Setting "canonicalUrl" here in the README changes the output of index.html.
canonicalUrl: https://uniquedivine.blog
---

# LEGACY (DEPRECATED) - ud-site-gen

Source code for https://uniquedivine.blog

## Static Assets

Static assets used in cover images must be in the `.vuepress/public` directory.
By convention, static assets are kept in `.vuepress/public/stat` for clarity.

Static assets used in articles should be somewhere easy to access with relative
paths. By convention, most in-article static assets are kept in `[repo]/stat`.

## Post Front Matter

```yaml
title: "TITLE HERE"
image: "/path/to/image-from/public-dir.png"
publish: 2022-10-02
type: post
tags:
  - "For Devs"
  - newsletter
categories:
  - commonplace
readingTime: 4 Min read
```

### type

The `type` field can be set to the follwoing options.

- 'home': The landing page template.
- 'post': A blog post (article).
- 'page': A stand-alone page based on markdown.
- 'posts' A collection of articles.
  - 'tags': collection of articles based on tag
  - 'category': collection of articles based on category

These are specified by the `computed.content` field inside of the theme's `Layout.vue`.

## Contribution guidelines

You can contribute to improve this documentation by opening a
[GitHub](https://github.com/Unique-Divine/Unique-Divine.github.io) issue or pull request.

## State Management

The vuepress theme uses `vuex` for state management. Inspired by Flux and
Redux, Vuex is state management library for Vue applications that provides a
centralized state management solution.

The main concepts in Vuex are:

1. **State**: State in Vuex is the single source of truth for all shared data
   within a Vue.js application. This means that any component within your
   application can access or mutate the state.

2. **Getters**: Getters are similar to computed properties in Vue. They are
   used to compute derived state based on the store state. They can help to
   reduce code duplication, as you can use a getter once and reference it in
   multiple places.

3. **Mutations**: Mutations are synchronous transactions that are the only way
   to change state in a Vuex store. Each mutation has a string type and a
   handler. The handler function is where you perform actual state
   modifications, and it will receive the state as the first argument.

4. **Actions**: Actions are similar to mutations, with the difference being
   that actions can contain asynchronous operations. Actions commit mutations
   and can contain arbitrary asynchronous operations.

5. **Modules**: Vuex allows us to divide our store into modules. Each module
   can contain its own state, mutations, actions, and even nested modules. This
   helps to keep the store organized as your application grows in complexity.

6. **Plugins**: Vuex supports plugins which allows developers to extend its
   functionality. They can be used for logging, persistence, handling async
   processes, etc.

Vuex is used to handle shared state among component. Not all state needs to be
placed in Vuex. If a state is only relevant for a single component, it might be
better to keep it local to that component.

It's important to note that Vuex, like Redux in the React ecosystem, adopts a
unidirectional data flow. This means that data in the application follows the
same lifecycle pattern, making the logic of state changes more predictable and
understandable.
