<template>
  <div class="autok3s-ui__root">
    <app-header class="autok3s-ui__header"></app-header>
    <app-sider class="autok3s-ui__nav"></app-sider>
    <main class="autok3s-ui__main">
      <div class="p-20px outlet">
        <router-view></router-view>
      </div>
      <app-footer></app-footer>
    </main>
    <window-manager class="autok3s-ui__wm"></window-manager>
  </div>
</template>
<script>
import AppFooter from './footer/index.vue'
import AppHeader from './header/index.vue'
import AppSider from './sider/index.vue'
import WindowManager from '@/layouts/components/WindowManager/index.vue'
import { useRoute } from 'vue-router'
import {defineComponent, ref, watch, provide} from 'vue'

export default defineComponent({
  setup() {
    const openSideBar = ref(false)
    const route = useRoute()

    provide('openSideBar', openSideBar)

    watch(() => route.path, () => {
      openSideBar.value = false
    })
  },
  components: {
    AppFooter,
    AppHeader,
    AppSider,
    WindowManager
  }
})
</script>
<style>
.autok3s-ui__root {
  display: grid;
  height: 100vh;
  grid-template-areas: "header"
                       "main"
                       "wm";
  grid-template-rows: var(--header-height) auto var(--wm-height, 0);
  grid-template-columns: auto;
}

.autok3s-ui__header {
  grid-area: header;
}
.autok3s-ui__nav {
  position: fixed;
  height: 100%;
  width: var(--nav-width);
  background-color: #fff;
  z-index: var(--nav-z-index);
}
.autok3s-ui__wm {
  grid-area: wm;
}
.autok3s-ui__main {
  grid-area: main;
  overflow: auto;
  display: grid;
  grid-template-rows: 1fr var(--footer-height);
}

@screen lg {
  .autok3s-ui__root {
    grid-template-areas: "header header"
                         "nav main"
                         "wm wm";
    grid-template-columns: var(--nav-width) auto;
  }
  .autok3s-ui__nav {
    grid-area: nav;
    position: static;
    z-index: 0;
  }
}
</style>
