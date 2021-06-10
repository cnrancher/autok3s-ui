<template>
  <div
    class="k-radio-group btn-group"
    :class="{disabled: disabled}">
    <slot></slot>
  </div>
</template>
<script>
import {defineComponent, inject, nextTick, provide, reactive, toRefs} from 'vue'
export default defineComponent({
  name: 'KRadioGroup',
  props: {
    modelValue: {
      type: [String, Number, Boolean],
      default: '',
    },
    horizontal: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, {emit}) {
    const changeEvent = (v) => {
      emit('update:modelValue', v)
      nextTick(() => {
        emit('change', v)
      })
    }
    provide('radioGroup', reactive({
      ...toRefs(props),
      changeEvent
    }))
  }
})
</script>
<style>
.k-radio-group {
  display: flex;
  flex-wrap: nowrap;
}
.k-radio-group > label:first-child, .k-radio-group > div:first-child{
  border-top-left-radius: var(--border-radius);
  border-bottom-left-radius: var(--border-radius);
}
.k-radio-group > label:last-child, .k-radio-group > div:last-child {
  border-top-right-radius: var(--border-radius);
  border-bottom-right-radius: var(--border-radius);
}
</style>
