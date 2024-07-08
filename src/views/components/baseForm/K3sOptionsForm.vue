<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <form-group>
    <template #title>Basic</template>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <label>
          <input
            v-model="airGapInstall"
            type="checkbox"
            class="accent-$primary"
            style="accent-color: var(--primary)"
            :disabled="readonly"
          />
          Install With Air-gap Package
        </label>
        <div></div>
        <template v-if="airGapInstall">
          <KSelect
            v-model="config['package-name']"
            label="Air-gap Package Name"
            :disabled="readonly"
            required
            placeholder="Please select a air-gap package..."
          >
            <KOption v-for="p in packages" :key="p.id" :value="p.name" :label="p.name"></KOption>
          </KSelect>
          <div></div>
        </template>
        <template v-else>
          <KSelect
            v-model="config['k3s-channel']"
            :desc="desc.config['k3s-channel']"
            label="K3s Channel"
            :disabled="readonly"
          >
            <KOption value="stable" label="stable"></KOption>
            <KOption value="latest" label="latest"></KOption>
            <KOption value="testing" label="testing"></KOption>
          </KSelect>
          <string-form
            v-model.trim="config['k3s-version']"
            label="K3s Version"
            :desc="desc.config['k3s-version']"
            :readonly="readonly"
          />
          <k-combo-box
            v-model="config['k3s-install-script']"
            label="K3s Install Script"
            :desc="desc.config['k3s-install-script']"
            :disabled="readonly"
            :options="installScriptOptions"
            placeholder="Please Select Or Input..."
          ></k-combo-box>
          <string-form
            v-model.trim="config['system-default-registry']"
            label="System Default Registry"
            :desc="desc.config['system-default-registry']"
            :readonly="readonly"
          />
        </template>
        <BooleanForm
          v-model="HAClusters"
          label="High Availability Clusters"
          :readonly="readonly || onlyHAMode"
          @change="handleHAChanged"
        />
        <BooleanForm
          v-show="HAClusters"
          v-model="config['cluster']"
          label="Datastore Type"
          :desc="desc.config['cluster']"
          true-label="Embedded etcd"
          false-label="External DB"
          :readonly="readonly"
        />
        <div
          v-show="HAClusters && !config['cluster']"
          class="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-10px items-start"
        >
          <div class="col-span-2">
            <StringForm
              v-model.trim="config['datastore']"
              label="Datastore Endpoint"
              :desc="desc.config['datastore']"
              :placeholder="connectionStringPlaceholder"
              :readonly="readonly"
              required
            >
              <template #prefix>
                <KSelect
                  v-model="datastoreType"
                  select-class="!border-0 !min-h-21px !py-0 !pl-0"
                  input-class="w-80px py-0"
                  :disabled="readonly"
                >
                  <KOption v-for="t in datastoreTypes" :key="t.value" :value="t.value" :label="t.label"></KOption>
                </KSelect>
              </template>
            </StringForm>
          </div>
          <KeyForm
            v-model.trim="config['datastore-cafile-content']"
            label="Datastore CA File"
            type="textarea"
            :desc="desc.config['datastore-cafile']"
            :readonly="readonly"
          />
          <KeyForm
            v-model.trim="config['datastore-certfile-content']"
            label="Datastore Cert File"
            type="textarea"
            :desc="desc.config['datastore-certfile']"
            :readonly="readonly"
          />
          <KeyForm
            v-model.trim="config['datastore-keyfile-content']"
            label="Datastore Key File"
            type="textarea"
            :desc="desc.config['datastore-keyfile']"
            :readonly="readonly"
          />
        </div>
      </div>
    </template>
  </form-group>
  <div v-show="onlyHAMode">
    <KAlert type="warning" title="We can only using HA Mode for multiple master nodes." />
  </div>
  <hr class="section-divider" />
  <form-group>
    <template #title>Master</template>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-start">
        <string-form
          v-if="initValue.provider !== 'native'"
          v-model.trim="config['master']"
          label="Master"
          :desc="desc.config['master']"
          :readonly="readonly"
          :disabled="masterFormDisabled || masterDisabled"
        />
        <!-- <string-form
          v-model.trim="config['master-extra-args']"
          label="Master Extra Args"
          :desc="desc.config['master-extra-args']"
          :readonly="readonly"
        /> -->
        <command-args
          v-model="config['master-extra-args']"
          :args="masterExtraArgs"
          label="Master Extra Args"
          :desc="desc.config['master-extra-args']"
          :readonly="readonly"
        ></command-args>
      </div>
    </template>
  </form-group>
  <form-group>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-start">
        <KeyValueArrayListForm
          ref="serverInstallEnvRef"
          v-model="config['server-install-env']"
          :readonly="readonly"
          label="Server Install Env"
          :desc="desc.config['server-install-env']"
          placeholder="e.g. foo=bar"
          action-label="Add ENV"
        />
      </div>
    </template>
  </form-group>
  <hr class="section-divider" />
  <form-group>
    <template #title>Worker</template>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-start">
        <string-form
          v-if="initValue.provider !== 'native'"
          v-model.trim="config['worker']"
          label="Worker"
          :desc="desc.config['worker']"
          :readonly="readonly"
          :disabled="workerDisabled"
        />
        <!-- <string-form
          v-model.trim="config['worker-extra-args']"
          label="Worker Extra Args"
          :desc="desc.config['worker-extra-args']"
          :readonly="readonly"
        /> -->
        <command-args
          v-model="config['worker-extra-args']"
          :args="workExtraArgs"
          label="Worker Extra Args"
          :desc="desc.config['worker-extra-args']"
          :readonly="readonly"
        ></command-args>
      </div>
    </template>
  </form-group>
  <form-group>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px items-start">
        <KeyValueArrayListForm
          ref="agentInstallEnvRef"
          v-model="config['agent-install-env']"
          label="Agent Install Env"
          :readonly="readonly"
          :desc="desc.config['server-install-env']"
          placeholder="e.g. foo=bar"
          action-label="Add ENV"
        />
      </div>
    </template>
  </form-group>

  <hr class="section-divider" />
  <form-group>
    <template #title>Advanced</template>
    <template #default>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
        <string-form v-model.trim="config['token']" label="Token" :desc="desc.config['token']" :readonly="readonly" />
        <string-form
          v-model.trim="config['manifests']"
          label="Manifests"
          :desc="desc.config['manifests']"
          :readonly="readonly"
        />
        <array-list-form
          ref="tlsSansRef"
          :init-value="config['tls-sans']"
          label="TLS Sans"
          placeholder="e.g. 192.168.1.10"
          action-label="Add IP/Hostname"
          :desc="desc.config['tls-sans']"
          :readonly="readonly"
        />
        <registry-config-form
          v-model="config['registry-content']"
          class="col-span-1 sm:col-span-2"
          label="Registry"
          :desc="desc.config['registry-content']"
          :options="readonlyOption"
        />
      </div>
    </template>
  </form-group>
</template>
<script setup>
import { provide, toRef, watch, computed, ref, reactive } from 'vue'
import StringForm from './StringForm.vue'
import BooleanForm from './BooleanForm.vue'
import RegistryConfigForm from './RegistryConfigForm.vue'
import FormGroup from './FormGroup.vue'
import CommandArgs from './CommandArgs/index.vue'
import ArrayListForm from '../baseForm/ArrayListForm.vue'
import KeyValueArrayListForm from '../baseForm/KeyValueArrayListForm.vue'
import KeyForm from './KeyForm.vue'
import useFormRegist from '@/composables/useFormRegist.js'
import usePackageStore from '@/store/usePackageStore.js'

const props = defineProps({
  initValue: {
    type: Object,
    required: true
  },
  desc: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  visible: {
    type: Boolean,
    default: false
  },
  initMasterCount: {
    type: Number,
    default: 0
  },
  initWorkerCount: {
    type: Number,
    default: 0
  },
  masterDisabled: {
    type: Boolean,
    default: false
  },
  workerDisabled: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['errors'])
const packageStore = usePackageStore()
const packages = computed(() => {
  return packageStore.data.filter((p) => p.state === 'Active')
})

const airGapInstall = ref(false)
watch(
  () => props.initValue?.config?.['package-name'],
  (packageName) => {
    if (packageName) {
      airGapInstall.value = true
    }
  },
  { immediate: true }
)
const visible = toRef(props, 'visible')
const readonlyOption = computed(() => {
  return { readOnly: props.readonly }
})
provide('parentVisible', visible)

const tlsSansRef = ref(null)

const config = reactive({})
const configFields = [
  'k3s-channel',
  'k3s-version',
  'cluster',
  'datastore',
  'k3s-install-script',
  'master',
  'master-extra-args',
  'worker',
  'worker-extra-args',
  'token',
  'manifests',
  'tls-sans',
  'registry-content',
  'k3s-install-mirror',
  'system-default-registry',
  'package-name',
  'datastore-cafile-content',
  'datastore-certfile-content',
  'datastore-keyfile-content',
  'server-install-env',
  'agent-install-env'
]

const datastoreTypes = [
  {
    label: 'PostgreSQL',
    value: 'PostgreSQL',
    placeholder: 'e.g. postgres://username:password@hostname:port/database-name'
  },
  { label: 'MySQL', value: 'MySQL', placeholder: 'e.g. mysql://username:password@tcp(hostname:3306)/database-name' },
  {
    label: 'etcd',
    value: 'etcd',
    placeholder: 'e.g. https://etcd-host-1:2379,https://etcd-host-2:2379,https://etcd-host-3:2379'
  }
]

const HAClusters = ref(false)
const datastoreType = ref('PostgreSQL')
const connectionStringPlaceholder = computed(() => {
  return datastoreTypes.find((t) => t.value === datastoreType.value)?.placeholder ?? ''
})

watch(
  configFields.map((k) => {
    return () => props.initValue.config[k]
  }),
  () => {
    configFields.forEach((k) => {
      config[k] = props.initValue.config[k]
    })
  },
  { immediate: true }
)

watch(
  () => props.initValue?.config,
  (c) => {
    if (c?.['cluster'] || c?.['datastore']) {
      HAClusters.value = true
    }
    if (c?.['datastore']) {
      if (c?.['datastore'].startsWith('postgres://')) {
        datastoreType.value = 'PostgreSQL'
      } else if (c?.['datastore'].startsWith('mysql://')) {
        datastoreType.value = 'MySQL'
      } else {
        datastoreType.value = 'etcd'
      }
    }
  },
  { immediate: true }
)

watch(
  [HAClusters, () => props.initValue?.config?.['master']],
  ([ha]) => {
    if (!ha) {
      config['master'] = '1'
    }
  },
  { immediate: true }
)

const masterFormDisabled = computed(() => {
  return !HAClusters.value
})

const onlyHAMode = computed(() => {
  const m = parseInt(config['master'], 10)
  return m > 1 || props.initMasterCount > 1
})

watch(onlyHAMode, (haMode) => {
  if (haMode) {
    HAClusters.value = true
  }
})

watch([HAClusters, () => config['cluster'], () => config['datastore']], ([ha, c, d]) => {
  if (ha && c === false && !d) {
    emit('errors', ['"Datastore Endpoint" is required'])
  } else {
    emit('errors', [])
  }
})

watch(
  [() => props.initMasterCount, () => props.initWorkerCount],
  ([m, w]) => {
    if (m > 0) {
      config['master'] = `${m}`
      if (m > 1 && HAClusters.value === false) {
        HAClusters.value = true
        if (config['cluster'] === false && !config['datastore']) {
          config['cluster'] = true
        }
      }
    }
    if (w > 0) {
      config['worker'] = `${w}`
    }
  },
  {
    immediate: true
  }
)

const handleHAChanged = (ha) => {
  if (ha) {
    config['cluster'] = true
  }
}
const serverInstallEnvRef = ref(null)
const agentInstallEnvRef = ref(null)
const getForm = () => {
  const keys = ['k3s-channel', 'k3s-version', 'k3s-install-script', 'system-default-registry']
  const flag = airGapInstall.value
  const isNativeProvider = props.initValue.provider === 'native'
  const ignoreKeys = ['master', 'worker']
  const f = configFields
    .filter((k) => {
      if (isNativeProvider) {
        return !ignoreKeys.includes(k)
      } else {
        return true
      }
    })
    .map((k) => {
      let value = config[k]
      if (k === 'tls-sans') {
        value = tlsSansRef.value.getValue()
      }
      if (k === 'server-install-env') {
        value = serverInstallEnvRef.value.getValue()
      }
      if (k === 'agent-install-env') {
        value = agentInstallEnvRef.value.getValue()
      }
      if (flag === true && keys.includes(k)) {
        value = ''
      }
      if (flag === false && k === 'package-name') {
        value = ''
      }

      return {
        path: ['config', k],
        value
      }
    })

  const clusterConfig = f.find(({ path: [, k] }) => k === 'cluster')
  const datastoreConfig = f.find(({ path: [, k] }) => k === 'datastore')
  const datastoreCAConfig = f.find(({ path: [, k] }) => k === 'datastore-cafile-content')
  const datastoreCertConfig = f.find(({ path: [, k] }) => k === 'datastore-certfile-content')
  const datastoreKeyConfig = f.find(({ path: [, k] }) => k === 'datastore-keyfile-content')

  if (HAClusters.value) {
    if (clusterConfig.value === true) {
      datastoreConfig.value = ''
      datastoreCAConfig.value = ''
      datastoreCertConfig.value = ''
      datastoreKeyConfig.value = ''
    }
  } else {
    clusterConfig.value = false
    datastoreConfig.value = ''
    datastoreCAConfig.value = ''
    datastoreCertConfig.value = ''
    datastoreKeyConfig.value = ''
  }

  return f
}

const validate = () => {
  const errors = []
  if (airGapInstall.value && !config['package-name']) {
    errors.push('"Air-gap Package Name" is required')
  }
  if (HAClusters.value && config['cluster'] === false && !config['datastore']) {
    errors.push('"Datastore Endpoint" is required')
  }
  return errors
}

useFormRegist(getForm, validate)

const installScriptOptions = ['https://get.k3s.io', 'https://rancher-mirror.rancher.cn/k3s/k3s-install.sh']
watch(
  () => config['k3s-install-script'],
  (installScript) => {
    if (installScript === installScriptOptions[1]) {
      // eslint-disable-next-line vue/no-mutating-props
      config['k3s-install-mirror'] = 'INSTALL_K3S_MIRROR=cn'
    } else if (config['k3s-install-mirror']) {
      // eslint-disable-next-line vue/no-mutating-props
      config['k3s-install-mirror'] = ''
    }
  },
  {
    immediate: true
  }
)

// ref: https://semver.org/lang/zh-CN/
const versionReg =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
const versionLt = (a, b) => {
  // a < b; only compare major,  minor and patch
  const resultA = versionReg.exec(a.replace(/^v/i, ''))
  const resultB = versionReg.exec(b.replace(/^v/i, ''))

  if (!resultA || !resultB) {
    return {
      error: `Unknown Version: a: ${a}, b: ${b}`
    }
  }

  const versionA = [resultA[1], resultA[2], resultA[3]]
  const versionB = [resultB[1], resultB[2], resultB[3]]
  let r = 0
  for (let i = 0; i < 3; i++) {
    r = versionA[i] - versionB[i]
    if (r < 0) {
      return {
        result: true
      }
    }
  }

  return {
    result: false
  }
}

watch(
  () => config['k3s-version'],
  (v) => {
    const args = config['master-extra-args'] ?? ''
    if (!v) {
      // latest version
      config['master-extra-args'] = args.replace(/--no-deploy /i, '--disable ')
      return
    }

    const result = versionLt(v, '1.20.0')?.result
    if (result === false) {
      // >= 1.20.0
      config['master-extra-args'] = args.replace(/--no-deploy /i, '--disable ')
    } else if (result === true) {
      config['master-extra-args'] = args.replace(/--disable /i, '--no-deploy ')
    }
  },
  { immediate: true }
)

const masterExtraArgs = computed(() => {
  const arg1 = [
    {
      long: '--docker',
      alias: 'runtime',
      flag: true,
      values: ['docker', 'containerd'],
      modelValue: true,
      desc: '(agent/runtime) Automatic install docker on VM and use docker instead of containerd'
    },
    {
      long: '--no-deploy',
      alias: 'disable',
      multiple: true,
      values: ['coredns', 'servicelb', 'traefik', 'local-storage', 'metrics-server'],
      modelValue: '',
      desc: 'Do not deploy packaged components (valid items: coredns, servicelb, traefik, local-storage, metrics-server)'
    },
    {
      long: '--flannel-backend',
      alias: 'flannel-backend',
      values: ['none', 'vxlan', 'ipsec', 'host-gw', 'wireguard'],
      modelValue: 'vxlan',
      desc: `(networking) One of 'none', 'vxlan', 'ipsec', 'host-gw', or 'wireguard' (default: "vxlan")`
    }
  ]
  const arg2 = [
    {
      long: '--docker',
      alias: 'runtime',
      flag: true,
      values: ['docker', 'containerd'],
      modelValue: true,
      desc: '(agent/runtime) Automatic install docker on VM and use docker instead of containerd'
    },
    {
      long: '--disable',
      alias: 'disable',
      multiple: true,
      values: ['coredns', 'servicelb', 'traefik', 'local-storage', 'metrics-server'],
      modelValue: '',
      desc: 'Do not deploy packaged components (valid items: coredns, servicelb, traefik, local-storage, metrics-server)'
    },
    {
      long: '--flannel-backend',
      alias: 'flannel-backend',
      values: ['none', 'vxlan', 'ipsec', 'host-gw', 'wireguard'],
      modelValue: 'vxlan',
      desc: `(networking) One of 'none', 'vxlan', 'ipsec', 'host-gw', or 'wireguard' (default: "vxlan")`
    }
  ]
  const v = config['k3s-version']
  if (!v || versionLt(v, '1.20.0')?.result === false) {
    return arg2
  }
  return arg1
})
const workExtraArgs = [
  {
    long: '--docker',
    alias: 'runtime',
    flag: true,
    values: ['docker', 'containerd'],
    modelValue: true,
    desc: '(agent/runtime) Use docker instead of containerd'
  }
]
</script>
