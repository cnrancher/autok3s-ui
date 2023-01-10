<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <CredentialSelectForm
      v-show="showKeyForm"
      v-model="credentialValue"
      class="sm:col-span-2"
      provider="google"
      required
      label="GCE Credential"
      :desc="desc"
    />
    <string-form v-model.trim="form.options['project']" label="Project" :desc="desc.options['project']" required />
    <div class="sm:col-span-2">
      <HaConfigForm :init-value="form" :desc="desc" />
    </div>
    <string-form v-model.trim="form.options.region" label="Region" :desc="desc.options.region" disabled />
    <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" disabled />
  </div>
</template>
<script setup>
import { computed, watch, reactive } from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import HaConfigForm from './HaConfigForm.vue'
import { cloneDeep } from '@/utils'
import useFormRegist from '@/composables/useFormRegist.js'
import CredentialSelectForm from '@/views/components/baseForm/CredentialSelectForm.vue'
import useFormManage from '@/composables/useFormManage.js'

const props = defineProps({
  initValue: {
    type: Object,
    required: true
  },
  desc: {
    type: Object,
    required: true
  },
  hasError: {
    type: Boolean,
    default: false
  }
})
const { getForm: getSubform, validate: validateSubForm } = useFormManage()
const form = reactive({
  provider: '',
  config: {},
  options: {}
})
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options, provider: form.provider } = cloneDeep(props.initValue))
  },
  { immediate: true }
)
const showKeyForm = computed(() => {
  return (
    props.hasError || !props.initValue.options['service-account'] || !props.initValue.options['service-account-file']
  )
})
const credentialValue = computed({
  get() {
    return {
      'service-account': form.options['service-account'],
      'service-account-file': form.options['service-account-file']
    }
  },
  set(v) {
    form.options['service-account'] = v['service-account']
    form.options['service-account-file'] = v['service-account-file']
  }
})

const validate = () => {
  return validateSubForm()
}
const getForm = () => {
  const f = getSubform(form)
  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
useFormRegist(getForm, validate)
</script>
