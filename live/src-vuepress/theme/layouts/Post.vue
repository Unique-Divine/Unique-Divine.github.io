<template>
  <!--

 ## On current

 In the Post.vue component, the symbol `current` is specific to this component 
 and the Vuex store. It is not a built-in symbol or specific to Vue itself.

 The `current` symbol is a reference to a computed property in the Vuex store. 
 It is maped to the state using the `mapGetters` helper with: 
 `mapGetter(["current"])`.

-->
  <main id="site-main" class="site-main outer">
    <div class="inner">
      <article class="post-full post" :class="{ 'no-image': !current.image }">
        <header class="post-full-header">
          <section class="post-full-tags" v-if="primaryTag">
            <a :href="$withBase(`/tags/${primaryTag}`)">{{ primaryTag }}</a>
          </section>
          <h1 class="post-full-title">{{ current.title }}</h1>
          <p class="post-full-custom-excerpt" v-if="current.excerpt">
            {{ striptags(current.excerpt) }}
          </p>

          <div class="post-full-byline">
            <section class="post-full-byline-content">
              <ul class="author-list" v-if="current.author.name">
                <li class="author-list-item">
                  <div class="author-name-tooltip">
                    {{ current.author.name }}
                  </div>
                  <a class="static-avatar" :href="current.author.link">
                    <img
                      class="author-profile-image"
                      :src="authorImage(current.author.gravatar)"
                      :alt="current.author.name"
                    />
                  </a>
                </li>
              </ul>
              <section class="post-full-byline-meta">
                <h4 v-if="current.author.name">
                  <a :href="current.author.link">{{ current.author.name }}</a>
                </h4>
                <div class="byline-meta-content">
                  <time v-if="datetime" class="byline-meta-date" :datetime="datetime">{{
                    localeDate
                  }}</time>
                  <span v-if="current.readingTime" class="byline-reading-time"
                    ><span class="bull">&bull;</span> {{ current.readingTime }}</span
                  >
                </div>
              </section>
            </section>
          </div>
        </header>

        <figure v-if="current.image" class="post-full-image">
          <img
            sizes="(max-width: 800px) 400px, (max-width: 1170px) 1170px, 2000px"
            :src="$withBase(current.image)"
            :alt="current.title"
          />
        </figure>

        <section class="post-full-content">
          <Content class="post-content" />
        </section>
      </article>
    </div>
  </main>
</template>

<script>
import striptags from "striptags"
import { mapGetters } from "vuex"
import { head, kebabCase } from "lodash"
import { authorImage } from "../store/utils"

export default {
  computed: {
    ...mapGetters(["current"]),

    datetime() {
      return this.current.publish && new Date(this.current.publish).toISOString()
    },

    localeDate() {
      return this.current.publish && new Date(this.current.publish).toLocaleDateString()
    },

    primaryTag() {
      if (!this.current.tags || this.current.tags.length === 0) {
        return null
      }

      return head(this.current.tags)
    },

    backgroundImage() {
      return {
        "background-image": `url(${this.$withBase(this.current.image)})`,
      }
    },
  },
  methods: {
    kebabCase,
    striptags,
    authorImage,
  },
}
</script>
