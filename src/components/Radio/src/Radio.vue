<template>
  <label
    class="k-radio"
    :class="{disabled: isDisabled}">
    <input
      v-model="model"
      type="radio"
      :value="label"
      :name="name"
      :disabled="isDisabled"
      > &nbsp;
    <slot>{{label}}</slot>
  </label>
</template>
<script>
import {computed, defineComponent, inject, ref} from 'vue'
export default defineComponent({
  name: 'KRadio',
  props: {
    modelValue: {
      type: [String, Number, Boolean],
      default: '',
    },
    label: {
      type: [String, Number, Boolean],
      default: '',
    },
    disabled: Boolean,
    name: {
      type: String,
      default: '',
    },
  },
  setup(props, {emit}) {
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
    return {
      isDisabled,
      model,
      radioRef,
    }
  }
})
</script>
