<template>
  <k-input
    :max="max"
    :min="min"
    type="number"
    :raw-desc="true"
    :model-value="displayValue"
    @input="handleInput"
    @change="handleChange"
  >
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix"></slot>
    </template>
  </k-input>
</template>
<script setup>
import { ref, computed } from 'vue'
const props = defineProps({
  precision: {
    type: Number,
    default: 0
  },
  // eslint-disable-next-line
  modelValue: [String, Number],
  max: {
    type: Number,
    default: Number.POSITIVE_INFINITY
  },
  min: {
    type: Number,
    default: Number.NEGATIVE_INFINITY
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

const toPrecision = (num, pre = props.precision) => {
  if (pre === 0) {
    return Math.round(num)
  }

  let snum = String(num)
  const pointPos = snum.indexOf('.')
  if (pointPos === -1) {
    return num
  }

  const nums = snum.replace('.', '').split('')
  const datum = nums[pointPos + pre]
  if (!datum) {
    return num
  }
  const length = snum.length
  if (snum.charAt(length - 1) === '5') {
    snum = `${snum.slice(0, Math.max(0, length - 1))}6`
  }
  return Number.parseFloat(Number(snum).toFixed(pre))
}

const verifyValue = (value) => {
  const { max, min, precision } = props
  let newValue = Number(value)
  if ([null, undefined].includes(newValue) || Number.isNaN(newValue)) {
    return null
  }

  newValue = toPrecision(newValue, precision)
  if (newValue > max || newValue < min) {
    newValue = newValue > max ? max : min
  }
  return newValue
}

const handleInput = (e) => {
  userInput.value = e.target.value
}
const handleChange = (e) => {
  const v = e.target.value
  userInput.value = null
  const newValue = v !== '' ? Number(v) : ''
  if ((typeof newValue === 'number' && !Number.isNaN(newValue)) || newValue === '') {
    const value = verifyValue(newValue)
    emit('update:modelValue', value)
  }
}
</script>
