<template>
    <code class="custom-option">{{value}}</code>
</template>
<script setup>
import {computed} from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  }
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get() {
    return props.modelValue
  },
  set(v) {
    emit('update:modelValue', v)
  }
})

</script>