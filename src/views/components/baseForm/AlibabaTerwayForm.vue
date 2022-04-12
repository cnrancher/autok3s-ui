<template>
  <k-select
    v-model="form.mode"
    label="Terwary"
    :desc="desc"
    :disabled="readonly"
    @change="debounceUpdate">
    <k-option label="Disable" value="none"></k-option>
    <k-option  label="Enable" value="eni"></k-option>
  </k-select>
  <k-input
    v-show="form.mode === 'eni'"
    v-model="form['terway-max-pool-size']"
    label="max-pool-size"
    type="number"
    :readonly="readonly"
    @change="debounceUpdate">
  </k-input>
</template>
<script>
import {defineComponent, reactive} from 'vue'
import { debounce } from 'lodash-es'
export default defineComponent({
  name: 'AlibabaTerwayForm',
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    desc: {
      type: String,
      default: ''
    },
    readonly: {
      type: Boolean,
      default: false,
    }
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const form = reactive({...props.modelValue})
    const update = () => {
      emit('update:modelValue', {...form})
    }
    const debounceUpdate = debounce(update, 500)
    return {
      form,
      debounceUpdate,
    }
  },
})
</script>