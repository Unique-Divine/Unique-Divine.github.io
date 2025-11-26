<template>
  <div class="site-wrapper">
    <!-- <site-header :blog="blog" :header="blog.header"> -->
    <site-header :blog="blog" :header="{}">
      <site-navigation slot="header"></site-navigation>
    </site-header>

    <!-- TODO: try populating tags or categories as buttons -->
    <!-- <main id="site-main" class="site-main outer"> -->
    <!--   <pre> -->
    <!--     {{ -->
    <!--       `ERROR: \n -->
    <!--     ${JSON.stringify( -->
    <!--         { -->
    <!--           type, -->
    <!--           // blog, -->
    <!--           stateKeys: Object.keys(state), -->
    <!--           blog, -->
    <!--           posts, -->
    <!--           route, -->
    <!--           footer, -->
    <!--           loading, -->
    <!--           author, -->
    <!--           sidebarOpen, -->
    <!--           header, -->
    <!--         }, -->
    <!--         null, -->
    <!--         2, -->
    <!--       )}` -->
    <!--     }} -->
    <!--   </pre> -->

    <div class="inner">
      <error description="Page not found" code="404" :link="blog.base" />
    </div>
    </main>

    <aside class="outer" v-if="true">
      <div class="inner">
        <div class="post-feed">
          <card v-for="(post, index) in posts" :post="post" :key="index" :large="!index % 6" :blog="blog" />
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex"

import Card from "./partials/Card"
import SiteHeader from "./partials/Header"
import Error from "./partials/Error"
import SiteNavigation from "./partials/Navigation"

import { defaultState } from "./store/types"

export default {
  data() {
    return {
      // state: {},
      header: defaultState.header,
      sidebarOpen: false,
    }
  },
  components: { SiteHeader, SiteNavigation, Card, Error },
  methods: {
    ...mapActions(["updateSite", "updatePage", "updateParams"]),
    updateLayoutClass() {
      this.$el.parentNode.className = `error-template`
    },
  },
  computed: {
    ...mapGetters(["type", "blog", "posts"]),
  },
  watch: {
    $page() {
      this.updatePage(this.$page)
      this.updateLayoutClass()
    },
    $route() {
      this.updateParams(this.$route.params)
    },
  },
  mounted() {
    this.updatePage(this.$page)
    this.updateSite(this.$site)
    this.updateParams(this.$route.params)
    this.updateLayoutClass()
    // const state = this.$store.state
    // console.debug("DEBUG: NotFound.vue.$store.state %o", state)
    // this.state = state
  },
}
</script>

<style>
@import "./styles/global.css";
@import "./styles/screen.css";
</style>
