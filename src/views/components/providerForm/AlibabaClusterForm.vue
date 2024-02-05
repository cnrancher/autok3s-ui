<template>
  <k-alert v-if="keyInfo.valid === true && !keyInfo.error" type="success" title="Credentails are valid"></k-alert>
  <k-alert v-else-if="keyInfo.valid === false && keyInfo.error" type="error" :title="keyInfo.error"></k-alert>
  <KAlert v-for="e in errors" :key="e" type="error" :title="e"></KAlert>
  <k-tabs v-model="acitiveTab" :tab-position="tabPosition">
    <k-tab-pane label="Credential Options" name="credential" :error="credentialError">
      <form-group>
        <template #title>Credential Options</template>
        <template #default>
          <CredentialSelectForm
            v-model="credentialValue"
            class="mb-10px"
            provider="alibaba"
            required
            label="Alibaba Credential"
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
            <!-- <string-form v-model.trim="form.options.region" label="Region" :desc="desc.options.region"
              :readonly="readonly" /> -->
            <KComboBox
              v-model="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :disabled="readonly"
              :loading="regionInfo.loading"
              :options="regionInfo.data"
              clearable
              @change="regionChange"
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
              @change="zoneChange"
            ></KComboBox>
            <!-- <string-form v-model.trim="form.options['instance-type']" label="Instance Type"
              :desc="desc.options['instance-type']" :readonly="readonly" /> -->
            <KComboBox
              v-model="form.options['instance-type']"
              label="Machine Type"
              :desc="desc.options['instance-type']"
              :disabled="readonly"
              :options="instanceTypeOptions"
              search-field="value"
              clearable
              searchable
            >
              <template #default="{ option: v, query }">
                <template v-if="query">
                  <div class="flex">
                    {{ v.value.slice(0, v.matchedStart) }}
                    <span class="text-$info">{{ v.value.slice(v.matchedStart, v.matchedStart + v.matchedLen) }}</span>
                    {{ v.value.slice(v.matchedStart + v.matchedLen) }}
                  </div>
                  <div class="flex gap-2 text-sm text-gray-500">
                    <div>Family: {{ v.raw.InstanceTypeFamily }}</div>
                    <div>{{ v.raw.CpuCoreCount }} CPU</div>
                    <div>{{ v.raw.MemorySize }} GiB Memory</div>
                  </div>
                </template>
                <template v-else>
                  <div>
                    {{ v.value }}
                  </div>
                  <div class="flex gap-2 text-sm text-gray-500">
                    <div>Family: {{ v.raw.InstanceTypeFamily }}</div>
                    <div>{{ v.raw.CpuCoreCount }} CPU</div>
                    <div>{{ v.raw.MemorySize }} GiB Memory</div>
                  </div>
                </template>
              </template>
            </KComboBox>
            <string-form
              v-model.trim="form.options['image']"
              label="Image"
              :desc="desc.options['image']"
              :readonly="readonly"
              :mask-value="selectedImageName"
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
                        updateImageDetail(cloneDeep(e))
                        const size = e.Size
                        if (size) {
                          form.options['disk-size'] = `${size}`
                        }
                      }
                    })
                  "
                ></KIcon>
              </template>
            </string-form>
            <!-- <string-form v-model.trim="form.options['disk-category']" label="Disk Category"
              :desc="desc.options['disk-category']" :readonly="readonly" /> -->
            <KComboBox
              v-model="form.options['disk-category']"
              label="Disk Category"
              :desc="desc.options['disk-category']"
              :disabled="readonly"
              :options="diskCategories"
              clearable
            ></KComboBox>
            <string-form
              v-model.trim="form.options['disk-size']"
              label="Disk Size"
              :desc="desc.options['disk-size']"
              :readonly="readonly"
            />
            <AlibabaSpotInstanceVue :init-value="form" :desc="desc" :readonly="readonly"></AlibabaSpotInstanceVue>
          </div>
        </template>
      </form-group>
      <hr class="section-divider" />
      <form-group :closable="true">
        <template #title>Network</template>
        <template #default>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
            <KComboBox
              v-if="!readonly"
              v-model="vpc"
              label="VPC"
              :disabled="readonly"
              :loading="vpcInfo.loading"
              :options="vpcInfo.data"
              clearable
              searchable
              @change="vpcChange"
            >
              <template #footer>
                <div v-if="hasMoreVpcs" class="text-center cursor-pointer" @click.stop="loadVpcs()">
                  Load More {{ vpcInfo.loading ? '(Loading ...)' : '' }}
                </div>
              </template>
            </KComboBox>
            <!-- <string-form v-model.trim="form.options['v-switch']" label="V-Switch" :desc="desc.options['v-switch']"
              :readonly="readonly" /> -->
            <KComboBox
              v-model="form.options['v-switch']"
              label="V-Switch"
              :disabled="readonly"
              :loading="vSwitchInfo.loading"
              :options="vSwitchInfo.data"
              :desc="desc.options['v-switch']"
              clearable
              searchable
            >
              <template #footer>
                <div v-if="hasMoreVSwitches" class="text-center cursor-pointer" @click.stop="loadVSwitches()">
                  Load More {{ vSwitchInfo.loading ? '(Loading ...)' : '' }}
                </div>
              </template>
            </KComboBox>
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
              :disabled="readonly"
              :loading="securityGroupInfo.loading"
              :options="securityGroupInfo.data"
              :desc="desc.options['security-group']"
              clearable
              searchable
            >
              <template #footer>
                <div v-if="hasMoreSecurityGroups" class="text-center cursor-pointer" @click.stop="loadSecurityGroups()">
                  Load More {{ securityGroupInfo.loading ? '(Loading ...)' : '' }}
                </div>
              </template>
            </KComboBox>
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
              v-model.trim="form.options['key-pair']"
              label="Key Pair"
              :desc="desc.options['key-pair']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['key-pair']"
              label="Key Pair"
              :desc="desc.options['key-pair']"
              :disabled="readonly"
              :loading="keyPairInfo.loading"
              :options="keyPairInfo.data"
              clearable
              searchable
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
          <ssh-private-form :init-value="form" :desc="desc" :readonly="readonly"></ssh-private-form>
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
        <boolean-form
          v-model="dashboardUI"
          label="UI"
          :desc="desc.config['enable'] || desc.config['ui']"
          :readonly="readonly"
        />
        <!-- <k-select
          v-model="uiOptions"
          :desc="desc.config['enable']"
          label="UI"
          :disabled="readonly"
          placeholder="Disable"
          multiple
        >
          <k-option value="explorer" label="explorer"></k-option>
        </k-select> -->
        <boolean-form
          v-model="form.options['cloud-controller-manager']"
          label="Cloud Controller Manager"
          :desc="desc.options['cloud-controller-manager']"
          :readonly="readonly"
        />
        <!-- <boolean-form
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
        ></string-form> -->
        <div class="col-span-1 sm:col-span-2">
          <AddonForm
            ref="addons"
            :readonly="readonly"
            :init-values="form.config.values"
            :init-addons="form.config.enable"
            :visible="acitiveTab === 'additional'"
          ></AddonForm>
        </div>
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
import useModal from '@/composables/useModal.js'
import AlibabaImageSearchModal from './components/AlibabaImageSearchModal/index.vue'
import CredentialSelectForm from '@/views/components/baseForm/CredentialSelectForm.vue'
import AddonForm from '../baseForm/AddonsForm.vue'

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
  provider: '',
  config: {},
  options: {}
})
// decode options
watch(
  () => props.initValue,
  () => {
    ;({ config: form.config, options: form.options, provider: form.provider } = cloneDeep(props.initValue))
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
const dashboardUI = ref(false)
const readonlyOption = computed(() => {
  return { readOnly: props.readonly }
})

const credentialError = computed(() => {
  const deps = [form.options['access-key'], form.options['access-secret'], keyInfo.valid]
  const loading = keyInfo.loading
  if (loading) {
    return false
  }
  return deps.some((item) => !item)
})

const updateActiveTab = () => {
  if (!form.options['access-key'] || !form.options['access-secret']) {
    acitiveTab.value = 'credential'
    return
  }
  acitiveTab.value = 'instance'
}
const credentialValue = computed({
  get() {
    return {
      'access-key': form.options['access-key'],
      'access-secret': form.options['access-secret']
    }
  },
  set(v) {
    form.options['access-key'] = v['access-key']
    form.options['access-secret'] = v['access-secret']
  }
})
updateActiveTab()

const tags = ref(null)
const addons = ref(null)
const getForm = () => {
  const f = getSubform(form)
  const t = tags.value.getValue()
  const { enable, values } = addons.value.getForm()
  f.options.tags = t ? t.filter((v) => v) : t
  f.config.enable = enable
  f.config.values = values
  if (dashboardUI.value) {
    f.config.enable.push('explorer')
  }
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
  fetchImages,
  fetchImageById,
  fetchKeyPairs,
  updateImageDetail,
  fetchAllInstanceTypes,
  imageInfo,
  imageDetail,
  keyInfo,
  regionInfo,
  zoneInfo,
  vpcInfo,
  vSwitchInfo,
  securityGroupInfo,
  keyPairInfo,
  instanceTypeInfo
} = useAlibabaSdk()
const validateCredentials = () => {
  validateKeys(form.options['access-key'], form.options['access-secret'])
}
const { showLoading, hideLoading } = inject(
  'formLoading',
  () => ({
    showLoading() {},
    hideLoading() {}
  }),
  true
)
const { show: showSearchImageModal } = useModal(AlibabaImageSearchModal)
const typeSeries = ref('')
const vpc = ref('')
const errors = computed(() => {
  return [...new Set([zoneInfo.error, vpcInfo.error, vSwitchInfo.error])].filter((e) => e)
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
const hasMoreSecurityGroups = computed(() => {
  const pageSize = securityGroupInfo.pageSize
  const totalCount = securityGroupInfo.totalCount
  const pageNumber = securityGroupInfo.pageNumber
  if (pageSize === 0 || totalCount === 0) {
    return false
  }
  const totalPage = Math.ceil(totalCount / pageSize)
  return pageNumber > totalPage
})
const instanceTypeOptions = computed(() => {
  const arch = imageDetail.data?.Architecture
  if (arch) {
    const a = arch.toUpperCase()
    return instanceTypeInfo.data
      .filter((item) => a.startsWith(item.CpuArchitecture))
      .map((item) => ({
        label: `${item.InstanceTypeId} (CPU: ${item.CpuCoreCount}, Memory: ${item.MemorySize} GiB)`,
        value: item.InstanceTypeId,
        raw: item
      }))
  }

  return instanceTypeInfo.data.map((item) => ({
    label: `${item.InstanceTypeId} (CPU: ${item.CpuCoreCount}, Memory: ${item.MemorySize} GiB)`,
    value: item.InstanceTypeId,
    raw: item
  }))
})

// const instanceTypes = computed(() => {
//   const zone = form.options.zone
//   if (!zone) {
//     return []
//   }

//   return (
//     zoneInfo.data
//       .find((z) => z.value === zone)
//       ?.raw?.AvailableInstanceTypes?.InstanceTypes?.map((t) => ({ label: t, value: t })) ?? []
//   )
// })

// const instanceTypeOptions = computed(() => {
//   const s = typeSeries.value
//   if (!s) {
//     return instanceTypes.value
//   }

//   return instanceTypes.value.filter((t) => t.value.substring(0, t.value.lastIndexOf('.')) === s)
// })

// const instanceTypeSeries = computed(() => {
//   const types = instanceTypes.value
//     .map((t) => t.value.substring(0, t.value.lastIndexOf('.')))
//     .reduce((t, c) => {
//       t.add(c)
//       return t
//     }, new Set())
//   return [...types]
// })

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

const loadSecurityGroups = () => {
  const region = form.options.region
  const v = vpc.value
  if (!region || !v) {
    return
  }
  fetchSecurityGroups(region, v, securityGroupInfo.pageNumber + 1)
}

const diskCategories = computed(() => {
  const zone = form.options.zone
  if (!zone) {
    return []
  }
  return (
    zoneInfo.data
      .find((z) => z.value === zone)
      ?.raw?.AvailableDiskCategories?.DiskCategories?.map((t) => ({ label: t, value: t })) ?? []
  )
})

// const instanceTypeChange = (t) => {
//   resetImageInfo()
// }

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
  fetchKeyPairs(region)
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

watch(
  [acitiveTab, () => props.readonly, () => props.initValue],
  ([tab, readonly, initValue], [oldTab]) => {
    if (
      readonly === false &&
      (!oldTab || tab !== 'credential') &&
      (keyInfo.accessKey !== form.options['access-key'] || keyInfo.accessSecret !== form.options['access-secret'])
    ) {
      validateCredentials()
    }
    if (initValue?.config?.enable) {
      dashboardUI.value = initValue?.config?.enable?.findIndex((item) => item === 'explorer') !== -1
    } else if (initValue.config?.ui) {
      dashboardUI.value = true
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
      const v = vpc.value
      fetchAllInstanceTypes()
      if (region) {
        fetchZones(region)
        fetchVpcs(region)
        fetchKeyPairs(region)
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
  }
)

watch(
  () => vpcInfo.data,
  (vpcs) => {
    const vSwitchId = form.options['v-switch']

    if (vSwitchId) {
      const v = vpcs.find((v) => v.raw.VSwitchIds?.VSwitchId?.includes(vSwitchId))
      if (v && !vpc.value) {
        vpc.value = v.VpcId
      }
    }
  }
)
watch([() => keyInfo.valid, () => form.options['image']], ([valid, imageId]) => {
  if (valid && imageId !== imageDetail.data?.ImageId) {
    fetchImageById(form.options.region, form.options['image'])
  }
})
const selectedImageName = computed(() => {
  const imageId = form.options['image']
  const image = imageDetail.data
  if (imageId === image?.ImageId) {
    return image?.OSNameEn ?? image?.OSName
  }
  return imageId
})
</script>
