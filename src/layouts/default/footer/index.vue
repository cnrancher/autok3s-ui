<template>
  <footer class="k-footer">
    <div>{{ version }}</div>
    <a href="https://github.com/cnrancher/autok3s" class="text-$link" target="_blank">Docs</a>
    <dropdown class="justify-self-end cursor-pointer">
      English
      <template #content>
        <dropdown-menu>
          <dropdown-menu-item>English</dropdown-menu-item>
        </dropdown-menu>
      </template>
    </dropdown>
  </footer>
</template>
<script setup>
import { Dropdown, DropdownMenu, DropdownMenuItem } from '@/components/Dropdown'

// eslint-disable-next-line no-undef
const version = __VERSION__
</script>
<style>
.k-footer {
  display: grid;
  grid-template-areas: 'version docs lang';
  grid-template-columns: auto auto 1fr;
  align-items: center;
  column-gap: 40px;
  height: var(--footer-height);
  @apply border-t py-0 px-20px;
}
</style>
