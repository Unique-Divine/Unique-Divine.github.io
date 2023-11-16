<template>
  <nav class="site-nav" style="overflow: visible">
    <div class="site-nav-left-wrapper" style="height: 100%">
      <div class="site-nav-left">
        <span @click="toggleMenu" class="nav__burger-icon" ref="toggleBtn">
          <SvgBurger class="nav__burger-icon" />
        </span>

        <router-link v-if="!isHome && blog.logo" class="site-nav-logo" to="/">
          <img :src="$withBase(blog.logo)" :alt="blog.title" />
        </router-link>
        <router-link v-if="!isHome && !blog.logo" class="site-nav-logo" to="/">
          {{ blog.title }}
        </router-link>

        <!-- Dropdown Menu -->
        <NavDropdown :items="nav" :visible="menuOpen" v-if="menuOpen" ref="navDropdown" />

        <!-- ORIGINAL -->
        <!-- ORIGINAL -->
        <!-- <div class="site-nav-content"> -->
        <!--   <ul class="nav" v-if="nav" role="menu"> -->
        <!--     <li v-for="(item, index) in nav" role="menuitem" :key="index"> -->
        <!--       <a v-if="hasHttps(item.link)" :class="{ active: item.active }" :href="item.link">{{ item.text }}</a> -->
        <!--       <router-link v-else :class="{ active: item.active }" :to="item.link">{{ -->
        <!--         item.text -->
        <!--       }}</router-link> -->
        <!--     </li> -->
        <!--   </ul> -->
        <!-- </div> -->

        <!-- End Dropdown Menu <div class="site-nav-content"> -->
      </div>
    </div>
    <div class="site-nav-right">
      <SearchBox v-if="blog.search" id="nav__search-box" />
      <div class="social-links">
        <social-link v-for="(channel, index) in social" :url="channel.url" :type="channel.type" :key="index" />
      </div>
    </div>
  </nav>
</template>

<script>
import { mapGetters } from "vuex"

import SocialLink from "./SocialLink"
import SearchBox from "@SearchBox"
import NavDropdown from "./NavDropdown"
import SvgBurger from "./SvgBurger"

export default {
  components: { SocialLink, SearchBox, NavDropdown, SvgBurger },
  /*
   */
  data() {
    return {
      menuOpen: false,
    }
  },
  computed: {
    ...mapGetters(["blog", "type", "social", "nav"]),
    isHome() {
      return this.type === "home"
    },
  },
  methods: {
    hasHttps(link) {
      return link.includes("https") ? true : false
    },
    toggleMenu() {
      /*
       */
      this.menuOpen = !this.menuOpen
      console.log("toggleMenu clicked: %o", { menuOpen: this.menuOpen })
    },
    handleOutsideClick(event) {
      const navDropdown = this.$refs.navDropdown.$el
      const toggleBtn = this.$refs.toggleBtn

      if (
        navDropdown &&
        !navDropdown.contains(event.target) &&
        !toggleBtn.contains(event.target)
      ) {
        this.menuOpen = false
      }
    },
  },
  mounted() {
    document.addEventListener("click", this.handleOutsideClick)
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleOutsideClick)
  },
}
</script>

<style>
@import "../styles/global.css";

.nav__burger-icon {
  cursor: pointer;
  display: flex;
  justify-content: center;
}

.search-box {
  --ext-max-w: 25vw;
  /* max-width: calc(16px + var(--ext-max-w)); */
  max-width: min(calc(16px + var(--ext-max-w)), 200px);
  padding-right: 16px;
}

.search-box input {
  width: min(var(--ext-max-w), 200px);
  max-width: min(var(--ext-max-w), 200px);
}

@media (prefers-color-scheme: dark) {
  .search-box input {
    background-color: var(--blue-g-base-dark);
    border: 1px solid var(--dark-sub-3);
  }

  .search-box input:hover {
    border: 1px solid var(--code-blue-grey);
  }

  /* TODO: style dark version of the menu that opens 

  .search-box ul .suggestions {
  }

  .search-box .suggestion.focused a {
  }

  .search-box li .suggestion .focused {
  }
  */
}
</style>
