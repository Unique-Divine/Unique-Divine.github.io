<template>
  <div v-if="visible" class="nav__dropdown">
    <ul class="list-none nav__dropdown__ul">
      <template v-for="(item, index) in items">
        <a v-if="item.external" :href="item.link" :key="'a-' + index">
          <li>{{ item.text }}</li>
        </a>
        <router-link v-else :to="item.link" :key="'router-link-' + index" tag="li">
          {{ item.text }}
        </router-link>
      </template>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      required: true,
    },
    visible: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style>
.nav__dropdown {
  position: absolute;
  background-color: #f9f9f9;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 100;
  width: 200px;
  border-radius: 0.5em;
  top: 2em;
  cursor: pointer;
}

.nav__dropdown a,
.nav__dropdown router-link {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

.nav__dropdown ul>*:hover {
  background-color: hsl(0, 0%, 90%);
}

.nav__dropdown ul>* {
  padding-top: 0.6em;
  padding-bottom: 0.6em;
  padding: 1rem 1.5rem;
  margin: 0;
}

.list-none {
  list-style: none;
}

.nav__dropdown__ul {
  display: flex;
  flex-direction: column;
  margin-bottom: 0px;
  padding: 1rem 0rem;
}
</style>
