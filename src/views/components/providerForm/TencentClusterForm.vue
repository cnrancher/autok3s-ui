<template>
  <KAlert v-if="keyInfo.valid === true && !keyInfo.error" type="success" title="Credentails are valid" />
  <KAlert v-else-if="keyInfo.valid === false && keyInfo.error" type="error" :title="keyInfo.error" />
  <KAlert v-for="e in errors" :key="e" type="error" :title="e"></KAlert>
  <k-tabs v-model="acitiveTab" :tab-position="tabPosition">
    <k-tab-pane label="Credential Options" name="credential" :error="credentialError">
      <form-group>
        <template #title>Credential Options</template>
        <template #default>
          <CredentialSelectForm
            v-model="credentialValue"
            provider="tencent"
            required
            label="Tencent Credential"
            :disabled="readonly"
            :desc="desc"
          />
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
            <!-- <string-form
              v-model.trim="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :disabled="readonly"
              :loading="regionInfo.loading"
              :options="regionInfo.data"
              clearable
              @change="regionChange($event)"
            ></KComboBox>
            <!-- <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" :readonly="readonly" /> -->
            <KComboBox
              v-model="form.options.zone"
              label="Zone"
              :desc="desc.options.zone"
              :disabled="readonly"
              :loading="zoneInfo.loading"
              :options="zoneInfo.data"
              clearable
              @change="zoneChange($event)"
            ></KComboBox>
            <!-- <string-form
              v-model.trim="form.options['instance-type']"
              label="Instance Type"
              :desc="desc.options['instance-type']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['instance-type']"
              label="Machine Type"
              :desc="desc.options['instance-type']"
              :disabled="readonly"
              :loading="instanceTypeInfo.loading"
              :options="instanceTypeOptions"
              clearable
            >
              <template #header>
                <div class="p-1 bg-white" @click.stop="toggleSeries">
                  <div class="cursor-pointer flex items-center justify-between">
                    <div>Filter: {{ typeSeries ? typeSeries : 'All Instance Type Series' }}</div>
                    <k-icon type="arrow-right" :direction="showSeriesSelection ? 'down' : ''"></k-icon>
                  </div>
                  <div v-show="showSeriesSelection" class="flex gap-2 flex-wrap p-1">
                    <div
                      :class="['cursor-pointer', typeSeries === '' ? 'bg-warm-gray-400' : '']"
                      class="p-1"
                      @click="chooseSeries('')"
                    >
                      All Instance Type Series
                    </div>
                    <div
                      v-for="s in instanceTypeSeries"
                      :key="s"
                      :class="[typeSeries && typeSeries === s ? 'bg-warm-gray-400' : '']"
                      class="cursor-pointer p-1"
                      @click="chooseSeries(s)"
                    >
                      {{ s }}
                    </div>
                  </div>
                  <hr />
                </div>
              </template>
            </KComboBox>
            <string-form
              v-model.trim="form.options['image']"
              label="Image"
              :desc="desc.options['image']"
              :readonly="readonly"
            >
              <template v-if="keyInfo.valid" #suffix>
                <KIcon
                  type="search"
                  :size="18"
                  class="cursor-pointer"
                  @click="
                    showSearchImageModal({
                      region: form.options.region,
                      instanceType: form.options['instance-type'],
                      imageInfo,
                      fetchImages,
                      onSelect: (e) => {
                        form.options['image'] = e.ImageId
                      }
                    })
                  "
                ></KIcon>
              </template>
            </string-form>
            <!-- <string-form
              v-model.trim="form.options['disk-category']"
              label="Disk Category"
              :desc="desc.options['disk-category']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['disk-category']"
              label="Disk Category"
              :desc="desc.options['disk-category']"
              :disabled="readonly"
              :options="diskTypes"
              clearable
            ></KComboBox>
            <string-form
              v-model.trim="form.options['disk-size']"
              label="Disk Size"
              :desc="desc.options['disk-size']"
              :readonly="readonly"
            />
            <boolean-form
              v-model="form.options['spot']"
              label="Spot"
              :desc="desc.options['spot']"
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
              v-model.trim="form.options['vpc']"
              label="VPC"
              :desc="desc.options['vpc']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['vpc']"
              label="VPC"
              :desc="desc.options['vpc']"
              :disabled="readonly"
              :loading="vpcInfo.loading"
              :options="vpcInfo.data"
              clearable
              @change="vpcChange($event)"
            ></KComboBox>
            <!-- <string-form
              v-model.trim="form.options['subnet']"
              label="Subnet"
              :desc="desc.options['subnet']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['subnet']"
              label="Subnet"
              :desc="desc.options['subnet']"
              :disabled="readonly"
              :loading="subnetInfo.loading"
              :options="subnetInfo.data"
              clearable
            ></KComboBox>
            <string-form
              v-model.trim="form.options['internet-max-bandwidth-out']"
              label="Internet Max Bandwidth Out"
              :desc="desc.options['internet-max-bandwidth-out']"
              :readonly="readonly"
            />
            <!-- <string-form
              v-model.trim="form.options['security-group']"
              label="Security Group"
              :desc="desc.options['security-group']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['security-group']"
              label="Security Group"
              :desc="desc.options['security-group']"
              :disabled="readonly"
              :loading="securityGroupInfo.loading"
              :options="securityGroupInfo.data"
              clearable
            ></KComboBox>
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
            <!-- <string-form
              v-model.trim="form.options['keypair-id']"
              label="Keypair Id"
              :desc="desc.options['keypair-id']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['keypair-id']"
              label="Keypair Id"
              :desc="desc.options['keypair-id']"
              :disabled="readonly"
              :loading="keyPairInfo.loading"
              :options="keyPairInfo.data"
              clearable
            ></KComboBox>
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
      <form-group v-model="advanceConfigVisible" :closable="true">
        <template #title>Advanced</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <cluster-tags-form
              ref="tags"
              :init-value="form.options.tags"
              :desc="desc.options['tags']"
              :readonly="readonly"
              label="Tags"
              placeholder="e.g. foo=bar"
              action-label="Add Tag"
            ></cluster-tags-form>
          </div>
          <UserDataForm
            v-model="form.options['user-data-content']"
            label="User Data"
            :desc="desc.options['user-data-content']"
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
        </k-select>
        <boolean-form
          v-model="form.options['cloud-controller-manager']"
          label="Cloud Controller Manager"
          :desc="desc.options['cloud-controller-manager']"
          :readonly="readonly"
        />
        <string-form
          v-show="form.options['cloud-controller-manager']"
          v-model.trim="form.options['router']"
          label="Router"
          :desc="desc.options['router']"
          :readonly="readonly"
        />
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
import ClusterTagsForm from '../baseForm/ArrayListForm.vue'
import UserDataForm from '../baseForm/UserDataForm.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import { Base64 } from 'js-base64'
import useFormManage from '@/composables/useFormManage.js'
import useFormRegist from '@/composables/useFormRegist.js'
import useTencentSdk from './hooks/useTencentSdk.js'
import TencentImageSearchModal from './components/TencentImageSearchModal.vue'
import useModal from '@/composables/useModal.js'
import CredentialSelectForm from '@/views/components/baseForm/CredentialSelectForm.vue'

const needDecodeOptionKeys = ['user-data-content']

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
const tabPosition = inject('tab-position', 'left')
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
const { getForm: getSubform, validate: validateSubForm } = useFormManage()
const advanceConfigVisible = ref(false)
const acitiveTab = ref('instance')
const updateActiveTab = () => {
  if (!form.options['secret-id'] || !form.options['secret-key']) {
    acitiveTab.value = 'credential'
    return
  }
  acitiveTab.value = 'instance'
}
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
  const deps = [form.options['secret-id'], form.options['secret-key'], keyInfo.valid]
  const loading = keyInfo.loading
  if (loading) {
    return false
  }
  return deps.some((item) => !item)
})

const credentialValue = computed({
  get() {
    return {
      'secret-id': form.options['secret-id'],
      'secret-key': form.options['secret-key']
    }
  },
  set(v) {
    form.options['secret-id'] = v['secret-id']
    form.options['secret-key'] = v['secret-key']
  }
})

updateActiveTab()

const tags = ref(null)
const getForm = () => {
  const f = getSubform(form)
  const values = tags.value.getValue()
  f.options.tags = values ? values.filter((v) => v) : values
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

// use tencent sdk
const {
  validateKeys,
  fetchZones,
  fetchInstanceTypes,
  fetchVpcs,
  fetchSubnets,
  fetchSecrityGroups,
  fetchKeyPairs,
  fetchImages,
  restAll,
  resetZoneInfo,
  resetInstanceTypeInfo,
  resetVpcInfo,
  resetSubnetInfo,
  resetSecurityGroupInfo,
  resetKeyPairInfo,
  resetImageInfo,
  keyInfo,
  regionInfo,
  zoneInfo,
  instanceTypeInfo,
  diskTypes,
  vpcInfo,
  subnetInfo,
  securityGroupInfo,
  keyPairInfo,
  imageInfo,
  whitelistInfo
} = useTencentSdk()
const validateCredentials = () => {
  validateKeys(form.options['secret-id'], form.options['secret-key'])
}
const { show: showSearchImageModal } = useModal(TencentImageSearchModal)
const typeSeries = ref('')
const showSeriesSelection = ref(false)
const toggleSeries = () => {
  showSeriesSelection.value = !showSeriesSelection.value
}
const chooseSeries = (s) => {
  typeSeries.value = s
  // loadInstanceTypes()
}

const errors = computed(() => {
  return [
    ...new Set([
      zoneInfo.error,
      instanceTypeInfo.error,
      vpcInfo.error,
      subnetInfo.error,
      securityGroupInfo.error,
      keyPairInfo.error,
      whitelistInfo.error
    ])
  ].filter((e) => e)
})

const instanceTypeSeries = computed(() => {
  const groups = instanceTypeInfo.data.reduce((t, c) => {
    const g = c.raw.InstanceFamily
    if (!t.includes(g)) {
      t.push(g)
    }
    return t
  }, [])
  groups.sort()
  return groups
})
const enCollator = new Intl.Collator('en')
const instanceTypeOptions = computed(() => {
  const series = typeSeries.value

  if (!series) {
    const options = [...instanceTypeInfo.data]
    options.sort((a, b) => enCollator.compare(a.raw.InstanceFamily, b.raw.InstanceFamily))
    return options
  }
  return instanceTypeInfo.data.filter((t) => t.raw.InstanceFamily === series)
})

const regionChange = (r) => {
  if (!keyInfo.valid) {
    return
  }

  form.options.zone = ''
  form.options.vpc = ''
  form.options['instance-type'] = ''
  form.options['subnet'] = ''
  form.options['security-group'] = ''
  form.options['keypair-id'] = ''
  if (r) {
    fetchZones(r)
    fetchVpcs(r)
    fetchSecrityGroups(r)
    fetchKeyPairs(r)
  } else {
    resetZoneInfo()
    resetVpcInfo()
    resetSecurityGroupInfo()
    resetKeyPairInfo()
  }
  resetInstanceTypeInfo()
  resetSubnetInfo()
  resetImageInfo()
}
const zoneChange = (z) => {
  if (!keyInfo.valid) {
    return
  }
  const r = form.options.region
  form.options['instance-type'] = ''
  form.options['subnet'] = ''
  if (r && z) {
    fetchInstanceTypes(r, z)
  } else {
    resetInstanceTypeInfo()
  }
  resetSubnetInfo()
}

const vpcChange = (v) => {
  if (!keyInfo.valid) {
    return
  }
  form.options['subnet'] = ''
  const r = form.options.region
  const z = form.options.zone
  if (r && z && v) {
    fetchSubnets(r, z, v)
  } else {
    resetSubnetInfo()
  }
}

watch(
  [acitiveTab, () => props.readonly, () => props.initValue],
  ([tab, readonly], [oldTab]) => {
    if (
      readonly === false &&
      (!oldTab || tab !== 'credential') &&
      (keyInfo.secretId !== form.options['secret-id'] || keyInfo.secretKey !== form.options['secret-key'])
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
      const region = form.options.region
      const zone = form.options.zone
      const vpc = form.options.vpc
      if (region) {
        fetchZones(region)
        fetchVpcs(region)
        fetchSecrityGroups(region)
        fetchKeyPairs(region)
      }
      if (region && zone) {
        fetchInstanceTypes(region, zone)
      }
      if (region && zone && vpc) {
        fetchSubnets(region, zone, vpc)
      }
    } else {
      restAll()
    }
  }
)
</script>
