<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  min: {
    type: Number,
    default: 12
  },
  max: {
    type: Number,
    default: 100
  },
  step: {
    type: Number,
    default: 1
  },
  modelValue: {
    type: Number,
    default: 12
  }
})
const emit = defineEmits(['update:modelValue'])
const userInput = ref(null)

const displayValue = computed(() => {
  if (userInput.value !== null) {
    return userInput.value
  }
  return props.modelValue
})
const increase = () => {
  const { step, max, modelValue } = props
  emit('update:modelValue', Math.min(modelValue + step, max))
}
const decrease = () => {
  const { step, min, modelValue } = props
  emit('update:modelValue', Math.max(modelValue - step, min))
}
const handleInput = (e) => {
  userInput.value = e.target.value
}
const handleChange = (e) => {
  const { min, max } = props
  userInput.value = null
  const v = Number.parseInt(e.target.value)
  if (Number.isNaN(v)) {
    emit('update:modelValue', min)
    return
  }
  if (v > max || v < min) {
    emit('update:modelValue', v > max ? max : min)
    return
  }
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="grid grid-cols-[auto,40px,auto] items-center gap-x-2">
    <label>{{ label }}</label>
    <input
      type="number"
      class="input-number focus-visible:outline-none row-span-2"
      :value="displayValue"
      :min="min"
      :max="max"
      :step="step"
      @change="handleChange"
      @input="handleInput"
    />
    <div class="grid grid-rows-2">
      <KIcon type="arrow-right" class="cursor-pointer" direction="up" @click="increase"></KIcon>
      <KIcon type="arrow-right" class="cursor-pointer" direction="down" @click="decrease"></KIcon>
    </div>
  </div>
</template>
<style scoped>
.input-number {
  -webkit-appearance: none;
  -moz-appearance: textfield;
  text-align: center;
}
.input-number::-webkit-inner-spin-button,
.input-number::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
</style>
