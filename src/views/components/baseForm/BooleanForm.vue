<template>
  <k-select v-bind="$attrs" :disabled="readonly">
    <k-option v-for="option in options" :key="option.value" :label="option.label" :value="option.value"></k-option>
  </k-select>
</template>
<script>
import { defineComponent } from 'vue'
import { computed } from 'vue'
export default defineComponent({
  name: 'BooleanForm',
  props: {
    trueLabel: {
      type: String,
      default: 'Enable'
    },
    trueValue: {
      type: [String, Boolean],
      default: true
    },
    falseLabel: {
      type: String,
      default: 'Disable'
    },
    falseValue: {
      type: [String, Boolean],
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const options = computed(() => {
      return [
        {
          label: props.trueLabel,
          value: props.trueValue
        },
        {
          label: props.falseLabel,
          value: props.falseValue
        }
      ]
    })
    return {
      options
    }
  }
})
</script>
