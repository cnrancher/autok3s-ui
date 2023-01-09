<script setup>
import { computed, reactive, ref, watch } from 'vue'
import KeyForm from '../../../components/baseForm/KeyForm.vue'
import useFormRegist from '@/composables/useFormRegist.js'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import BooleanForm from '@/views/components/baseForm/BooleanForm.vue'

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
  initMasterCount: {
    type: Number,
    default: 0
  },
  initWorkerCount: {
    type: Number,
    default: 0
  },
  workerDisabled: {
    type: Boolean,
    default: false
  },
  masterDisabled: {
    type: Boolean,
    default: false
  }
})

const config = reactive({})
const configFields = [
  'master',
  'worker',
  'cluster',
  'datastore',
  'datastore-cafile-content',
  'datastore-certfile-content',
  'datastore-keyfile-content'
]
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
const masterFormDisabled = computed(() => {
  return !HAClusters.value
})

const hideMasterAndWorkerConfig = computed(() => {
  return props.workerDisabled && (masterFormDisabled.value || props.masterDisabled)
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

// watch([HAClusters, () => config['cluster'], () => config['datastore']], ([ha, c, d]) => {
//   if (ha && c === false && !d) {
//     emit('errors', ['"Datastore Endpoint" is required'])
//   } else {
//     emit('errors', [])
//   }
// })

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

const getForm = () => {
  const f = configFields.map((k) => {
    return {
      path: ['config', k],
      value: config[k]
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
  if (HAClusters.value && config['cluster'] === false && !config['datastore']) {
    errors.push('"Datastore Endpoint" is required')
  }
  return errors
}
useFormRegist(getForm, validate)
</script>
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <StringForm
      v-if="!hideMasterAndWorkerConfig"
      v-model.trim="config['master']"
      label="Master"
      :desc="desc.config['master']"
      :disabled="masterFormDisabled || masterDisabled"
    />
    <StringForm
      v-if="!hideMasterAndWorkerConfig"
      v-model.trim="config['worker']"
      label="Worker"
      :desc="desc.config['worker']"
      :disabled="workerDisabled"
    />
    <BooleanForm
      v-model="HAClusters"
      label="High Availability Clusters"
      :readonly="readonly"
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
