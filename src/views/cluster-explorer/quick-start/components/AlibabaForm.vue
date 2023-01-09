<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <CredentialSelectForm
      v-show="showKeyForm"
      v-model="credentialValue"
      class="sm:col-span-2"
      provider="alibaba"
      required
      label="Alibaba Credential"
      :desc="desc"
    />
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
const form = reactive(cloneDeep(props.initValue))
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options } = cloneDeep(props.initValue))
  }
)
const showKeyForm = computed(() => {
  return props.hasError || !props.initValue.options['access-key'] || !props.initValue.options['access-secret']
})
const credentialValue = computed({
  get() {
    return {
      'access-key': form.options['access-key'],
      'access-secret': form.options['access-secret']
    }
  },
  set(v) {
    form.options['access-key'] = v['access-key']
    form.options['access-secret'] = v['access-secret']
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
