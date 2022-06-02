<template>
  <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
  <input style="display: none" autocomplete="new-password" type="password" />
  <k-tabs v-model="acitiveTab" tab-position="left">
    <k-tab-pane label="Credential Options" name="credential">
      <form-group>
        <template #title>Credential Options</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model="form.options['service-account']"
              label="Service Account"
              :desc="desc.options['service-account']"
              :readonly="readonly"
            ></string-form>
            <string-form
              v-model="form.options['service-account-file']"
              label="Service Account File"
              :desc="desc.options['service-account-file']"
              :readonly="readonly"
            ></string-form>
          </div>
        </template>
      </form-group>
    </k-tab-pane>
    <k-tab-pane label="Instance Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form v-model.trim="form.options['project']" label="Project" :desc="desc.options['project']" />
            <string-form
              v-model.trim="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :readonly="readonly"
            />
            <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" :readonly="readonly" />
            <string-form
              v-model.trim="form.options['machine-type']"
              label="Machine Type"
              :desc="desc.options['machine-type']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['machine-image']"
              label="Machine Image"
              :desc="desc.options['machine-image']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['disk-type']"
              label="Disk Type"
              :desc="desc.options['disk-type']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['disk-size']"
              label="Disk Size"
              :desc="desc.options['disk-size']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['scopes']"
              label="Scopes"
              :desc="desc.options['scopes']"
              :readonly="readonly"
            />
            <boolean-form
              v-model="form.options['preemptible']"
              label="Preemptible"
              :desc="desc.options['preemptible']"
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
              v-model.trim="form.options['network']"
              label="Network"
              :desc="desc.options['network']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['subnetwork']"
              label="Subnetwork"
              :desc="desc.options['subnetwork']"
              :readonly="readonly"
            />
            <boolean-form
              v-model="form.options['use-internal-ip-only']"
              label="Use Internal IP Only"
              :desc="desc.options['use-internal-ip-only']"
              :readonly="readonly"
            />
            <div></div>
            <array-list-form
              ref="ports"
              v-model="form.options['open-ports']"
              :desc="desc.options['open-ports']"
              :readonly="readonly"
              label="Open Ports"
              placeholder="e.g. 8080/tcp"
              action-label="Add Port"
            ></array-list-form>
          </div>
        </template>
      </form-group>
      <!-- <hr class="section-divider">
      <form-group>
        <template #title>
          SSH Public
        </template>
        <template #subtitle>
          Params used to login to instance via ssh, e.g. key-pair, ssh user, ssh port
        </template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model.trim="form.options['keypair-name']"
              label="Keypair Name"
              :desc="desc.options['keypair-name']"
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
      </form-group> -->
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
      <form-group v-model="advanceConfigVisible" :closable="true">
        <template #title>Advance</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <array-list-form
              ref="tags"
              v-model="form.options.tags"
              :desc="desc.options['tags']"
              :readonly="readonly"
              label="Tags"
              placeholder="e.g. foo=bar"
              action-label="Add Tag"
            ></array-list-form>
          </div>
          <!-- <div class="mt-10px grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model.trim="form.options['startup-script-url']"
              label="Startup Script URL"
              :desc="desc.options['startup-script-url']"
              :readonly="readonly"
            />
          </div>
          <UserDataForm
            v-model="form.options['startup-script-content']"
            label="Startup Script"
            :desc="desc.options['startup-script-content']"
            :options="readonlyOption"
            :visible="advanceConfigVisible"
          ></UserDataForm> -->
        </template>
      </form-group>
    </k-tab-pane>
    <k-tab-pane label="K3s Options" name="k3s">
      <k3s-options-form
        :visible="acitiveTab === 'k3s'"
        :form="form"
        :desc="desc"
        :readonly="readonly"
      ></k3s-options-form>
    </k-tab-pane>
    <k-tab-pane label="Additional Options" name="additional">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <!-- <boolean-form
          v-model="form.config['ui']"
          label="UI"
          :desc="desc.config['enable'] || desc.config['ui']"
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
        <!-- <string-form
          v-show="form.options['cloud-controller-manager']"
          v-model.trim="form.options['iam-instance-profile-control']"
          label="IAM Instance Profile Control"
          :desc="desc.options['iam-instance-profile-control']"
          :readonly="readonly"
        />
         <string-form
          v-show="form.options['cloud-controller-manager']"
          v-model.trim="form.options['iam-instance-profile-worker']"
          label="IAM Instance Profile Worker"
          :desc="desc.options['iam-instance-profile-worker']"
          :readonly="readonly"
        /> -->
      </div>
    </k-tab-pane>
  </k-tabs>
</template>
<script setup>
import { cloneDeep } from '@/utils'
import { ref, computed, watch } from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
// import UserDataForm from '../baseForm/UserDataForm.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import ArrayListForm from '../baseForm/ArrayListForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import useFormFromSchema from '../../composables/useFormFromSchema.js'
import { Base64 } from 'js-base64'

const needDecodeOptionKeys = ['startup-script-content']

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
// decode options
watch(
  () => form.options,
  () => {
    needDecodeOptionKeys.forEach((k) => {
      const v = form.options[k]
      if (v) {
        form.options[k] = Base64.decode(v)
      }
    })
  },
  {
    immediate: true
  }
)
const advanceConfigVisible = ref(false)
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
// const readonlyOption = computed(() => {
//   return { readOnly: props.readonly }
// })
const updateActiveTab = () => {
  if (!form.options['service-account'] || !form.options['service-account-file']) {
    acitiveTab.value = 'credential'
    return
  }
  acitiveTab.value = 'instance'
}
updateActiveTab()

const tags = ref(null)
const ports = ref(null)
const getForm = () => {
  const f = cloneDeep(form)
  const tagValues = tags.value.getForm()
  const portValues = ports.value.getForm()
  f.options.tags = tagValues ? tagValues.filter((v) => v) : tagValues
  f.options['open-ports'] = portValues ? portValues.filter((v) => v) : portValues
  return f
}

defineExpose({ getForm })
</script>
