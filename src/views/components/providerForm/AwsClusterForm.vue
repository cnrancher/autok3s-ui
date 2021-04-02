<template>
  <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
  <input style="display: none" autocomplete="new-password" type="password" />
  <div class="aws-cluster-create-form__credencial">
    <k-select
      :loading="loading"
      v-model="form.options.region"
      label="Region"
      :desc="desc.options.region"
      :disabled="readonly">
      <k-option v-for="r in regionOptions" :key="r" :value="r" :label="r"></k-option>
    </k-select>
    <password-form
      v-model.trim="form.options['access-key']"
      label="Access Key"
      :desc="desc.options['access-key']"
      :readonly="readonly">
    </password-form>
    <password-form
      v-model.trim="form.options['secret-key']"
      label="Secret Key"
      :desc="desc.options['secret-key']"
      :readonly="readonly">
    </password-form>
  </div>
  <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e" v-show="keyInvalid"></k-alert>
  <footer-actions v-show="keyInvalid">
    <k-button class="bg-primary" type="button" :disabled="loading || validatingKeys" @click="validateKeys">Next: Authenticate & Configure Instance</k-button>
  </footer-actions>
  <tabs tab-position="left" v-model="acitiveTab" v-show="!keyInvalid">
    <tab-pane label="Instance Options" name="instance">
      <form-group>
        <template #title>
          Basic
        </template>
        <template #default>
          <div class="aws-cluster-create-form__content">
            <!-- <string-form
              v-model.trim="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :readonly="readonly"
            /> -->
            <!-- <string-form
              v-model.trim="form.options.zone"
              label="Zone"
              :desc="desc.options.zone"
              :readonly="readonly"
            /> -->
            <k-select
              :loading="loading"
              v-model="form.options.zone"
              label="Zone"
              :desc="desc.options.zone"
              :disabled="readonly">
              <k-option v-for="z in zoneOptions" :key="z.value" :value="z.value" :label="z.label"></k-option>
            </k-select>
            <!-- <string-form
              v-model.trim="form.options['instance-type']"
              label="Instance Type"
              :desc="desc.options['instance-type']"
              :readonly="readonly"
            /> -->
            <k-select
              :loading="loading"
              v-model="form.options['instance-type']"
              label="Instance Type"
              :desc="desc.options['instance-type']"
              :disabled="readonly">
              <k-option v-for="t in instanceTypeOptions" :key="t.value" :value="t.value" :label="t.label"></k-option>
            </k-select>
            <string-form
              v-model.trim="form.options['ami']"
              label="AMI"
              :desc="desc.options['ami']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['volume-type']"
              label="Volume Type"
              :desc="desc.options['volume-type']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.options['root-size']"
              label="Root Size"
              :desc="desc.options['root-size']"
              :readonly="readonly"
            >
            <template #suffix>
              GB
            </template>
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
      <hr class="section-divider">
      <form-group :closable="true">
        <template #title>
          Network
        </template>
        <template #default>
          <div class="aws-cluster-create-form__content">
          <!-- <string-form
            v-model.trim="form.options['vpc-id']"
            label="VPC ID"
            :desc="desc.options['vpc-id']"
            :readonly="readonly"
          /> -->
          <k-select
            :loading="loading"
            v-model="form.options['vpc-id']"
            label="VPC ID"
            :desc="desc.options['vpc-id']"
            clearable
            :disabled="readonly">
            <k-option v-for="v in vpcOptions" :key="v.value" :value="v.value" :label="v.label"></k-option>
          </k-select>
          <!-- <string-form
            v-model.trim="form.options['subnet-id']"
            label="Subnet ID"
            :desc="desc.options['subnet-id']"
            :readonly="readonly"
          /> -->
          <k-select
            :loading="loading"
            v-model="form.options['subnet-id']"
            label="Subnet ID"
            :desc="desc.options['subnet-id']"
            clearable
            :disabled="readonly">
            <k-option v-for="s in subnetOptions" :key="s.value" :value="s.value" :label="s.label"></k-option>
          </k-select>
          <!-- <string-form
            v-model.trim="form.options['security-group']"
            label="Security Group"
            :desc="desc.options['security-group']"
            :readonly="readonly"
          /> -->
          <k-select
            :loading="loading"
            v-model="form.options['security-group']"
            label="Security Group"
            :desc="desc.options['security-group']"
            clearable
            :disabled="readonly">
            <k-option v-for="sg in securityGroupOptions" :key="sg.value" :value="sg.value" :label="sg.label"></k-option>
          </k-select>
        </div>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group>
        <template #title>
          SSH Public
        </template>
        <template #subtitle>
          Params used to login to instance via ssh, e.g. key-pair, ssh user, ssh port
        </template>
        <template #default>
          <div class="aws-cluster-create-form__content">
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
        :desc="desc"
        :readonly="readonly">
      </k3s-options-form>
    </tab-pane>
    <tab-pane label="Additional Options" name="additional">
      <div class="aws-cluster-create-form__content">
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
    </tab-pane>
  </tabs>
  <div v-show="!keyInvalid">
    <slot></slot>
  </div>
</template>
<script>
import { cloneDeep } from '@/utils'
import {computed, defineComponent, ref, watch, watchEffect} from 'vue'
import {Tabs, TabPane} from '@/components/Tabs'
import {Select as KSelect, Option as KOption, OptionGroup as kOptionGroup} from '@/components/Select'
import FooterActions from '@/views/components/FooterActions.vue'
import KButton from '@/components/Button'
import KAlert from '@/components/Alert'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import ClusterTagsForm from '../baseForm/ClusterTagsForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import { PasswordInput as PasswordForm} from '@/components/Input'
import { Collapse, CollapseItem } from '@/components/Collapse'
import useFormFromSchema from '../../composables/useFormFromSchema.js'
import useAwsSdk from '../../composables/useAwsSdk.js'
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
    loadingState: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:loadingState'],
  setup(props, {emit}) {
    const { form, desc }= useFormFromSchema(props.schema)
    const acitiveTab = ref('instance')

    const getForm = () => {
      return cloneDeep(form)
    }
    // aws sdk
    const enCollator = new Intl.Collator('en')
    const {keyInvalid, validatingKeys, loading, errors, region, zone, vpcId, regions, zones, instanceTypes, vpcs, subnets, securityGroups, accessKeyId, secretAccessKey, validateKeys} = useAwsSdk()
    const regionOptions = regions.value
    const zoneOptions = computed(() => {
      if (form.options.zone && zones.value.length === 0) {
        return [
          {
            label: form.options.zone,
            value: form.options.zone
          }]
      }
      const options = zones.value.map((z) => ({
        label: z.ZoneName,
        value: z.ZoneName
        }))
      options.sort()
      return [
        ...options
      ]
    })
    const instanceTypeOptions = computed(() => {
      const t = form.options['instance-type']
      if (t && instanceTypes.value.length === 0) {
        return [
          {
            group: t.split('.')[0],
            label: t,
            value: t
          }]
      }
      const options = instanceTypes.value.map((t) => ({
        value: t.InstanceType,
        label: t.InstanceType,
        group: t.InstanceType.split('.')[0]
        }))
      options.sort((a, b) => {
        const result = enCollator.compare(a.group, b.group)
        if (result === 0) {
          return enCollator.compare(a.label, b.label)
        }
        return result
      })
      return [
        ...options]
    })
    const vpcOptions = computed(() => {
      const v = form.options['vpc-id']
      if (v && vpcs.value.length === 0) {
        return [
          {
            label: v,
            value: v
          }]
      }
      return [
        ...vpcs.value.map((v) => ({
          label: `${v.VpcId}${v.IsDefault ? '(default)' : ''}`,
          value: v.VpcId
        }))]
    })

    const subnetOptions = computed(() => {
      const subnetId = form.options['subnet-id']
      if (subnetId && subnets.value.length === 0) {
        return [
          {
            label: subnetId,
            value: subnetId
          }]
      }
      return [
        ...subnets.value.map((s) => ({
        label: s.SubnetId,
        value: s.SubnetId
      }))]
    })
   const securityGroupOptions = computed(() => {
      const securityGroupId = form.options['security-group']
      if (securityGroupId && securityGroups.value.length === 0) {
        return [
          {
            label: securityGroupId,
            value: securityGroupId
          }]
      }
      return [
        ...securityGroups.value.map((sg) => ({
        label: `${sg.GroupId}(${sg.GroupName} | ${sg.Description})`,
        value: sg.GroupId
      }))]
    })

    watch([() => form.options['access-key'], () => form.options['secret-key']], ([accessKey, secretKey]) => {
      accessKeyId.value = accessKey
      secretAccessKey.value = secretKey
    }, {
      immediate: true,
    })
    watch(() => form.options.region, (r) => {
      region.value = r
      if (keyInvalid.value === false) {
        validateKeys()
      }
    }, {
      immediate: true,
    })

    watch([() => form.options.zone, () => form.options['vpc-id']], ([z, vpc]) => {
      if (z && vpc) {
        zone.value = z
        vpcId.value = vpc
      }
    }, {
      immediate: true
    })

    watch(zoneOptions, (zones) => {
      const currentZone = form.options.zone
      if (zones.length > 0 && !zones.find((z) => z.value === currentZone)) {
        form.options.zone = zones[0].value
      }
    })

    watch(instanceTypeOptions, (types) => {
      const currentType = form.options['instance-type']
      if (types.length > 0 && !types.find((t) => t.value === currentType)) {
        const t = instanceTypes.value.find((t) => t.FreeTierEligible)
        form.options['instance-type'] = t?.InstanceType ?? types[0].value
      }
    })

    // watch(vpcOptions, (options) => {
    //   const currentVpc = form.options['vpc-id']
    //   if (options.length > 0 && !options.find((v) => v.value === currentVpc)) {
    //     const v = vpcs.value.find((v) => v.IsDefault)
    //     form.options['vpc-id'] = v?.VpcId ?? options[0].value
    //   }
    // })

    // watch(subnetOptions, (options) => {
    //   const currentSubnetId = form.options['subnet-id']
    //   if (options.length > 0 && !options.find((s) => s.value === currentSubnetId)) {
    //     const s = subnets.value.find((s) => s.DefaultForAz)
    //     form.options['subnet-id'] = s?.SubnetId ?? options[0].value
    //   }
    // })

    watchEffect(() => {
      emit('update:loadingState', loading.value)
    })

    return {
      form,
      desc,
      acitiveTab,
      getForm,
      loading,
      regionOptions,
      zoneOptions,
      instanceTypeOptions,
      vpcOptions,
      subnetOptions,
      securityGroupOptions,
      validateKeys,
      keyInvalid,
      errors,
      validatingKeys,
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
    FormGroup,
    ClusterTagsForm,
    KSelect,
    KOption,
    kOptionGroup,
    FooterActions,
    KButton,
    KAlert,
  }
})
</script>
<style>
.aws-cluster-create-form__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
  column-gap: 10px;
}
.aws-cluster-create-form__credencial {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  row-gap: 10px;
  column-gap: 10px;
  padding-bottom: 20px;
}
</style>
