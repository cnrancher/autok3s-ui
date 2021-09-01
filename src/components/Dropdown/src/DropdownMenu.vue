<template>
  <ul class="m-0 p-0 list-none text-light-blue-500">
    <slot></slot>
  </ul>
</template>
<script>
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'KDropdownMenu'
})
</script>
