<template>
  <k-input v-bind="$attrs">
    <template #suffix v-if="$slots.suffix">
     <slot name="suffix"></slot> 
    </template>
  </k-input>
</template>
<script>
import {defineComponent} from 'vue'
export default defineComponent({
  name: 'StringForm',
})
</script>