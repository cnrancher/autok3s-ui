<template>
  <k-alert v-if="keyInfo.valid === true && !keyInfo.error" type="success" title="Credentails are valid"></k-alert>
  <k-alert v-else-if="keyInfo.valid === false && keyInfo.error" type="error" :title="keyInfo.error"></k-alert>
  <KAlert v-for="e in errors" :key="e" type="error" :title="e"></KAlert>
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
             :readonly="readonly"></k-password-input>
            <k-password-input v-model="form.options['access-secret']" label="Access Secret"
              :desc="desc.options['access-secret']" :readonly="readonly"></k-password-input>
          </div>
        </template>
      </form-group>
      <div v-if="!readonly" class="mt-4 text-center">
        <KButton class="role-secondary" :disabled="keyInfo.loading" @click="validateCredentials">
          Validate Credentails
        </KButton>
      </div>
    </k-tab-pane>
    <k-tab-pane label="Instance Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <!-- <string-form v-model.trim="form.options.region" label="Region" :desc="desc.options.region"
              :readonly="readonly" /> -->
            <KComboBox v-model="form.options.region" label="Region" :desc="desc.options.region" :disabled="readonly"
              :loading="regionInfo.loading" :options="regionInfo.data" clearable @change="regionChange">
            </KComboBox>
            <!-- <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" :readonly="readonly" /> -->
            <KComboBox v-model="form.options.zone" label="Zone" :desc="desc.options.zone" :disabled="readonly"
              :loading="zoneInfo.loading" :options="zoneInfo.data" clearable @change="zoneChange">
            </KComboBox>
            <!-- <string-form v-model.trim="form.options['instance-type']" label="Instance Type"
              :desc="desc.options['instance-type']" :readonly="readonly" /> -->
            <KComboBox v-model="form.options['instance-type']" label="Instance Type"
              :desc="desc.options['instance-type']" :disabled="readonly" :options="instanceTypeOptions" clearable>
              <template #header>
                <div class="p-1 sticky top-0 bg-white" @click.stop="toggleSeries">
                  <div class="cursor-pointer flex items-center justify-between">
                    <div>Filter: {{ typeSeries ? typeSeries : 'All Instance Type Families' }}</div>
                    <k-icon type="arrow-right" :direction="showSeriesSelection ? 'down' : ''"></k-icon>
                  </div>
                  <div v-show="showSeriesSelection" class="flex gap-2 flex-wrap p-1">
                    <div :class="['cursor-pointer', typeSeries === '' ? 'bg-warm-gray-400' : '']" class="p-1"
                      @click="chooseSeries('')">
                      All Instance Type Families
                    </div>
                    <div v-for="s in instanceTypeSeries" :key="s"
                      :class="[typeSeries && typeSeries === s ? 'bg-warm-gray-400' : '']" class="cursor-pointer p-1"
                      @click="chooseSeries(s)">
                      {{ s }}
                    </div>
                  </div>
                  <hr />
                </div>
              </template>
            </KComboBox>
            <string-form v-model.trim="form.options['image']" label="Image" :desc="desc.options['image']"
              :readonly="readonly" />
            <!-- <string-form v-model.trim="form.options['disk-category']" label="Disk Category"
              :desc="desc.options['disk-category']" :readonly="readonly" /> -->
            <KComboBox v-model="form.options['disk-category']" label="Disk Category"
              :desc="desc.options['disk-category']" :disabled="readonly" :options="diskCategories" clearable>
            </KComboBox>
            <string-form v-model.trim="form.options['disk-size']" label="Disk Size" :desc="desc.options['disk-size']"
              :readonly="readonly" />
            <AlibabaSpotInstanceVue :init-value="form" :desc="desc" :readonly="readonly"></AlibabaSpotInstanceVue>
          </div>
        </template>
      </form-group>
      <hr class="section-divider" />
      <form-group :closable="true">
        <template #title>Network</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <KComboBox v-if="!readonly" v-model="vpc" label="VPC" :disabled="readonly" :loading="vpcInfo.loading"
              :options="vpcInfo.data" clearable @change="vpcChange">
              <template #footer>
                <div v-if="hasMoreVpcs" class="text-center cursor-pointer" @click.stop="loadVpcs()">
                  Load More {{ vpcInfo.loading ? '(Loading ...)' : '' }}
                </div>
              </template>
            </KComboBox>
            <!-- <string-form v-model.trim="form.options['v-switch']" label="V-Switch" :desc="desc.options['v-switch']"
              :readonly="readonly" /> -->
            <KComboBox v-model="form.options['v-switch']" label="V-Switch" :disabled="readonly"
              :loading="vSwitchInfo.loading" :options="vSwitchInfo.data" clearable>
              <template #footer>
                <div v-if="hasMoreVSwitches" class="text-center cursor-pointer" @click.stop="loadVSwitches()">
                  Load More {{ vSwitchInfo.loading ? '(Loading ...)' : '' }}
                </div>
              </template>
            </KComboBox>
            <string-form v-model.trim="form.options['internet-max-bandwidth-out']" label="Internet Max Bandwidth Out"
              :desc="desc.options['internet-max-bandwidth-out']" :readonly="readonly" />
            <string-form v-model.trim="form.options['security-group']" label="Security Group"
              :desc="desc.options['security-group']" :readonly="readonly" />
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
            <string-form v-model.trim="form.options['key-pair']" label="Key Pair" :desc="desc.options['key-pair']"
              :readonly="readonly" />
            <string-form v-model.trim="form.config['ssh-user']" label="SSH User" :desc="desc.config['ssh-user']"
              :readonly="readonly" />
            <string-form v-model.trim="form.config['ssh-port']" label="SSH Port" :desc="desc.config['ssh-port']"
              :readonly="readonly" />
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
        <template #title>Advance</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <cluster-tags-form ref="tags" :init-value="form.options.tags" :desc="desc.options['tags']"
              :readonly="readonly" label="Tags" placeholder="e.g. foo=bar" action-label="Add Tag"></cluster-tags-form>
          </div>
          <UserDataForm v-model="form.options['user-data-content']" label="User Data"
            :desc="desc.options['user-data-content']" :options="readonlyOption" :visible="advanceConfigVisible">
          </UserDataForm>
        </template>
      </form-group>
    </k-tab-pane>
    <k-tab-pane label="K3s Options" name="k3s">
      <k3s-options-form :visible="acitiveTab === 'k3s'" :init-value="form" :desc="desc" :readonly="readonly">
      </k3s-options-form>
    </k-tab-pane>
    <k-tab-pane label="Additional Options" name="additional">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <!-- <boolean-form
          v-model="form.config['ui']"
          label="UI"
          :desc="desc.config['ui']"
          :readonly="readonly"
        /> -->
        <k-select v-model="uiOptions" :desc="desc.config['enable']" label="UI" :disabled="readonly"
          placeholder="Disable" multiple>
          <k-option value="explorer" label="explorer"></k-option>
          <k-option value="dashboard" label="dashboard"></k-option>
        </k-select>
        <boolean-form v-model="form.options['cloud-controller-manager']" label="Cloud Controller Manager"
          :desc="desc.options['cloud-controller-manager']" :readonly="readonly" />
        <boolean-form v-model="form.options['terway']" label="Terway" :desc="desc.options['terway']" true-value="eni"
          false-value="none" :readonly="readonly" />
        <string-form v-show="form.options['terway'] === 'eni'" v-model="form.options['terway-max-pool-size']"
          label="Terway Max Pool Size" type="number" :readonly="readonly"></string-form>
      </div>
    </k-tab-pane>
  </k-tabs>
</template>
<script setup>
import { cloneDeep } from '@/utils'
import { ref, computed, watch, reactive, inject, onBeforeUnmount } from 'vue'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import UserDataForm from '../baseForm/UserDataForm.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import ClusterTagsForm from '../baseForm/ArrayListForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import AlibabaSpotInstanceVue from './components/AlibabaSpotInstance.vue'
import { Base64 } from 'js-base64'
import useFormManage from '@/composables/useFormManage.js'
import useFormRegist from '@/composables/useFormRegist.js'
import useAlibabaSdk from './hooks/useAlibabaSdk.js'

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
// decode options
watch(
  () => props.initValue,
  () => {
    ; ({ config: form.config, options: form.options } = cloneDeep(props.initValue))
    needDecodeOptionKeys.forEach((k) => {
      const v = form.options[k]
      if (v) {
        form.options[k] = Base64.decode(v)
      }
    })
  },
  { immediate: true }
)
const { getForm: getSubform } = useFormManage()
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
useFormRegist(getForm)

// alibaba sdk
const {
  validateKeys,
  resetAll,
  resetVSwitchInfo,
  resetSecurityGroupInfo,
  fetchZones,
  fetchVpcs,
  fetchVSwitches,
  fetchSecurityGroups,
  keyInfo,
  regionInfo,
  zoneInfo,
  vpcInfo,
  vSwitchInfo
} = useAlibabaSdk()
const validateCredentials = () => {
  validateKeys(form.options['access-key'], form.options['access-secret'])
}
const { showLoading, hideLoading } = inject('formLoading', () => ({
  showLoading() {},
  hideLoading() {}
}), true)
const typeSeries = ref('')
const showSeriesSelection = ref(false)
const vpc = ref('')
const errors = computed(() => {
  return [
    ...new Set([
      zoneInfo.error,
      vpcInfo.error,
      vSwitchInfo.error
    ])
  ].filter((e) => e)
})
const loading = computed(() => {
  return keyInfo.loading || zoneInfo.loading || vpcInfo.loading || vSwitchInfo.loading
})
watch(loading, (l) => {
  if (l) {
    showLoading()
    return
  }
  hideLoading()
})
onBeforeUnmount(() => {
 hideLoading() 
})
const hasMoreVpcs = computed(() => {
  const pageSize = vpcInfo.pageSize
  const totalCount = vpcInfo.totalCount
  const pageNumber = vpcInfo.pageNumber
  if (pageSize === 0 || totalCount === 0) {
    return false
  }
  const totalPage = Math.ceil(totalCount / pageSize)
  return pageNumber > totalPage
})
const hasMoreVSwitches = computed(() => {
  const pageSize = vSwitchInfo.pageSize
  const totalCount = vSwitchInfo.totalCount
  const pageNumber = vSwitchInfo.pageNumber
  if (pageSize === 0 || totalCount === 0) {
    return false
  }
  const totalPage = Math.ceil(totalCount / pageSize)
  return pageNumber > totalPage
})

const instanceTypes = computed(() => {
  const zone = form.options.zone
  if (!zone) {
    return []
  }

  return zoneInfo.data.find((z) => z.value === zone)
    ?.raw?.AvailableInstanceTypes?.InstanceTypes
    ?.map((t) => ({ label: t, value: t })) ?? []
})

const instanceTypeOptions = computed(() => {
  const s = typeSeries.value
  if (!s) {
    return instanceTypes.value
  }

  return instanceTypes.value.filter((t) => t.value.substring(0, t.value.lastIndexOf('.')) === s)
})

const instanceTypeSeries = computed(() => {
  const types = instanceTypes.value.map((t) => t.value.substring(0, t.value.lastIndexOf('.'))).reduce((t, c) => {
    t.add(c)
    return t
  }, new Set())
  return [...types]
})

const loadVpcs = () => {
  const region = form.options.region
  if (!region) {
    return
  }
  fetchVpcs(region, vpcInfo.pageNumber + 1)
}
const loadVSwitches = () => {
  const v = vpc.value
  const zone = form.options.zone
  if (!v || !zone) {
    return
  }
  fetchVSwitches(zone, v, vSwitchInfo.pageNumber + 1)
}
const toggleSeries = () => {
  showSeriesSelection.value = !showSeriesSelection.value
}
const chooseSeries = (s) => {
  typeSeries.value = s
}

const diskCategories = computed(() => {
  const zone = form.options.zone
  if (!zone) {
    return []
  }
  return zoneInfo.data.find((z) => z.value === zone)
    ?.raw?.AvailableDiskCategories?.DiskCategories
    ?.map((t) => ({ label: t, value: t })) ?? []
})

const regionChange = (region) => {
  if (!keyInfo.valid) {
    return
  }
  form.options.zone = ''
  vpc.value = ''
  form.options['instance-type'] = ''
  form.options['disk-category'] = ''
  form.options['v-switch'] = ''
  form.options['security-group'] = ''
  typeSeries.value = ''
  resetAll()
  if (!region) {
    return
  }
  fetchZones(region)
  fetchVpcs(region)
}

const zoneChange = (zone) => {
  if (!keyInfo.valid) {
    return
  }
  const v = vpc.value
  form.options['v-switch'] = ''
  if (zone && v) {
    fetchVSwitches(zone, v)
  } else {
    resetVSwitchInfo()
  }

}

const vpcChange = (v) => {
  if (!keyInfo.valid) {
    return
  }
  const zone = form.options.zone
  const region = form.options.region
  form.options['v-switch'] = ''
  form.options['security-group'] = ''
  if (zone && v) {
    fetchVSwitches(zone, v)
  } else {
    resetVSwitchInfo()
  }
  if (region && v) {
    fetchSecurityGroups(region, v)
  } else {
    resetSecurityGroupInfo()
  }

}

watch([acitiveTab, () => props.readonly, () => props.initValue], ([tab, readonly], [oldTab]) => {
  if (
    readonly === false &&
    (!oldTab || tab !== 'credential') &&
    (keyInfo.accessKeyId !== form.options['access-key'] ||
      keyInfo.secretAccessKey !== form.options['access-secret'])) {
    validateCredentials()
  }

}, { immediate: true })

watch(() => keyInfo.valid, (valid) => {
  if (valid) {
    const region = form.options.region
    const zone = form.options.zone
    const v = vpc.value
    if (region) {
      fetchZones(region)
      fetchVpcs(region)
    }
    if (region && v) {
      fetchSecurityGroups(region, v)
    }
    if (zone && v) {
      fetchVSwitches(zone, v)
    }
    return
  }
  resetAll()
})

watch(() => vpcInfo.data, (vpcs) => {
  const vSwitchId = form.options['v-switch']

  if (vSwitchId) {
    const v = vpcs.find((v) => v.raw.VSwitchIds?.VSwitchId?.includes(vSwitchId))
    if (v && !vpc.value) {
      vpc.value = v.VpcId
    }
  }
})

</script>
