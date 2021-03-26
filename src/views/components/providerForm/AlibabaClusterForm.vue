<template>
  <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
  <input style="display: none" autocomplete="new-password" type="password" />
  <tabs tab-position="left" v-model="acitiveTab">
    <tab-pane label="Credential Options" name="credential">
      <form-group>
        <template #title>Credential Options</template>
        <template #default>
          <div class="alibaba-cluster-create-form__content">
            <password-form
              v-model="form.options['access-key']"
              label="Access Key"
              :desc="desc.options['access-key']"
              :readonly="readonly">
            </password-form>
            <password-form
              v-model="form.options['access-secret']"
              label="Access Secret"
              :desc="desc.options['access-secret']"
              :readonly="readonly">
            </password-form>
          </div>
        </template>
      </form-group>
    </tab-pane>
    <tab-pane label="Instance Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="alibaba-cluster-create-form__content">
            <string-form
              v-model.trim="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options.zone"
              label="Zone"
              :desc="desc.options.zone"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['instance-type']"
              label="Instance Type"
              :desc="desc.options['instance-type']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['image']"
              label="Image"
              :desc="desc.options['image']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['disk-category']"
              label="Disk Category"
              :desc="desc.options['disk-category']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['disk-size']"
              label="Disk Size"
              :desc="desc.options['disk-size']"
              :readonly="readonly"
            />
          </div>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group :closable="true">
        <template #title>Network</template>
        <template #default>
          <div class="alibaba-cluster-create-form__content">
            <string-form
              v-model.trim="form.options['v-switch']"
              label="V-Switch"
              :desc="desc.options['v-switch']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['internet-max-bandwidth-out']"
              label="Internet Max Bandwidth Out"
              :desc="desc.options['internet-max-bandwidth-out']"
            />
            <string-form
              v-model.trim="form.options['security-group']"
              label="Security Group"
              :desc="desc.options['security-group']"
              :readonly="readonly"
            />
            <boolean-form
              v-model="form.options['eip']"
              label="EIP"
              :desc="desc.options['eip']"
              :readonly="readonly"
            />
          </div>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group>
        <template #title>SSH Public</template>
        <template #subtitle>
          Params used to login to instance via ssh, e.g. key-pair, ssh user, ssh port
        </template>
        <template #default>
          <div class="alibaba-cluster-create-form__content">
            <string-form
              v-model.trim="form.options['key-pair']"
              label="Key Pair"
              :desc="desc.options['key-pair']"
              :readonly="readonly"
            />
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
          </div>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group>
        <template #title>SSH Private</template>
        <template #subtitle>
          Params used to login to instance from user computer, e.g. ssh private key, ssh password, etc
        </template>
        <template #default>
          <ssh-private-form :form="form" :desc="desc" :readonly="readonly"></ssh-private-form>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group :closable="true">
        <template #title>Advance</template>
        <template #default>
          <cluster-tags-form
            v-model="form.options.tags"
            :desc="desc.options['tags']"
            :readonly="readonly"></cluster-tags-form>
        </template>
      </form-group>
    </tab-pane>
    <tab-pane label="K3s Options" name="k3s">
      <k3s-options-form
        :visible="acitiveTab === 'k3s'"
        :form="form"
        :desc="desc">
      </k3s-options-form>
    </tab-pane>
    <tab-pane label="Additional Options" name="additional">
      <div class="alibaba-cluster-create-form__content">
        <boolean-form
          v-model="form.config['ui']"
          label="UI"
          :desc="desc.config['ui']"
          :readonly="readonly"
        />
        <boolean-form
          v-model="form.options['cloud-controller-manager']"
          label="Cloud Controller Manager"
          :desc="desc.options['cloud-controller-manager']"
          :readonly="readonly"
        />
        <boolean-form
          v-model="form.config['terway']"
          label="Terway"
          :desc="desc.config['terway']"
          true-value="eni"
          false-value="none"
          :readonly="readonly"
        />
        <string-form
          v-show="form.config['terway'] === 'eni'"
          label="Terway Max Pool Size"
          type="number"
          v-model="form.config['terway-max-pool-size']"
          :readonly="readonly">
        </string-form>
      </div>
    </tab-pane>

  </tabs>
</template>
<script>
import { cloneDeep } from '@/utils'
import {defineComponent, ref} from 'vue'
import {Tabs, TabPane} from '@/components/Tabs'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import ClusterTagsForm from '../baseForm/ClusterTagsForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import { PasswordInput as PasswordForm} from '@/components/Input'
import { Collapse, CollapseItem } from '@/components/Collapse'

import useFormFromSchema from '../../composables/useFormFromSchema.js'
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
    const { form, desc }= useFormFromSchema(props.schema)
    const acitiveTab = ref('instance')
    const updateActiveTab = () => {
      if (!form.options['access-key'] || !form.options['secret-key']) {
        acitiveTab.value = 'credential'
        return
      }
      acitiveTab.value = 'instance'
    }
    updateActiveTab()
    const getForm = () => {
      return cloneDeep(form)
    }
    return {
      form,
      desc,
      acitiveTab,
      getForm,
    }
  },
  components: {
    Tabs,
    TabPane,
    BooleanForm,
    StringForm,
    PasswordForm,
    TabPane,
    Collapse,
    CollapseItem,
    K3sOptionsForm,
    SshPrivateForm,
    ClusterTagsForm,
    FormGroup,
  }
})
</script>
<style>
.alibaba-cluster-create-form__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
  column-gap: 10px;
}
</style>