<template>
  <KModal>
    <template #title>{{ mode === 'create' ? 'Create' : 'Edit' }} {{ startCase(provider) }} Credential</template>
    <template #default>
      <KLoading :loading="loading">
        <component :is="componentMap[provider]" ref="formRef" :desc="desc" :init-value="initValue?.secrets"></component>
        <div>
          <KAlert v-for="e in errors" :key="e" type="error" :title="e"></KAlert>
        </div>
      </KLoading>
    </template>
    <template #footer>
      <KButton class="role-secondary" @click="close">Cancel</KButton>
      <KButton class="role-primary" :loading="loading || saveing" @click="save">Save</KButton>
    </template>
  </KModal>
</template>
<script setup>
import { stringify } from '@/utils/error.js'
import { startCase } from 'lodash-es'
import { ref } from 'vue'
import { createCredential, updateCredential } from '@/api/credential'

const props = defineProps({
  provider: {
    type: String,
    required: true
  },
  desc: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'create'
  },
  visible: {
    type: Boolean,
    default: false
  },
  initValue: {
    type: Object,
    default() {
      return {}
    }
  },
  done: {
    type: Function,
    default() {
      return () => {}
    }
  }
})
const emit = defineEmits(['update:modelValue', 'close'])
const files = import.meta.glob('./*Form.vue', { eager: true, import: 'default' })
const componentMap = Object.entries(files).reduce((t, [k, v]) => {
  const p = k.substring(k.lastIndexOf('/') + 1, k.indexOf('CredentialForm.vue')).toLowerCase()
  t[p] = v

  return t
}, {})

const formRef = ref(null)
const loading = ref(false)
const saveing = ref(false)
const errors = ref([])
const save = async () => {
  saveing.value = true
  const secrets = formRef.value.getForm()
  try {
    await formRef.value.validate()
  } catch ({ errors: err, fields }) {
    errors.value = err.map((e) => e.message)
    saveing.value = false
    return
  }
  const data = {
    provider: props.provider,
    secrets
  }
  try {
    let resp
    const id = props.initValue?.id
    if (id) {
      resp = await updateCredential(id, data)
    } else {
      resp = await createCredential(data)
    }

    props?.done(resp)
    close()
  } catch (err) {
    errors.value = [stringify(err)]
  }
  saveing.value = false
}
const close = () => {
  emit('close')
}
</script>
