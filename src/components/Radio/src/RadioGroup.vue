<template>
  <div
    class="k-radio-group flex flex-nowrap"
    :class="{disabled: disabled}">
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: 'KRadioGroup',
}
</script>
<script setup>
import { nextTick, provide, reactive, toRefs } from 'vue'

const props = defineProps({
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
})

const emit = defineEmits(['update:modelValue', 'change'])

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
</script>
<style>
.k-radio-group > label:first-child, .k-radio-group > div:first-child{
  @apply rounded-l;
}
.k-radio-group > label:last-child, .k-radio-group > div:last-child {
  @apply rounded-r;
}
</style>
