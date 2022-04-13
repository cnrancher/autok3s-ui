<template>
  <div class="border-t border-b">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'KCollapse'
}
</script>

<script setup>
import { provide, readonly, watchEffect, ref } from 'vue'

const props = defineProps({
  accordion: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Array,
    default() {
      return []
    }
  }
})

const emit = defineEmits(['update:modelValue', 'change'])
const activeNames = ref([])
watchEffect(() => {
  activeNames.value = [...props.modelValue]
})
const toggleActiveName = (name) => {
  const index = activeNames.value.indexOf(name)
  if (props.accordion) {
    if (index > -1) {
      activeNames.value = []
    } else {
      activeNames.value = [name]
    }
  } else {
    if (index > -1) {
      activeNames.value.splice(index, 1)
    } else {
      activeNames.value.push(name)
    }
  }
  emit('update:modelValue', activeNames.value)
  emit('change', activeNames.value)
}
provide('activeNames', readonly(activeNames))
provide('toggleActiveName', toggleActiveName)
</script>
