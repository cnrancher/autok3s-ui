<script setup>
import { computed, reactive, ref, watch } from 'vue'
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
  provider: {
    type: String,
    required: true
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
const HAClusters = ref(false)
const hideMasterAndWorkerConfig = computed(() => {
  return props.provider === 'native'
})
watch(
  () => props.initValue?.config,
  (c) => {
    if (c?.['cluster'] || c?.['datastore']) {
      HAClusters.value = true
    }
  },
  { immediate: true }
)
watch(HAClusters, (ha) => {
  if (!ha) {
    config['master'] = '1'
  }
})

watch(
  () => config['master'],
  (master) => {
    const m = parseInt(master, 10)
    if (m <= 1) {
      HAClusters.value = false
    } else {
      HAClusters.value = true
    }
  }
)

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
    } else if (!datastoreConfig.value) {
      clusterConfig.value = true
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

useFormRegist(getForm)
</script>
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <StringForm
      v-if="!hideMasterAndWorkerConfig"
      v-model.trim="config['master']"
      label="Master"
      :desc="desc.config['master']"
    />
    <StringForm
      v-if="!hideMasterAndWorkerConfig"
      v-model.trim="config['worker']"
      label="Worker"
      :desc="desc.config['worker']"
    />
    <BooleanForm v-model="HAClusters" label="High Availability Clusters" :readonly="readonly" />
  </div>
</template>
