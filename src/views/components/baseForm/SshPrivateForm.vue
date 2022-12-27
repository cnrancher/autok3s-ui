<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-start">
    <KSelect v-model="privateKeyOption" label="Private Key Options" :disabled="readonly">
      <KOption v-for="o in privateKeyOptions" :key="o.value" :value="o.value" :label="o.label"></KOption>
    </KSelect>
    <div></div>
    <template v-if="privateKeyOption === 'filePath'">
      <StringForm
        v-model.trim="form['ssh-key-path']"
        label="SSH Key Path"
        :desc="desc.config['ssh-key-path']"
        :readonly="readonly"
      />
      <StringForm
        v-model.trim="form['ssh-cert-path']"
        label="SSH Cert Path"
        :desc="desc.config['ssh-cert-path']"
        :readonly="readonly"
      />
    </template>
    <template v-else-if="privateKeyOption === 'raw'">
      <KeyForm
        v-model.trim="form['ssh-key']"
        label="Private Key"
        type="textarea"
        desc="The SSH private key"
        :readonly="readonly"
      />
      <KeyForm
        v-model.trim="form['ssh-cert']"
        label="SSH Certificate"
        type="textarea"
        desc="The certificate signed by SSH CA with the public keys in it"
        :readonly="readonly"
      />
    </template>
    <template v-else-if="privateKeyOption === 'storedKey'">
      <KSelect
        v-model="form['ssh-key-name']"
        label="SSH Key Name"
        :disabled="readonly"
        clearable
        placeholder="Please choose a private key..."
      >
        <KOption v-for="d in sshKeyStore.data" :key="d.id" :value="d.id" :label="d.name"></KOption>
      </KSelect>
    </template>
    <KPasswordInput
      v-model.trim="form['ssh-key-passphrase']"
      label="SSH Key Passphrase"
      :desc="desc.config['ssh-key-passphrase']"
      :readonly="readonly"
    />
    <KPasswordInput
      v-model.trim="form['ssh-password']"
      label="SSH Password"
      :desc="desc.config['ssh-password']"
      :readonly="readonly"
    />
    <BooleanForm
      v-model="form['ssh-agent-auth']"
      label="SSH Agent Auth"
      :desc="desc.config['ssh-agent-auth']"
      :readonly="readonly"
    />
  </div>
</template>
<script setup>
import { ref, reactive, watch } from 'vue'
import BooleanForm from './BooleanForm.vue'
import StringForm from './StringForm.vue'
import KeyForm from './KeyForm.vue'
import useSshKeyStore from '@/store/useSshKeyStore.js'
import useFormRegist from '@/composables/useFormRegist.js'

const props = defineProps({
  initValue: {
    type: Object,
    required: true
  },
  desc: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const sshKeyStore = useSshKeyStore()
const privateKeyOptions = [
  {
    label: 'Local Private Key File Path',
    value: 'filePath'
  },
  {
    label: 'Raw Private Key',
    value: 'raw'
  },
  {
    label: 'Stored Private Key',
    value: 'storedKey'
  }
]

const privateKeyOption = ref('filePath')
const configFields = [
  'ssh-key-path',
  'ssh-key-passphrase',
  'ssh-password',
  'ssh-agent-auth',
  'ssh-cert-path',
  'ssh-key',
  'ssh-key-name',
  'ssh-cert'
]
const form = reactive({})
watch(
  () => props.initValue,
  () => {
    configFields.forEach((k) => {
      form[k] = props.initValue.config[k]
    })
    if (props.initValue.config['ssh-key-name']) {
      privateKeyOption.value = 'storedKey'
    } else if (props.initValue.config['ssh-key']) {
      privateKeyOption.value = 'raw'
    } else {
      privateKeyOption.value = 'filePath'
    }
  },
  { immediate: true }
)

const getForm = () => {
  const f = configFields.map((k) => {
    return {
      path: ['config', k],
      value: form[k]
    }
  })
  if (privateKeyOption.value === 'filePath') {
    f.find(({ path: [, k] }) => k === 'ssh-key-name').value = ''
    f.find(({ path: [, k] }) => k === 'ssh-key').value = ''
    f.find(({ path: [, k] }) => k === 'ssh-cert').value = ''
  } else if (privateKeyOption.value === 'raw') {
    f.find(({ path: [, k] }) => k === 'ssh-key-name').value = ''
    f.find(({ path: [, k] }) => k === 'ssh-key-path').value = ''
    f.find(({ path: [, k] }) => k === 'ssh-cert-path').value = ''
  } else if (privateKeyOption.value === 'storedKey') {
    f.find(({ path: [, k] }) => k === 'ssh-key').value = ''
    f.find(({ path: [, k] }) => k === 'ssh-cert').value = ''
    f.find(({ path: [, k] }) => k === 'ssh-key-path').value = ''
    f.find(({ path: [, k] }) => k === 'ssh-cert-path').value = ''
  }

  return f
}

useFormRegist(getForm)
</script>
