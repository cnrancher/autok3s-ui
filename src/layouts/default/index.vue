<template>
  <div class="autok3s-ui__root">
    <app-header class="autok3s-ui__header"></app-header>
    <app-sider class="autok3s-ui__nav"></app-sider>
    <main class="autok3s-ui__main">
      <div class="autok3s-ui__content outlet">
        <router-view></router-view>
      </div>
      <app-footer></app-footer>
    </main>
    <div class="autok3s-ui__wm">
      <window-manager></window-manager>
    </div>
  </div>
</template>
<script>
import AppFooter from './footer/index.vue'
import AppHeader from './header/index.vue'
import AppSider from './sider/index.vue'
import WindowManager from '@/layouts/components/WindowManager/index.vue'
export default {
  components: {
    AppFooter,
    AppHeader,
    AppSider,
    WindowManager
  }
}
</script>
<style>
.autok3s-ui__root {
  display: grid;
  height: 100vh;
  grid-template-areas: "header header"
                       "nav main"
                       "wm wm";
  grid-template-rows: var(--header-height) auto var(--wm-height, 0);
  grid-template-columns: var(--nav-width) auto;
}

.autok3s-ui__header {
  grid-area: header;
}
.autok3s-ui__nav {
  grid-area: nav;
  overflow-y: auto;
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
.autok3s-ui__content {
  padding: 20px 20px 20px 20px;
}

</style>