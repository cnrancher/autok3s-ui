<template>
  <dropdown-menu-item
    :class="[currentValue.includes(value) ? 'text-white bg-warm-gray-400' : 'text-light-blue-500']"
    @click="setValue"
  >
    <slot :label="label" :value="value">
      {{ label ?? value }}
    </slot>
  </dropdown-menu-item>
</template>
<script>
export default {
  name: 'KOption'
}
</script>
<script setup>
import { inject, getCurrentInstance, onBeforeUnmount, computed } from 'vue'
import { DropdownMenuItem } from '@/components/Dropdown'

defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number, Boolean],
    required: true
  }
})

const selectStore = inject('selectStore')
const multiple = inject('multiple')
const selectEmit = inject('selectEmit')
if (!selectStore) {
  console.warn('selectStore not provide')
}
const currentOption = getCurrentInstance().proxy
selectStore.action.addOption(currentOption)
onBeforeUnmount(() => {
  selectStore.action.removeOption(currentOption)
})
const currentValue = computed(() => {
  if (multiple) {
    return selectStore.state.values ?? []
  }
  return [selectStore.state.value]
})
const setValue = (e) => {
  if (multiple) {
    e.stopPropagation()
    const i = currentValue.value.indexOf(currentOption.value)
    const v = currentValue.value.slice()
    if (i > -1) {
      v.splice(i, 1)
      selectEmit('update:modelValue', v)
      selectEmit('change', v)
    } else {
      v.push(currentOption.value)
      selectEmit('update:modelValue', v)
      selectEmit('change', v)
    }
  } else {
    if (currentValue.value[0] !== currentOption.value) {
      selectEmit('update:modelValue', currentOption.value)
      selectEmit('change', currentOption.value)
    }
  }
}
</script>
