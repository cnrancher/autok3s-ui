<template>
  <li
    class="k-dropdown-menu__item flex items-center p-5px t-light-blue-500 hover:bg-light-blue-500 hover:text-white hover:cursor-pointer"
  >
    <slot></slot>
  </li>
</template>
<script>
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'KDropdownMenuItem'
})
</script>
