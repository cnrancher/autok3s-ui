<template>
  <div>
    <div class="grid sm:grid-cols-2 grid-cols-1 gap-10px items-start">
      <StringForm v-model.trim="form.name" label="Name" placeholder="e.g. test" :readonly="readonly" required />
      <KPasswordInput v-model.trim="form['ssh-passphrase']" label="Key Passphrase" :readonly="readonly" />
      <KeyForm
        v-model.trim="form['ssh-key']"
        label="Private Key"
        type="textarea"
        required
        desc="The SSH private key"
        :readonly="readonly"
      />

      <KeyForm
        v-model.trim="form['ssh-key-public']"
        label="Public Key"
        type="textarea"
        desc="The SSH Public Key"
        :readonly="readonly"
      />
      <KeyForm
        v-model.trim="form['ssh-cert']"
        label="SSH Certificate"
        type="textarea"
        desc="The certificate signed By SSH CA with the public keys in it"
        :readonly="readonly"
      />
    </div>
    <FooterActions>
      <router-link :to="{ name: 'ClusterExplorerSettingsSshKeys' }" class="btn role-secondary">Cancel</router-link>
      <KButton class="role-primary" type="button" :loading="saving" @click="save">Save</KButton>
    </FooterActions>
    <KAlert v-for="(e, index) in errors" :key="index" type="error" :title="e"></KAlert>
  </div>
</template>
<script setup>
import { reactive, computed, ref } from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import KeyForm from './KeyForm.vue'
import FooterActions from '@/views/components/FooterActions.vue'
import Schema from 'async-validator'
import { create } from '@/api/sshKey.js'
import { useRouter } from 'vue-router'
import { stringify } from '@/utils/error.js'

const router = useRouter()
const formDescriptor = {
  name: {
    required: true,
    message: '"Name" is required'
  },
  'ssh-key': {
    required: true,
    message: '"Private Key" is required'
  }
}
const validator = new Schema(formDescriptor)
defineProps({
  readonly: {
    type: Boolean,
    default: false
  }
})

const form = reactive({
  name: '',
  'ssh-key': '',
  'ssh-key-public': '',
  'ssh-cert': '',
  'ssh-passphrase': ''
})
const validErrors = ref([])
const saveError = ref(null)
const saving = ref(false)
const errors = computed(() => {
  return [saveError.value, ...validErrors.value].filter((e) => e)
})

const save = async () => {
  try {
    await validator.validate(form)
  } catch ({ errors, fields }) {
    validErrors.value = errors.map((e) => e.message)
    return
  }
  try {
    saving.value = true
    await create(form)
    router.push({ name: 'ClusterExplorerSettingsSshKeys' })
  } catch (err) {
    saveError.value = stringify(err)
  }
  saving.value = false
}
</script>
