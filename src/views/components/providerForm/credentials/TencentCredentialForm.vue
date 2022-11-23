<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
    <StringForm v-model.trim="form['secret-id']" label="Secret Id" :desc="desc.options['secret-id']" required />
    <StringForm v-model.trim="form['secret-key']" label="Secret Key" :desc="desc.options['secret-key']" required />
  </div>
</template>
<script setup>
import Schema from 'async-validator'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { reactive, watch } from 'vue'
const props = defineProps({
  initValue: {
    type: Object,
    default() {
      return {
        'secret-id': '',
        'secret-key': ''
      }
    }
  },
  desc: {
    type: Object,
    required: true
  }
})

const descriptor = {
  'secret-id': {
    required: true,
    message: '"Access Key" is required'
  },
  'secret-key': {
    required: true,
    message: '"Secret Key" is required'
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
