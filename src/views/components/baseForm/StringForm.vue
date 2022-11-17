<template>
  <k-input v-bind="$attrs" :raw-desc="true">
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix"></slot>
    </template>
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix"></slot>
    </template>
  </k-input>
</template>
<script>
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'StringForm'
})
</script>
