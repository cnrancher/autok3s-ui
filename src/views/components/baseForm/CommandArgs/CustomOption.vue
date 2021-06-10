<template>
    <code class="custom-option">{{value}}</code>
</template>
<script>
import {computed, defineComponent} from 'vue'

export default defineComponent({
  name: 'CustomOption',
  props: {
    modelValue: {
      type: String,
      required: true,
    }
  },
  setup(props, {emit}) {
    const value = computed({
      get() {
        return props.modelValue
      },
      set(v) {
        emit('update:modelValue', v)
      }
    })
    return { value }
  }
})
</script>