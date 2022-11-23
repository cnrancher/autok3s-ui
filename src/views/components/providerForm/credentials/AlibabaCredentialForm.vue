<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
    <KPasswordInput v-model.trim="form['access-key']" label="Access Key" :desc="desc.options['access-key']" required />
    <KPasswordInput
      v-model.trim="form['access-secret']"
      label="Access Secret"
      :desc="desc.options['access-secret']"
      required
    />
  </div>
</template>
<script setup>
import Schema from 'async-validator'
import { reactive, watch } from 'vue'
const props = defineProps({
  initValue: {
    type: Object,
    default() {
      return {
        'access-key': '',
        'access-secret': ''
      }
    }
  },
  desc: {
    type: Object,
    required: true
  }
})

const descriptor = {
  'access-key': {
    required: true,
    message: '"Access Key" is required'
  },
  'access-secret': {
    required: true,
    message: '"Access Secret" is required'
  }
}
const validator = new Schema(descriptor)
const form = reactive({})
watch(
  () => props.initValue,
  (v) => {
    Object.entries(v).forEach(([k, v]) => {
      form[k] = v
    })
  },
  { immediate: true }
)

const getForm = () => {
  return { ...form }
}
const validate = () => {
  return validator.validate(form)
}
defineExpose({ getForm, validate })
</script>
