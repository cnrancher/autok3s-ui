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
            provider="aws"
            required
            label="AWS Credential"
            :disabled="readonly"
            :desc="desc"
          />
          <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
            <KSelect
              v-model="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :disabled="readonly"
              @change="reginChange($event)"
            >
              <KOption v-for="r in defaultRegions" :key="r" :value="r" :label="r"></KOption>
            </KSelect>
          </div>
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
          <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
            <string-form v-model.trim="form.options.region" label="Region" :desc="desc.options.region" disabled />
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
              :loading="instanceTypeInfo.loading || imageDetail.loading"
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
                    <div>Family: {{ v.group }}</div>
                    <div>{{ v.vCPU }} vCPU</div>
                    <div>{{ v.memory }} GiB Memory</div>
                  </div>
                </template>
                <template v-else>
                  <div>
                    {{ v.value }}
                  </div>
                  <div class="flex gap-2 text-sm text-gray-500">
                    <div>Family: {{ v.group }}</div>
                    <div>{{ v.vCPU }} vCPU</div>
                    <div>{{ v.memory }} GiB Memory</div>
                  </div>
                </template>
              </template>
            </KComboBox>
            <string-form
              v-model.trim="form.options['ami']"
              label="AMI"
              :desc="desc.options['ami']"
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
                      // volumeType: form.options['volume-type'],
                      imageInfo,
                      fetchImages,
                      onSelect: (e) => {
                        form.options['ami'] = e.ImageId
                        const rdt = upperFirst(e.RootDeviceType)
                        const rootSize = e.BlockDeviceMappings?.[0]?.[rdt]?.VolumeSize
                        const volumeType = e.BlockDeviceMappings?.[0]?.[rdt]?.VolumeType
                        if (rootSize) {
                          form.options['root-size'] = `${rootSize}`
                        }
                        if (volumeType) {
                          form.options['volume-type'] = volumeType
                        }
                        updateImageDetail(cloneDeep(e))
                        // form.options['instance-type'] = ''
                      }
                    })
                  "
                ></KIcon>
              </template>
            </string-form>
            <!-- <string-form
              v-model.trim="form.options['volume-type']"
              label="Volume Type"
              :desc="desc.options['volume-type']"
              :readonly="readonly"
            /> -->
            <KSelect
              v-model="form.options['volume-type']"
              label="Volume Type"
              :desc="desc.options['volume-type']"
              :disabled="readonly"
            >
              <KOption v-for="vt in volumeTypes" :key="vt" :value="vt" :label="vt"></KOption>
            </KSelect>
            <string-form
              v-model.trim="form.options['root-size']"
              label="Root Size"
              :desc="desc.options['root-size']"
              :readonly="readonly"
            >
              <template #suffix>GB</template>
            </string-form>
            <boolean-form
              v-model="form.options['request-spot-instance']"
              label="Request Spot Instance"
              :desc="desc.options['request-spot-instance']"
              :readonly="readonly"
            />
            <string-form
              v-show="form.options['request-spot-instance']"
              v-model.trim="form.options['spot-price']"
              label="Spot Price"
              :desc="desc.options['spot-price']"
              :readonly="readonly"
            />
          </div>
        </template>
      </form-group>
      <hr class="section-divider" />
      <form-group :closable="true">
        <template #title>Network</template>
        <template #default>
          <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
            <!-- <string-form
              v-model.trim="form.options['vpc-id']"
              label="VPC ID"
              :desc="desc.options['vpc-id']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['vpc-id']"
              label="VPC ID"
              placeholder="Select a VPC ..."
              :desc="desc.options['vpc-id']"
              :disabled="readonly"
              :loading="vpcInfo.loading"
              :options="vpcInfo.data"
              clearable
              searchable
              @change="vpcChange($event)"
            >
              <template #default="{ option }">
                <div class="grid grid-cols-[1fr,auto] w-full">
                  <div>
                    {{ option.label }}
                  </div>
                  <div>
                    {{ option.raw.IsDefault ? 'Default' : '' }}
                  </div>
                  <div class="col-span-2 text-sm text-gray-500">
                    {{ option.raw.CidrBlock }}
                  </div>
                </div>
              </template>
              <template #footer>
                <div v-if="vpcInfo.nextToken" class="text-center cursor-pointer" @click.stop="loadVpcs()">
                  Load More {{ vpcInfo.loading ? '(Loading ...)' : '' }}
                </div>
              </template>
            </KComboBox>
            <!-- <string-form
              v-model.trim="form.options['subnet-id']"
              label="Subnet ID"
              :desc="desc.options['subnet-id']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['subnet-id']"
              label="Subnet ID"
              placeholder="Select a subnet ..."
              :desc="desc.options['subnet-id']"
              :disabled="readonly"
              :loading="subnetInfo.loading"
              :options="subnetInfo.data"
              clearable
              searchable
            >
              <template #footer>
                <div v-if="subnetInfo.nextToken" class="text-center cursor-pointer" @click.stop="loadSubnets()">
                  Load More {{ subnetInfo.loading ? '(Loading ...)' : '' }}
                </div>
              </template>
            </KComboBox>
            <!-- <string-form
              v-model.trim="form.options['security-group']"
              label="Security Group"
              :desc="desc.options['security-group']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['security-group']"
              label="Security Group"
              placeholder="Select a security group ..."
              :desc="desc.options['security-group']"
              :disabled="readonly"
              :loading="securityGroupInfo.loading"
              :options="securityGroupInfo.data"
              clearable
              searchable
            >
              <template #footer>
                <div
                  v-if="securityGroupInfo.nextToken"
                  class="text-center cursor-pointer"
                  @click.stop="loadSecurityGroups()"
                >
                  Load More {{ securityGroupInfo.loading ? '(Loading ...)' : '' }}
                </div>
              </template>
            </KComboBox>
          </div>
        </template>
      </form-group>
      <hr class="section-divider" />
      <form-group>
        <template #title>SSH Public</template>
        <template #subtitle>Params used to login to instance via ssh, e.g. key-pair, ssh user, ssh port</template>
        <template #default>
          <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
            <!-- <string-form
              v-model.trim="form.options['keypair-name']"
              label="Keypair Name"
              :desc="desc.options['keypair-name']"
              :readonly="readonly"
            /> -->
            <KComboBox
              v-model="form.options['keypair-name']"
              label="Keypair Name"
              placeholder="Select a key pair ..."
              :desc="desc.options['keypair-name']"
              :disabled="readonly"
              :loading="keyPairInfo.loading"
              :options="keyPairInfo.data"
              clearable
              searchable
            >
              <template #default="{ option: v, query }">
                <template v-if="query">
                  <div class="flex">
                    {{ v.label.slice(0, v.matchedStart) }}
                    <span class="text-$info">{{ v.label.slice(v.matchedStart, v.matchedStart + v.matchedLen) }}</span>
                    {{ v.label.slice(v.matchedStart + v.matchedLen) }}
                  </div>
                  <div class="flex gap-2 text-sm text-gray-500">
                    <div>Type: {{ v.raw.KeyType }}</div>
                  </div>
                </template>
                <template v-else>
                  <div>
                    {{ v.label }}
                  </div>
                  <div class="flex gap-2 text-sm text-gray-500">
                    <div>Type: {{ v.raw.KeyType }}</div>
                  </div>
                </template>
              </template>
            </KComboBox>
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
          <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
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
      <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
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
        /> -->
        <KComboBox
          v-show="form.options['cloud-controller-manager']"
          v-model.trim="form.options['iam-instance-profile-control']"
          label="IAM Instance Profile Control"
          :desc="desc.options['iam-instance-profile-control']"
          :disabled="readonly"
          :loading="instanceProfileInfo.loading"
          :options="instanceProfileInfo.data"
          clearable
        >
          <template #default="{ option }">
            <div>
              <div>
                {{ option.label }}
              </div>
              <div class="col-span-2 text-sm text-gray-500">
                {{ option.raw.Arn }}
              </div>
            </div>
          </template>
          <template #footer>
            <div
              v-if="instanceProfileInfo.isTruncated && instanceProfileInfo.marker"
              class="text-center cursor-pointer"
              @click.stop="loadInstanceProfiles()"
            >
              Load More {{ instanceProfileInfo.loading ? '(Loading ...)' : '' }}
            </div>
          </template>
        </KComboBox>

        <!-- <string-form
          v-show="form.options['cloud-controller-manager']"
          v-model.trim="form.options['iam-instance-profile-worker']"
          label="IAM Instance Profile Worker"
          :desc="desc.options['iam-instance-profile-worker']"
          :readonly="readonly"
        /> -->
        <KComboBox
          v-show="form.options['cloud-controller-manager']"
          v-model.trim="form.options['iam-instance-profile-worker']"
          label="IAM Instance Profile Worker"
          :desc="desc.options['iam-instance-profile-worker']"
          :disabled="readonly"
          :loading="instanceProfileInfo.loading"
          :options="instanceProfileInfo.data"
          clearable
        >
          <template #default="{ option }">
            <div>
              <div>
                {{ option.label }}
              </div>
              <div class="col-span-2 text-sm text-gray-500">
                {{ option.raw.Arn }}
              </div>
            </div>
          </template>
          <template #footer>
            <div
              v-if="instanceProfileInfo.isTruncated && instanceProfileInfo.marker"
              class="text-center cursor-pointer"
              @click.stop="loadInstanceProfiles()"
            >
              Load More {{ instanceProfileInfo.loading ? '(Loading ...)' : '' }}
            </div>
          </template>
        </KComboBox>
        <div class="col-span-1 sm:col-span-2">
          <AddonForm ref="addons" :readonly="readonly" :init-value="form.enable"></AddonForm>
        </div>
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
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import ClusterTagsForm from '../baseForm/ArrayListForm.vue'
import UserDataForm from '../baseForm/UserDataForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import useAwsSdk from './hooks/useAwsSdk.js'
import useModal from '@/composables/useModal.js'
import AwsImagesSearchModalVue from './components/AwsImagesSearchModal/index.vue'
import { Base64 } from 'js-base64'
import useFormManage from '@/composables/useFormManage.js'
import useFormRegist from '@/composables/useFormRegist.js'
import CredentialSelectForm from '@/views/components/baseForm/CredentialSelectForm.vue'
import { upperFirst } from 'lodash-es'
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
  const deps = [form.options['access-key'], form.options['secret-key'], keyInfo.valid]
  const loading = keyInfo.loading
  if (loading) {
    return false
  }
  return deps.some((item) => !item)
})

const updateActiveTab = () => {
  if (!form.options['access-key'] || !form.options['secret-key']) {
    acitiveTab.value = 'credential'
    return
  }
  acitiveTab.value = 'instance'
}
const credentialValue = computed({
  get() {
    return {
      'access-key': form.options['access-key'],
      'secret-key': form.options['secret-key'],
      'session-token': form.options['session-token']
    }
  },
  set(v) {
    form.options['access-key'] = v['access-key']
    form.options['secret-key'] = v['secret-key']
    form.options['session-token'] = v['session-token']
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

// aws sdk
const { show: showSearchImageModal } = useModal(AwsImagesSearchModalVue)
const {
  defaultRegions,
  volumeTypes,
  keyInfo,
  zoneInfo,
  instanceTypeInfo,
  vpcInfo,
  subnetInfo,
  securityGroupInfo,
  imageInfo,
  imageDetail,
  keyPairInfo,
  instanceProfileInfo,
  validateKeys,
  fetchZones,
  // fetchInstanceTypes,
  fetchAllInstanceTypes,
  fetchVpcs,
  fetchSubnets,
  fetchSecrityGroups,
  resetAll,
  resetSubnetInfo,
  resetSecurityGroupInfo,
  fetchImages,
  fetchImageById,
  fetchKeyPairs,
  fetchInstanceProfiles,
  updateImageDetail
} = useAwsSdk()

const validateCredentials = () => {
  validateKeys(
    form.options['access-key'],
    form.options['secret-key'],
    form.options['session-token'],
    form.options.region
  )
}

// const loading = computed(() => {
//   return (
//     keyInfo.loading ||
//     zoneInfo.loading ||
//     instanceTypeInfo.loading ||
//     vpcInfo.loading ||
//     subnetInfo.loading ||
//     securityGroupInfo.loading ||
//     imageDetail.loading ||
//     keyPairInfo.loading ||
//     instanceProfileInfo.loading
//   )
// })
// const { showLoading, hideLoading } = inject('formContext', { showLoading() {}, hideLoading() {} })
// watch(
//   loading,
//   (l) => {
//     if (l) {
//       showLoading()
//       return
//     }
//     hideLoading()
//   },
//   { immediate: true }
// )

const errors = computed(() => {
  return [
    ...new Set([
      zoneInfo.error,
      instanceTypeInfo.error,
      vpcInfo.error,
      subnetInfo.error,
      securityGroupInfo.error,
      imageDetail.error
    ])
  ].filter((e) => e)
})

const instanceTypeOptions = computed(() => {
  const arch = imageDetail.data?.Architecture
  const types = instanceTypeInfo.data
  if (!arch) {
    return types
  }
  return types.filter((t) => {
    return t.raw?.ProcessorInfo?.SupportedArchitectures?.includes(arch)
  })
})

// const loadInstanceTypes = async () => {
//   if (instanceTypeInfo.loading || imageDetail.loading) {
//     return
//   }

//   if (imageDetail.data?.ImageId === form.options['ami']) {
//     const series = typeSeries.value ? [typeSeries.value] : []
//     fetchInstanceTypes(instanceTypeInfo.nextToken, form.options.region, [imageDetail.data?.Architecture], series)
//   } else {
//     await fetchImageById(form.options.region, form.options['ami'])
//     if (!imageDetail.error) {
//       const series = typeSeries.value ? [typeSeries.value] : []
//       fetchInstanceTypes(instanceTypeInfo.nextToken, form.options.region, [imageDetail.data?.Architecture], series)
//     }
//   }
// }

// const reLoadInstanceTypes = async (region) => {
//   if (imageDetail.data?.ImageId === form.options['ami']) {
//     const series = typeSeries.value ? [typeSeries.value] : []
//     await fetchInstanceTypes('', region, imageDetail.data?.Architecture ? [imageDetail.data?.Architecture] : [], series)
//   } else {
//     await fetchImageById(region, form.options['ami'])
//     if (!imageDetail.error) {
//       const series = typeSeries.value ? [typeSeries.value] : []
//       fetchInstanceTypes('', region, imageDetail.data?.Architecture ? [imageDetail.data?.Architecture] : [], series)
//     }
//   }
// }

const loadVpcs = () => {
  if (vpcInfo.loading) {
    return
  }
  fetchVpcs(vpcInfo.nextToken, form.options.region)
}
const loadSubnets = () => {
  if (subnetInfo.loading) {
    return
  }
  fetchSubnets(subnetInfo.nextToken, form.options.region, form.options.zone, form.options['vpc-id'])
}
const loadSecurityGroups = () => {
  if (securityGroupInfo.loading) {
    return
  }
  fetchSecrityGroups(securityGroupInfo.nextToken, form.options.region, form.options['vpc-id'])
}

const loadInstanceProfiles = () => {
  if (instanceProfileInfo.loading) {
    return
  }
  fetchInstanceProfiles(instanceProfileInfo.marker, form.options.region)
}

const reginChange = () => {
  form.options.zone = ''
  form.options['vpc-id'] = ''
  form.options['subnet-id'] = ''
  form.options['security-group'] = ''
  form.options['instance-type'] = ''
  form.options['keypair-name'] = ''
  form.options['ami'] = ''
  resetAll()
}

const vpcChange = (vpcId) => {
  if (!keyInfo.valid) {
    return
  }
  form.options['subnet-id'] = ''
  if (form.options.region && form.options.zone && vpcId) {
    fetchSubnets('', form.options.region, form.options.zone, vpcId)
  } else {
    resetSubnetInfo()
  }
  form.options['security-group'] = ''
  if (form.options.region && vpcId) {
    fetchSecrityGroups('', form.options.region, vpcId)
  } else {
    resetSecurityGroupInfo()
  }
}

const zoneChange = (zone) => {
  if (!keyInfo.valid) {
    return
  }
  const vpcId = form.options['vpc-id']
  form.options['subnet-id'] = ''
  if (form.options.region && zone && vpcId) {
    fetchSubnets('', form.options.region, zone, vpcId)
  } else {
    resetSubnetInfo()
  }
}

watch(
  [acitiveTab, () => props.readonly, () => props.initValue],
  // eslint-disable-next-line no-unused-vars
  ([tab, readonly], [oldTab]) => {
    if (
      readonly === false &&
      (!oldTab || tab !== 'credential') &&
      (keyInfo.accessKey !== form.options['access-key'] ||
        keyInfo.secretKey !== form.options['secret-key'] ||
        keyInfo.sessionToken !== form.options['session-token'] ||
        keyInfo.region !== form.options.region)
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
      const vpcId = form.options['vpc-id']

      if (region) {
        fetchKeyPairs(region)
        fetchZones(region)
        fetchAllInstanceTypes(region, [], [])
        fetchVpcs('', region)
        fetchInstanceProfiles('', region)
      }
      if (region && vpcId) {
        fetchSecrityGroups('', region, vpcId)
      }
      if (region && zone && vpcId) {
        fetchSubnets('', region, zone, vpcId)
      }
    } else {
      resetAll()
    }
  }
)

const imageIdReg = /^ami-[a-zA-Z0-9]{17}$/
watch([() => keyInfo.valid, () => form.options['ami']], ([valid, imageId]) => {
  if (valid && imageIdReg.test(imageId) && imageId !== imageDetail.data?.ImageId) {
    fetchImageById(form.options.region, form.options['ami'])
  }
})
const selectedImageName = computed(() => {
  const imageId = form.options['ami']
  const image = imageDetail.data
  if (image?.Name && imageId === image?.ImageId) {
    const imageName = image.Name
    return imageName
      .split('/')
      .slice(-1)[0]
      .replace(/hvm|ssd/gi, '')
      .replace(/-([0-9.]+)?v?[0-9]{8}(-[0-9]+|[0-9.]+)?/, '')
      .split('-')
      .map((item) => upperFirst(item))
      .join(' ')
  }
  return imageId
})

watch(
  () => imageDetail.data,
  (image) => {
    const arch = image?.Architecture
    if (!arch) {
      return
    }
    const instanceType = form.options['instance-type']
    if (!instanceType) {
      return
    }
    const selectedInstanceType = instanceTypeInfo.data.find((t) => t.value === instanceType)
    if (!selectedInstanceType) {
      return
    }
    const supportedArchitectures = selectedInstanceType.raw?.ProcessorInfo?.SupportedArchitectures
    if (supportedArchitectures && !supportedArchitectures.includes(arch)) {
      form.options['instance-type'] = ''
    }
  }
)
</script>
