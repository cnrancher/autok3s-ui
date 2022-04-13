<template>
  <label class="k-radio" :class="{ disabled: isDisabled }">
    <input ref="radioRef" v-model="model" type="radio" :value="label" :name="name" :disabled="isDisabled" />
    &nbsp;
    <slot>{{ label }}</slot>
  </label>
</template>
<script>
export default {
  name: 'KRadio'
}
</script>
<script setup>
import { computed, inject, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  label: {
    type: [String, Number, Boolean],
    default: ''
  },
  disabled: Boolean,
  name: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const radioRef = ref(null)
const group = inject('radioGroup')
const model = computed({
  get() {
    return group?.modelValue ?? props.modelValue
  },
  set(v) {
    if (group) {
      group.changeEvent(v)
    } else {
      emit('update:modelValue', v)
    }
    radioRef.value.checked = props.modelValue === props.label
  }
})
const isDisabled = computed(() => {
  return group?.disabled ?? props.disabled
})
</script>
