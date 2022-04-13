<template>
  <k-input v-bind="$attrs">
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix"></slot>
    </template>
  </k-input>
</template>
<script>
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'StringForm'
})
</script>
