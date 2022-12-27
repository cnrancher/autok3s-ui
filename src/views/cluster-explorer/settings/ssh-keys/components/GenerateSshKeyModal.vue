<template>
  <KModal :model-value="visible">
    <template #title>Generate SSH Key</template>
    <template #default>
      <KLoading :loading="creating">
        <div class="grid sm:grid-cols-2 grid-cols-1 gap-10px">
          <StringForm v-model.trim="form.name" label="Name" placeholder="e.g. test" :readonly="readonly" required />
          <KSelect v-model="type" label="Type" desc="Specify the type of key to create" required>
            <KOption value="RSA" label="RSA"></KOption>
          </KSelect>
          <StringForm
            v-model.number="form.bits"
            required
            min="1"
            type="number"
            pattern="^[1-9][0-9]*$"
            label="Bit Size"
            desc="Specify the length (bit size) of the key"
            :readonly="readonly"
          />
          <KPasswordInput v-model.trim="form['ssh-passphrase']" label="Key Passphrase" :readonly="readonly" />
        </div>
        <KAlert v-for="(e, index) in errors" :key="index" type="error" :title="e"></KAlert>
      </KLoading>
    </template>
    <template #footer>
      <KButton class="role-primary" type="button" :loading="creating" @click="generateSshKey">Save</KButton>
      <k-button class="role-secondary" @click="close">Cancel</k-button>
    </template>
  </KModal>
</template>
<script setup>
import StringForm from '@/views/components/baseForm/StringForm.vue'
import { computed, ref, reactive } from 'vue'
import { create } from '@/api/sshKey.js'
import Schema from 'async-validator'
import { downloadFile } from '@/utils/download.js'
import { stringify } from '@/utils/error.js'

const formDescriptor = {
  name: {
    required: true,
    message: '"Name" is required'
  },
  bits: {
    required: true,
    message: '"Bit Size" is required'
  }
}
const validator = new Schema(formDescriptor)

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['close'])
const close = () => {
  emit('close')
}

const form = reactive({
  name: '',
  'generate-key': true,
  bits: 2048,
  'ssh-passphrase': ''
})
const type = ref('RSA')
const creating = ref(false)
const createError = ref(null)
const validErrors = ref([])

const errors = computed(() => {
  return [createError.value, ...validErrors.value].filter((e) => e)
})

const generateSshKey = async () => {
  validErrors.value = []
  createError.value = null
  const data = { ...form }
  try {
    await validator.validate(data)
  } catch ({ errors, fields }) {
    validErrors.value = errors.map((e) => e.message)
    return
  }
  creating.value = true
  try {
    const resp = await create(data)

    if (!resp) {
      return
    }

    downloadFile(`${data.name}_id_rsa`, resp['ssh-key'])
    downloadFile(`${data.name}_id_rsa.pub`, resp['ssh-key-public'])
  } catch (err) {
    createError.value = stringify(err)
  }
  creating.value = false
  close()
}
</script>
