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
      @credential-change="handleCredentialChange"
    />
    <string-form v-model.trim="form.config['master']" label="Master" :desc="desc.config['master']" />
    <string-form v-model.trim="form.config['worker']" label="Worker" :desc="desc.config['worker']" />
    <!-- <string-form
      v-show="showKeyForm"
      v-model.trim="form.options['service-account']"
      label="Service Account"
      :desc="desc.options['service-account']"
      required
    />
    <string-form
      v-show="showKeyForm"
      v-model.trim="form.options['service-account-file']"
      label="Service Account File"
      :desc="desc.options['service-account-file']"
      required
    /> -->
    <string-form v-model.trim="form.options['project']" label="Project" :desc="desc.options['project']" required />
    <string-form v-model.trim="form.options.region" label="Region" :desc="desc.options.region" disabled />
    <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" disabled />
  </div>
</template>
<script setup>
import { computed, watch, reactive } from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { cloneDeep } from '@/utils'
import useFormRegist from '@/composables/useFormRegist.js'
import CredentialSelectForm from '@/views/components/baseForm/CredentialSelectForm.vue'

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

const form = reactive(cloneDeep(props.initValue))
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options } = cloneDeep(props.initValue))
  }
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
const getForm = () => {
  const f = cloneDeep(form)
  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
useFormRegist(getForm)
</script>
