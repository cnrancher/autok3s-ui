<template>
  <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
  <input style="display: none" autocomplete="new-password" type="password" />
  <k-tabs tab-position="left" v-model="acitiveTab">
    <k-tab-pane label="Instance Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="native-cluster-create-form__content">
            <ip-address-pool-form
              ref="masterIps"
              v-model="form.options['master-ips']"
              label="Master IPs"
              :desc="desc.options['master-ips']"
              :readonly="readonly"
            ></ip-address-pool-form>
            <ip-address-pool-form
              ref="workerIps"
              v-model="form.options['worker-ips']"
              label="Worker IPs"
              :desc="desc.options['worker-ips']"
              :readonly="readonly"
            ></ip-address-pool-form>
          </div>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group>
        <template #title>SSH</template>
        <template #default>
          <div class="native-cluster-create-form__content">
            <string-form
              v-model.trim="form.config['ssh-user']"
              label="SSH User"
              :desc="desc.config['ssh-user']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.config['ssh-port']"
              label="SSH Port"
              :desc="desc.config['ssh-port']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.config['ssh-key-path']"
              label="SSH Key Path"
              :desc="desc.config['ssh-key-path']"
              :readonly="readonly"
            />
            <div class="native-cluster-create-form__toggle" @click="toggleVisible">
              <div>Advance</div>
              <a>{{visible ? 'Hide':'Show'}}</a>
              <k-icon type="arrow-right" :direction="visible ? 'down' : ''"></k-icon>
            </div>
            <div class="native-cluster-create-form__advance" v-show="visible">
              <k-password-input
                v-model.trim="form.config['ssh-key-passphrase']"
                label="SSH Key Passphrase"
                :desc="desc.config['ssh-key-passphrase']"
                :readonly="readonly"
              />
              <string-form
                v-model.trim="form.config['ssh-cert-path']"
                label="SSH Cert Path"
                :desc="desc.config['ssh-cert-path']"
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
            </div>
          </div>
        </template>
      </form-group>
    </k-tab-pane>
    <k-tab-pane label="K3s Options" name="k3s">
      <k3s-options-form
        :visible="acitiveTab === 'k3s'"
        :form="form"
        :desc="desc"
        :readonly="readonly">
      </k3s-options-form>
    </k-tab-pane>
    <k-tab-pane label="Additional Options" name="additional">
      <div class="native-cluster-create-form__content">
        <!-- <boolean-form
          v-model="form.config['ui']"
          label="UI"
          :desc="desc.config['ui']"
          :readonly="readonly"
        /> -->
        <k-select
          v-model="uiOptions"
          :desc="desc.config['enable']"
          label="UI"
          :disabled="readonly"
          placeholder="Disable"
          multiple
        >
          <k-option value="explorer" label="explorer"></k-option>
          <k-option value="dashboard" label="dashboard"></k-option>
        </k-select>
      </div>
    </k-tab-pane>
  </k-tabs>
</template>
<script>
import {defineComponent, ref, computed} from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import IpAddressPoolForm from '../baseForm/IpAddressPoolForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import useFormFromSchema from '../../composables/useFormFromSchema.js'
import { cloneDeep } from '@/utils'
export default defineComponent({
  props: {
    schema: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const masterIps = ref(null)
    const workerIps = ref(null)
    const { form, desc }= useFormFromSchema(props.schema)
    const uiOptions = computed({
      get() {
        if (form.config.enable) {
          return form.config.enable
        }
        if (form.config.ui) {
          return ['dashboard']
        }
        return []
      },
      set(v) {
        form.config.enable = v
      }
    })
    const getForm = () => {
      const f = cloneDeep(form)
      f.options['master-ips'] = masterIps.value.getForm().filter((v) => v).join(',')
      f.options['worker-ips'] = workerIps.value.getForm().filter((v) => v).join(',')
      return f
    }
    const acitiveTab = ref('instance')
    const visible = ref(false)
    const toggleVisible = () => {
      visible.value = !visible.value
    }
    return {
      form,
      desc,
      getForm,
      visible,
      toggleVisible,
      masterIps,
      workerIps,
      acitiveTab,
      uiOptions,
    }
  },
  components: {
    BooleanForm,
    StringForm,
    IpAddressPoolForm,
    K3sOptionsForm,
    SshPrivateForm,
    FormGroup,
  }
})
</script>
<style>
.native-cluster-create-form__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
  column-gap: 10px;
}

.native-cluster-create-form__toggle {
  cursor: pointer;
  display: grid;
  grid-template-columns: auto auto 1fr;
  column-gap: 10px;
  height: 100%;
  align-items: end;
  justify-items: end;
}
.native-cluster-create-form__advance {
  display: contents;
}
</style>