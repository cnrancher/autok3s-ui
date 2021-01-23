<template>
  <li class="k-dropdown-menu__item">
    <slot></slot>
  </li>
</template>
<script>
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'DropdownMenuItem'
})
</script>
<style>
.k-dropdown-menu__item {
  display: flex;
  align-items: center;
  list-style-type: none;
  padding: 10px;
  margin: 10px 0;
  color: var(--dropdown-text);
  &:hover {
    background-color: var(--dropdown-hover-bg);
    color: var(--dropdown-hover-text);
    cursor: pointer;
  }
}
</style>