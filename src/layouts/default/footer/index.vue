<template>
  <footer class="k-footer">
    <div>{{version}}</div>
    <a href="https://github.com/cnrancher/autok3s" target="_blank">Docs</a>
    <dropdown class="k-footer__lang">
      English
      <template #content>
        <dropdown-menu>
          <dropdown-menu-item>English</dropdown-menu-item>
        </dropdown-menu>
      </template>
    </dropdown>
  </footer>
</template>
<script>
import {defineComponent} from 'vue'
import {Dropdown, DropdownMenu, DropdownMenuItem} from '@/components/Dropdown'
export default defineComponent({
  setup() {
    const version = __VERSION__
    return {
      version
    }
  },
  components: {
    Dropdown,
    DropdownMenu,
    DropdownMenuItem
  }
})
</script>
<style>
.k-footer {
  display: grid;
  grid-template-areas: "version docs lang";
  grid-template-columns: auto auto 1fr;
  align-items: center;
  border-top: thin solid var(--border);
  column-gap: 40px;
  height: 36px;
  padding: 0 20px;
}
.k-footer__lang {
  justify-self: end;
  cursor: pointer;
}
</style>