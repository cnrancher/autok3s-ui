<template>
  <div class="ssh-provate-form">
    <string-form
      v-model.trim="form.config['ssh-key-path']"
      label="SSH Key Path"
      :desc="desc.config['ssh-key-path']"
      :readonly="readonly"
    />
    <div class="ssh-provate-form__toggle" @click="toggleVisible">
      <div>Advance</div>
      <a>{{visible ? 'Hide':'Show'}}</a>
      <k-icon type="arrow-right" :direction="visible ? 'down' : ''"></k-icon>
    </div>
    <div class="ssh-provate-form__advance" v-show="visible">
      <password-form
        v-model.trim="form.config['ssh-key-passphrase']"
        label="SSH Key Passphrase"
        :desc="desc.config['ssh-key-passphrase']"
        :readonly="readonly"
      />
      <password-form
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
<script>
import {defineComponent, ref} from 'vue'
import { PasswordInput as PasswordForm} from '@/components/Input'
import BooleanForm from './BooleanForm.vue'
import StringForm from './StringForm.vue'
import KIcon from '@/components/Icon'
export default defineComponent({
  props: {
    form: {
      type: Object,
      required: true
    },
    desc: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const visible = ref(false)
    const toggleVisible = () => {
      visible.value = !visible.value
    }
    return {
      visible,
      toggleVisible,
    }
  },
  components: {
    BooleanForm,
    StringForm,
    PasswordForm,
    KIcon,
  }
})
</script>
<style>
.ssh-provate-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
  column-gap: 10px;
  align-items: end;
}
.ssh-provate-form__toggle {
  cursor: pointer;
  display: grid;
  grid-template-columns: auto auto 1fr;
  column-gap: 10px;
  height: 100%;
  align-items: end;
  justify-items: end;
}
.ssh-provate-form__advance {
  display: contents;
}
</style>