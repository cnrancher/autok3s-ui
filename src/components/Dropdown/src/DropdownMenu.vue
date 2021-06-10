<template>
  <ul class="k-dropdown-menu">
    <slot></slot>
  </ul>
</template>
<script>
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'KDropdownMenu'
})
</script>
<style>
.k-dropdown-menu {
  margin: 0;
  padding: 0;
  list-style-type: none;
  color: var(--dropdown-text);
}
</style>