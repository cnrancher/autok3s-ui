<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-end">
    <string-form
      v-model.trim="form.config['ssh-key-path']"
      label="SSH Key Path"
      :desc="desc.config['ssh-key-path']"
      :readonly="readonly"
    />
    <div
      class="cursor-pointer grid grid-cols-[auto,auto,1fr] items-center justify-items-end gap-x-10px h-full"
      @click="toggleVisible"
    >
      <a class="text-light-blue-500">{{ visible ? 'Hide' : 'Show' }} Advanced</a>
      <k-icon type="arrow-right" :direction="visible ? 'down' : ''"></k-icon>
    </div>
    <div v-show="visible" class="contents">
      <k-password-input
        v-model.trim="form.config['ssh-key-passphrase']"
        label="SSH Key Passphrase"
        :desc="desc.config['ssh-key-passphrase']"
        :readonly="readonly"
      />
      <k-password-input
        v-model.trim="form.config['ssh-password']"
        label="SSH Password"
        :desc="desc.config['ssh-password']"
        :readonly="readonly"
      />
      <boolean-form
        v-model="form.config['ssh-agent-auth']"
        label="SSH Agent Auth"
        :desc="desc.config['ssh-agent-auth']"
        :readonly="readonly"
      />
      <string-form
        v-model.trim="form.config['ssh-cert-path']"
        label="SSH Cert Path"
        :desc="desc.config['ssh-cert-path']"
        :readonly="readonly"
      />
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import BooleanForm from './BooleanForm.vue'
import StringForm from './StringForm.vue'

defineProps({
  form: {
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

const visible = ref(false)
const toggleVisible = () => {
  visible.value = !visible.value
}
</script>
