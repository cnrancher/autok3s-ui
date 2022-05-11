<template>
  <k-alert v-if="keyInfo.valid === true && !keyInfo.error" type="success" title="Credentails validity"></k-alert>
  <k-alert v-else-if="keyInfo.valid === false && keyInfo.error" type="error" :title="keyInfo.error"></k-alert>
  <KAlert v-for="e in errors" :key="e" type="error" :title="e"></KAlert>
  <k-tabs v-model="acitiveTab" tab-position="left">
    <k-tab-pane label="Credential Options" name="credential">
      <form-group>
        <template #title>Credential Options</template>
        <template #default>
          <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
            <k-password-input
              v-model="form.options['access-key']"
              label="Access Key"
              :desc="desc.options['access-key']"
              :readonly="readonly"
            ></k-password-input>
            <k-password-input
              v-model="form.options['secret-key']"
              label="Secret Key"
              :desc="desc.options['secret-key']"
              :readonly="readonly"
            ></k-password-input>
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
      <div class="mt-4 text-center">
        <KButton class="role-secondary" :disabled="keyInfo.loading" @click="validateCredentials">
          Validate Credentails
        </KButton>
      </div>
    </k-tab-pane>
    <k-tab-pane label="Instance Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
            <string-form v-model.trim="form.options.region" label="Region" :desc="desc.options.region" disabled />
            <!-- <string-form v-model.trim="form.options.zone" label="Zone" :desc="desc.options.zone" :readonly="readonly" /> -->
            <KSelect
              v-model="form.options.zone"
              label="Zone"
              :desc="desc.options.zone"
              :disabled="readonly"
              :loading="zoneInfo.loading"
              clearable
              @change="zoneChange($event)"
            >
              <KOption v-for="z in zoneInfo.data" :key="z.value" :value="z.value" :label="z.label"></KOption>
            </KSelect>
            <!-- <string-form
              v-model.trim="form.options['instance-type']"
              label="Instance Type"
              :desc="desc.options['instance-type']"
              :readonly="readonly"
            /> -->
            <KSelect
              v-model="form.options['instance-type']"
              label="Instance Type"
              :desc="desc.options['instance-type']"
              :disabled="readonly"
              :loading="instanceTypeInfo.loading || imageDetail.loading"
              clearable
            >
              <KOption v-for="t in instanceTypeInfo.data" :key="t.value" :value="t.value" :label="t.label"></KOption>
              <div
                v-if="instanceTypeInfo.nextToken"
                class="text-center cursor-pointer"
                @click.stop="loadInstanceTypes()"
              >
                Load More {{ instanceTypeInfo.loading ? '(Loading ...)' : '' }}
              </div>
            </KSelect>
            <string-form
              v-model.trim="form.options['ami']"
              label="AMI"
              :desc="desc.options['ami']"
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
                      volumeType: form.options['volume-type'],
                      imageInfo,
                      fetchImages,
                      onSelect: (e) => {
                        form.options['ami'] = e.ImageId
                        // form.options['instance-type'] = ''
                        fetchInstanceTypes('', form.options.region, [e.Architecture])
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
            <KSelect
              v-model="form.options['vpc-id']"
              label="VPC ID"
              placeholder="Select a VPC ..."
              :desc="desc.options['vpc-id']"
              :disabled="readonly"
              :loading="vpcInfo.loading"
              clearable
              @change="vpcChange($event)"
            >
              <KOption v-for="v in vpcInfo.data" :key="v.value" :value="v.value" :label="v.label"></KOption>
              <div v-if="vpcInfo.nextToken" class="text-center cursor-pointer" @click.stop="loadVpcs()">
                Load More {{ vpcInfo.loading ? '(Loading ...)' : '' }}
              </div>
            </KSelect>
            <!-- <string-form
              v-model.trim="form.options['subnet-id']"
              label="Subnet ID"
              :desc="desc.options['subnet-id']"
              :readonly="readonly"
            /> -->
            <KSelect
              v-model="form.options['subnet-id']"
              label="Subnet ID"
              placeholder="Select a subnet ..."
              :desc="desc.options['subnet-id']"
              :disabled="readonly"
              :loading="subnetInfo.loading"
              clearable
            >
              <KOption v-for="v in subnetInfo.data" :key="v.value" :value="v.value" :label="v.label"></KOption>
              <div v-if="subnetInfo.nextToken" class="text-center cursor-pointer" @click.stop="loadSubnets()">
                Load More {{ subnetInfo.loading ? '(Loading ...)' : '' }}
              </div>
            </KSelect>
            <!-- <string-form
              v-model.trim="form.options['security-group']"
              label="Security Group"
              :desc="desc.options['security-group']"
              :readonly="readonly"
            /> -->
            <KSelect
              v-model="form.options['security-group']"
              label="Security Group"
              placeholder="Select a security group ..."
              :desc="desc.options['security-group']"
              :disabled="readonly"
              :loading="securityGroupInfo.loading"
              clearable
            >
              <KOption v-for="v in securityGroupInfo.data" :key="v.value" :value="v.value" :label="v.label"></KOption>
              <div
                v-if="securityGroupInfo.nextToken"
                class="text-center cursor-pointer"
                @click.stop="loadSecurityGroups()"
              >
                Load More {{ securityGroupInfo.loading ? '(Loading ...)' : '' }}
              </div>
            </KSelect>
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
            <KSelect
              v-model="form.options['keypair-name']"
              label="Keypair Name"
              placeholder="Select a key pair ..."
              :desc="desc.options['keypair-name']"
              :disabled="readonly"
              :loading="keyPairInfo.loading"
              clearable
            >
              <KOption v-for="v in keyPairInfo.data" :key="v.value" :value="v.value" :label="v.label"></KOption>
            </KSelect>
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
          <div class="grid gap-10px grid-cols-1 sm:grid-cols-2">
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
      <k3s-options-form
        :visible="acitiveTab === 'k3s'"
        :form="form"
        :desc="desc"
        :readonly="readonly"
      ></k3s-options-form>
    </k-tab-pane>
    <k-tab-pane label="Additional Options" name="additional">
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
          <k-option value="dashboard" label="dashboard"></k-option>
        </k-select>
        <boolean-form
          v-model="form.options['cloud-controller-manager']"
          label="Cloud Controller Manager"
          :desc="desc.options['cloud-controller-manager']"
          :readonly="readonly"
        />
        <string-form
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
        />
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
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import ClusterTagsForm from '../baseForm/ArrayListForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import useFormFromSchema from '../../composables/useFormFromSchema.js'
import useAwsSdk from './hooks/useAwsSdk.js'
import useModal from '@/composables/useModal.js'
import AwsImagesSearchModalVue from './components/AwsImagesSearchModal.vue'

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
  if (!form.options['access-key'] || !form.options['secret-key']) {
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

defineExpose({
  getForm
})

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
  validateKeys,
  fetchZones,
  fetchInstanceTypes,
  fetchVpcs,
  fetchSubnets,
  fetchSecrityGroups,
  resetAll,
  resetSubnetInfo,
  resetSecurityGroupInfo,
  fetchImages,
  fetchImageById,
  fetchKeyPairs
} = useAwsSdk()

const validateCredentials = () => {
  validateKeys(form.options['access-key'], form.options['secret-key'], form.options.region)
}

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

const loadInstanceTypes = async () => {
  if (instanceTypeInfo.loading || imageDetail.loading) {
    return
  }

  if (imageDetail.data?.ImageId === form.options['ami']) {
    fetchInstanceTypes(instanceTypeInfo.nextToken, form.options.region, [imageDetail.data?.Architecture])
  } else {
    await fetchImageById(form.options.region, form.options['ami'])
    if (!imageDetail.error) {
      fetchInstanceTypes(instanceTypeInfo.nextToken, form.options.region, [imageDetail.data?.Architecture])
    }
  }
}

const reLoadInstanceTypes = async (region) => {
  if (imageDetail.data?.ImageId === form.options['ami']) {
    fetchInstanceTypes('', region, [imageDetail.data?.Architecture])
  } else {
    await fetchImageById(region, form.options['ami'])
    if (!imageDetail.error) {
      fetchInstanceTypes('', region, [imageDetail.data?.Architecture])
    }
  }
}

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

const reginChange = (region) => {
  if (region === form.options.region) {
    return
  }
  form.options.zone = ''
  form.options['vpc-id'] = ''
  form.options['subnet-id'] = ''
  form.options['security-group'] = ''
  form.options['instance-type'] = ''
  resetAll()
}

const vpcChange = (vpcId) => {
  if (form.options.region && form.options.zone && vpcId) {
    fetchSubnets('', form.options.region, form.options.zone, vpcId)
  } else {
    resetSubnetInfo()
    form.options['subnet-id'] = ''
  }
  if (form.options.region && vpcId) {
    fetchSecrityGroups('', form.options.region, vpcId)
  } else {
    resetSecurityGroupInfo()
    form.options['security-group'] = ''
  }
}

const zoneChange = (zone) => {
  const vpcId = form.options['vpc-id']
  if (form.options.region && zone && vpcId) {
    fetchSubnets('', form.options.region, zone, vpcId)
  } else {
    resetSubnetInfo()
    form.options['subnet-id'] = ''
  }
}

watch(
  [acitiveTab, () => props.readonly, () => props.schema.config, () => props.schema.options],
  // eslint-disable-next-line no-unused-vars
  ([tab, readonly], [oldTab]) => {
    if (
      readonly === false &&
      (!oldTab || tab !== 'credential') &&
      (keyInfo.accessKey !== form.options['access-key'] ||
        keyInfo.secretKey !== form.options['secret-key'] ||
        keyInfo.region !== form.options.region)
    ) {
      validateCredentials()
    }
  },
  { immediate: true }
)

watch(
  () => keyInfo.valid,
  async (valid) => {
    if (valid) {
      const region = form.options.region
      const zone = form.options.zone
      const vpcId = form.options['vpc-id']

      if (region) {
        fetchKeyPairs(region)
        fetchZones(region)
        reLoadInstanceTypes(region)
        fetchVpcs('', region)
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
</script>
