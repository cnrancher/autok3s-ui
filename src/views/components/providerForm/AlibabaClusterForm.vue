<template>
  <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
  <input style="display: none" autocomplete="new-password" type="password" />
  <k-tabs v-model="acitiveTab" tab-position="left">
    <k-tab-pane label="Credential Options" name="credential">
      <form-group>
        <template #title>Credential Options</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <k-password-input
              v-model="form.options['access-key']"
              label="Access Key"
              :desc="desc.options['access-key']"
              :readonly="readonly"
            ></k-password-input>
            <k-password-input
              v-model="form.options['access-secret']"
              label="Access Secret"
              :desc="desc.options['access-secret']"
              :readonly="readonly"
            ></k-password-input>
          </div>
        </template>
      </form-group>
    </k-tab-pane>
    <k-tab-pane label="Instance Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model.trim="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :readonly="readonly"
            />
            <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" :readonly="readonly" />
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
      <hr class="section-divider" />
      <form-group :closable="true">
        <template #title>Network</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
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
            <boolean-form v-model="form.options['eip']" label="EIP" :desc="desc.options['eip']" :readonly="readonly" />
          </div>
        </template>
      </form-group>
      <hr class="section-divider" />
      <form-group>
        <template #title>SSH Public</template>
        <template #subtitle>Params used to login to instance via ssh, e.g. key-pair, ssh user, ssh port</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
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
      <hr class="section-divider" />
      <form-group>
        <template #title>SSH Private</template>
        <template #subtitle>
          Params used to login to instance from user computer, e.g. ssh private key, ssh password, etc
        </template>
        <template #default>
          <ssh-private-form :form="form" :desc="desc" :readonly="readonly"></ssh-private-form>
        </template>
      </form-group>
      <hr class="section-divider" />
      <form-group :closable="true">
        <template #title>Advance</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <cluster-tags-form
              ref="tags"
              v-model="form.options.tags"
              :desc="desc.options['tags']"
              :readonly="readonly"
              label="Tags"
              placeholder="e.g. foo=bar"
              action-label="Add Tag"
            ></cluster-tags-form>
          </div>
        </template>
      </form-group>
    </k-tab-pane>
    <k-tab-pane label="K3s Options" name="k3s">
      <k3s-options-form :visible="acitiveTab === 'k3s'" :form="form" :desc="desc"></k3s-options-form>
    </k-tab-pane>
    <k-tab-pane label="Additional Options" name="additional">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
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
        <boolean-form
          v-model="form.options['cloud-controller-manager']"
          label="Cloud Controller Manager"
          :desc="desc.options['cloud-controller-manager']"
          :readonly="readonly"
        />
        <boolean-form
          v-model="form.options['terway']"
          label="Terway"
          :desc="desc.options['terway']"
          true-value="eni"
          false-value="none"
          :readonly="readonly"
        />
        <string-form
          v-show="form.options['terway'] === 'eni'"
          v-model="form.options['terway-max-pool-size']"
          label="Terway Max Pool Size"
          type="number"
          :readonly="readonly"
        ></string-form>
      </div>
    </k-tab-pane>
  </k-tabs>
</template>
<script setup>
import { cloneDeep } from '@/utils'
import { ref, computed } from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import ClusterTagsForm from '../baseForm/ArrayListForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'

import useFormFromSchema from '../../composables/useFormFromSchema.js'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const { form, desc } = useFormFromSchema(props.schema)
const acitiveTab = ref('instance')
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
const updateActiveTab = () => {
  if (!form.options['access-key'] || !form.options['access-secret']) {
    acitiveTab.value = 'credential'
    return
  }
  acitiveTab.value = 'instance'
}
updateActiveTab()

const tags = ref(null)
const getForm = () => {
  const f = cloneDeep(form)
  const values = tags.value.getForm()
  f.options.tags = values ? values.filter((v) => v) : values
  return f
}

defineExpose({ getForm })
</script>
