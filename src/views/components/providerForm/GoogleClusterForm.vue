<template>
  <k-alert v-if="keyInfo.valid === true && !keyInfo.error" type="success" title="Credentails are valid"></k-alert>
  <k-alert v-else-if="keyInfo.valid === false && keyInfo.error" type="error" :title="keyInfo.error"></k-alert>
  <KAlert v-for="e in errors" :key="e" type="error" :title="e"></KAlert>
  <k-tabs v-model="acitiveTab" :tab-position="tabPosition">
    <k-tab-pane label="Credential Options" name="credential" :error="credentialError">
      <form-group>
        <template #title>Credential Options</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-center">
            <KSelect v-model="credential" label="GCE Credential" required :error="credentialRequired">
              <KOption
                v-for="c in credentialInfo.data"
                :key="c.id"
                :value="c.secrets['service-account']"
                :label="c.secrets['service-account']"
              ></KOption>
            </KSelect>
            <KButton class="role-secondary" style="width: fit-content" @click="showCredentialModal">
              {{ credential ? 'Edit' : 'Create' }} Credential
            </KButton>
            <string-form
              v-model.trim="form.options['project']"
              label="Project"
              :desc="desc.options['project']"
              :error="projectRequired"
              required
            />
          </div>
          <!-- <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model="form.options['service-account']"
              label="Service Account"
              :desc="desc.options['service-account']"
              :readonly="readonly"
              :error="serviceAccountRequired"
              required
            ></string-form>
            <string-form
              v-model="form.options['service-account-file']"
              label="Service Account File"
              :desc="desc.options['service-account-file']"
              :readonly="readonly"
              :error="serviceAccountFileRequired"
              required
            ></string-form>
          </div> -->
        </template>
      </form-group>
      <div v-if="!readonly" class="mt-4 text-center">
        <KButton class="role-secondary" :disabled="keyInfo.loading" @click="validateCredentials">
          Validate Credentails
        </KButton>
      </div>
    </k-tab-pane>
    <k-tab-pane label="Machine Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <string-form
              v-model.trim="form.options['project']"
              label="Project"
              :desc="desc.options['project']"
              disabled
            />
            <!-- <string-form
              v-model.trim="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model.trim="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :disabled="readonly"
              :loading="regionInfo.loading"
              :options="regionInfo.data"
              clearable
              @change="reginChange($event)"
            ></KComboBox>
            <!-- <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" :readonly="readonly" /> -->
            <KComboBox
              v-model="form.options.zone"
              label="Zone"
              :desc="desc.options.zone"
              :disabled="readonly"
              :loading="regionInfo.loading"
              :options="zones"
              clearable
              @change="zoneChange($event)"
            ></KComboBox>
            <!-- <string-form
              v-model.trim="form.options['machine-type']"
              label="Machine Type"
              :desc="desc.options['machine-type']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['machine-type']"
              label="Machine Type"
              :desc="desc.options['machine-type']"
              :disabled="readonly"
              :loading="machineTypeInfo.loading"
              :options="machineTypeInfo.data"
              clearable
            >
              <template #default="{ option }">
                <div>
                  <div>
                    {{ option.label }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ option.raw.description }}
                  </div>
                </div>
              </template>
              <template #footer>
                <div
                  v-if="machineTypeInfo.nextPageToken"
                  class="text-center cursor-pointer"
                  @click.stop="loadMachineTypes()"
                >
                  Load More {{ machineTypeInfo.loading ? '(Loading...)' : '' }}
                </div>
              </template>
            </KComboBox>
            <string-form
              v-model.trim="form.options['machine-image']"
              label="Source Image"
              :desc="desc.options['machine-image']"
              :readonly="readonly"
            >
              <template v-if="keyInfo.valid" #suffix>
                <KIcon
                  type="search"
                  :size="18"
                  class="cursor-pointer"
                  @click="
                    showSearchImageModal({
                      imageInfo,
                      fetchImages,
                      onSelect: (e) => {
                        form.options['machine-image'] = e.image
                      }
                    })
                  "
                ></KIcon>
              </template>
            </string-form>
            <!-- <string-form
              v-model.trim="form.options['disk-type']"
              label="Disk Type"
              :desc="desc.options['disk-type']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['disk-type']"
              label="Disk Type"
              :desc="desc.options['disk-type']"
              :disabled="readonly"
              :loading="diskTypeInfo.loading"
              :options="diskTypeInfo.data"
              clearable
            >
              <template #default="{ option }">
                <div>
                  <div>{{ option.label }}</div>
                  <div class="text-sm text-gray-500">{{ option.raw.description }}</div>
                </div>
              </template>
              <template #footer>
                <div v-if="diskTypeInfo.nextPageToken" class="text-center cursor-pointer" @click.stop="loadDiskTypes()">
                  Load More {{ diskTypeInfo.loading ? '(Loading...)' : '' }}
                </div>
              </template>
            </KComboBox>
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
            <!-- <string-form
              v-model.trim="form.options['network']"
              label="Network"
              :desc="desc.options['network']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['network']"
              label="Network"
              :desc="desc.options['network']"
              :disabled="readonly"
              :loading="networkInfo.loading"
              :options="networkInfo.data"
              clearable
              @change="networkChange($event)"
            >
              <template #default="{ option }">
                <div>
                  <div>{{ option.label }}</div>
                  <div class="text-sm text-gray-500">{{ option.raw.description }}</div>
                </div>
              </template>
              <template #footer>
                <div v-if="networkInfo.nextPageToken" class="text-center cursor-pointer" @click.stop="loadNetworks()">
                  Load More {{ networkInfo.loading ? '(Loading...)' : '' }}
                </div>
              </template>
            </KComboBox>
            <!-- <string-form
              v-model.trim="form.options['subnetwork']"
              label="Subnetwork"
              :desc="desc.options['subnetwork']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['subnetwork']"
              label="Subnetwork"
              :desc="desc.options['subnetwork']"
              :disabled="readonly"
              :loading="networkInfo.loading"
              :options="subnetworks"
              clearable
            ></KComboBox>
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
        <template #title>Advanced</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <array-list-form
              ref="tags"
              :init-value="form.options.tags"
              :desc="desc.options['tags']"
              :readonly="readonly"
              label="Tags"
              placeholder="e.g. foo=bar"
              action-label="Add Tag"
            ></array-list-form>
          </div>
          <div class="mt-10px grid grid-cols-1 sm:grid-cols-2 gap-10px">
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
          ></UserDataForm>
        </template>
      </form-group>
    </k-tab-pane>
    <k-tab-pane label="K3s Cluster Options" name="k3s" :error="k3sOptionsErrors.length > 0">
      <k3s-options-form
        :visible="acitiveTab === 'k3s'"
        :init-value="form"
        :desc="desc"
        :readonly="readonly"
        @errors="handleK3sErrors"
      ></k3s-options-form>
    </k-tab-pane>
    <k-tab-pane label="Add-on Options" name="additional">
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
import { ref, computed, watch, reactive, inject } from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import UserDataForm from '../baseForm/UserDataForm.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import ArrayListForm from '../baseForm/ArrayListForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import { Base64 } from 'js-base64'
import useFormManage from '@/composables/useFormManage.js'
import useFormRegist from '@/composables/useFormRegist.js'
import CredentialModal from '../providerForm/credentials/CredentialModal.vue'
import useModal from '@/composables/useModal.js'
import useGoogleSdk from './hooks/useGoogleSdk.js'
import GoogleImagesSearchModalVue from './components/GoogleImagesSearchModal.vue'

const needDecodeOptionKeys = ['startup-script-content']

const props = defineProps({
  desc: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  initValue: {
    type: Object,
    required: true
  }
})
const form = reactive({
  config: {},
  options: {}
})
// decode options
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options } = cloneDeep(props.initValue))
    needDecodeOptionKeys.forEach((k) => {
      const v = form.options[k]
      if (v) {
        form.options[k] = Base64.decode(v)
      }
    })
  },
  { immediate: true }
)
const tabPosition = inject('tab-position', 'left')
const { getForm: getSubform, validate: validateSubForm } = useFormManage()
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
const readonlyOption = computed(() => {
  return { readOnly: props.readonly }
})

const credentialError = computed(() => {
  const deps = [form.options['service-account'], form.options['service-account-file'], form.options['project']]

  return deps.some((item) => !item)
})

const credentialRequired = computed(() => {
  return credential.value ? '' : '"GCE Credential" is required'
})

const projectRequired = computed(() => {
  return form.options['project'] ? '' : '"Project" is required'
})

const updateActiveTab = () => {
  if (!form.options['service-account'] || !form.options['service-account-file'] || !form.options['project']) {
    acitiveTab.value = 'credential'
    return
  }
  acitiveTab.value = 'instance'
}
updateActiveTab()

const tags = ref(null)
const ports = ref(null)
const getForm = () => {
  const f = getSubform(form)
  const tagValues = tags.value.getValue()
  const portValues = ports.value.getValue()
  f.options.tags = tagValues ? tagValues.filter((v) => v) : tagValues
  f.options['open-ports'] = portValues ? portValues.filter((v) => v) : portValues
  needDecodeOptionKeys.forEach((k) => {
    const v = f.options[k]?.trim()
    if (v) {
      f.options[k] = Base64.encode(v)
    }
  })
  return [
    { path: 'config', value: f.config },
    { path: 'options', value: f.options }
  ]
}
const validate = () => {
  return validateSubForm()
}
useFormRegist(getForm, validate)
const k3sOptionsErrors = ref([])
const handleK3sErrors = (e) => {
  k3sOptionsErrors.value = e
}

// google sdk

const {
  credentialInfo,
  keyInfo,
  regionInfo,
  machineTypeInfo,
  diskTypeInfo,
  networkInfo,
  fetchCredentials,
  imageInfo,
  fetchMachineTypes,
  validateKeys,
  fetchDiskTypes,
  fetchNetworks,
  resetAll,
  resetMachineTypeInfo,
  resetDiskTypeInfo,
  fetchImages
} = useGoogleSdk()

const credential = ref('')
const secret = computed(() => {
  const d = credentialInfo.data
  if (d.length === 1) {
    return d[0]
  }
  return d.find((item) => item.secrets['service-account'] === credential.value)
})
const validateCredentials = () => {
  validateKeys(secret.value?.id, form.options['project'])
}
watch(
  secret,
  (s) => {
    if (s) {
      form.options['service-account'] = s.secrets['service-account']
      form.options['service-account-file'] = s.secrets['service-account-file']
    }
  },
  { immediate: true }
)
watch(
  [() => form.options['service-account'], () => form.options['service-account-file']],
  ([s]) => {
    if (s) {
      credential.value = s
    }
  },
  { immediate: true }
)
watch(
  [secret, acitiveTab, () => props.readonly, () => props.initValue],
  ([s, tab, readonly], [oldTab]) => {
    if (
      readonly === false &&
      (!oldTab || tab !== 'credential') &&
      (keyInfo.credentialId !== s?.id || keyInfo.project !== form.options['project'])
    ) {
      validateCredentials()
    }
  },
  { immediate: true }
)
watch(
  () => keyInfo.valid,
  (valid) => {
    if (valid) {
      const zone = form.options.zone
      if (zone) {
        fetchMachineTypes(zone)
        fetchDiskTypes(zone)
      }
      fetchNetworks()
      return
    }
    resetAll()
  }
)
const { show } = useModal(CredentialModal)
const showCredentialModal = () => {
  show({
    desc: props.desc,
    provider: 'google',
    initValue: secret.value,
    mode: secret.value ? 'edit' : 'create',
    done() {
      fetchCredentials()
    }
  })
}
const errors = computed(() => {
  return [...new Set([credentialInfo.error, machineTypeInfo.error, diskTypeInfo.error, networkInfo.error])].filter(
    (e) => e
  )
})

const zones = computed(() => {
  const r = form.options.region
  if (!r) {
    return []
  }
  return (
    regionInfo.data
      .find((item) => item.value === r)
      ?.raw?.zones?.map((link) => link.slice(link.lastIndexOf('/') + 1)) ?? []
  )
})

const subnetworks = computed(() => {
  const network = form.options['network']
  const region = form.options.region
  const f = `/regions/${region}`
  if (!region || !network) {
    return []
  }
  return (
    networkInfo.data
      .find((n) => n.value === network)
      ?.raw?.subnetworks?.filter((s) => s.includes(f))
      ?.map((s) => s.slice(s.lastIndexOf('/') + 1)) ?? []
  )
})

const reginChange = () => {
  if (!keyInfo.valid) {
    return
  }
  form.options.zone = ''
}
const zoneChange = (zone) => {
  if (!keyInfo.valid) {
    return
  }
  form.options['machine-type'] = ''
  form.options['disk-type'] = ''
  if (zone) {
    fetchMachineTypes(zone)
    fetchDiskTypes(zone)
    return
  }
  resetMachineTypeInfo()
  resetDiskTypeInfo()
}

const networkChange = () => {
  form.options['subnetwork'] = ''
}

const loadMachineTypes = () => {
  if (machineTypeInfo.loading) {
    return
  }
  fetchMachineTypes(form.options.zone, machineTypeInfo.nextPageToken)
}

const loadDiskTypes = () => {
  if (diskTypeInfo.loading) {
    return
  }
  fetchDiskTypes(form.options.zone, diskTypeInfo.nextPageToken)
}

const loadNetworks = () => {
  if (networkInfo.loading) {
    return
  }
  fetchNetworks(networkInfo.nextPageToken)
}
const { show: showSearchImageModal } = useModal(GoogleImagesSearchModalVue)
</script>
