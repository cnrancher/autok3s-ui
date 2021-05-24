<template>
  <label
    class="k-radio-button btn"
    :class="{'bg-primary': model === label, disabled: isDisabled, 'bg-disabled': model !== label}">
    <input
      ref="radioRef"
      type="radio"
      v-model="model"
      :value="label"
      :name="name"
      :disabled="isDisabled"
      class="k-radio-button__origin-radio">
    <span
      class="k-radio-button__label"
    >
      <slot>{{label}}</slot>
    </span>
  </label>
</template>
<script>
import {computed, defineComponent, inject, ref} from 'vue'
export default defineComponent({
  props: {
    modelValue: {
      type: [String, Number, Boolean],
      default: '',
    },
    label: {
      type: [String, Number, Boolean],
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
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
      return group?.disabled || props.disabled
    })
    return {
      model,
      isDisabled,
      radioRef,
    }
  }
})
</script>
<style>
.k-radio-button {
  display: grid;
  grid-template-areas: 'a';
  align-items: center;
  justify-items: center;
}

.k-radio-button:not(.disabled) {
  cursor: pointer;
}
.k-radio-button__origin-radio {
  opacity: 0;
}
.k-radio-button__origin-radio, .k-radio-button__label {
  grid-area: a;
  /* pointer-events: none; */
}
</style>
