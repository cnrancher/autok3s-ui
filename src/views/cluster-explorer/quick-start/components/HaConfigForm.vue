<script setup>
import { computed, reactive, watch } from 'vue'
import useFormRegist from '@/composables/useFormRegist.js'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import BooleanForm from '@/views/components/baseForm/BooleanForm.vue'

// only use Embedded etcd, ignore External DB
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
  // initMasterCount: {
  //   type: Number,
  //   default: 0
  // },
  // initWorkerCount: {
  //   type: Number,
  //   default: 0
  // },
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
const configFields = ['master', 'worker', 'cluster']
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

const hideMasterAndWorkerConfig = computed(() => {
  return props.workerDisabled && props.masterDisabled
})

// watch(
//   () => props.initValue?.config,
//   (c) => {
//     if (c?.['datastore']) {
//       config['cluster'] = true
//     }
//   },
//   { immediate: true }
// )

watch(
  () => config['master'],
  (master) => {
    const m = parseInt(master, 10)
    if (m <= 1) {
      config['cluster'] = false
    } else {
      config['cluster'] = true
    }
  },
  { immediate: true }
)

watch(
  () => config['cluster'],
  (c) => {
    if (!c) {
      config['master'] = '1'
    }
  },
  { immediate: true }
)

// watch(
//   [() => props.initMasterCount, () => props.initWorkerCount],
//   ([m, w]) => {
//     if (m > 0) {
//       config['master'] = `${m}`
//       if (m <= 1) {
//         config['cluster'] = false
//       } else {
//         config['cluster'] = true
//       }
//     }
//     if (w > 0) {
//       config['worker'] = `${w}`
//     }
//   },
//   {
//     immediate: true
//   }
// )

const getForm = () => {
  const f = configFields.map((k) => {
    return {
      path: ['config', k],
      value: config[k]
    }
  })

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
      :disabled="masterDisabled"
    />
    <StringForm
      v-if="!hideMasterAndWorkerConfig"
      v-model.trim="config['worker']"
      label="Worker"
      :desc="desc.config['worker']"
      :disabled="workerDisabled"
    />
    <BooleanForm v-model="config['cluster']" label="High Availability Clusters" :readonly="readonly" />
    <KSelect
      v-show="config['cluster']"
      :model-value="config['cluster']"
      label="Datastore Type"
      :desc="desc.config['cluster']"
      :disabled="readonly"
    >
      <KOption :value="true" label="Embedded etcd"></KOption>
    </KSelect>
  </div>
</template>
