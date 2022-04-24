<script setup>
import YamlConfigForm from '@/views/components/baseForm/YamlConfigForm.vue'
import { reactive } from 'vue'
import { fetchKubeconfig } from '@/api/cluster.js'
import useRequest from '@/composables/useRequest.js'
import useClipboard from '@/composables/useClipboard.js'
import useNotificationStore from '@/store/useNotificationStore.js'
import { stringify } from '@/utils/error.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  clusterId: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['close'])
const options = reactive({
  readOnly: true
})
const notificationStore = useNotificationStore()
const close = () => {
  emit('close')
}

const {
  data: kubeconfig,
  loading,
  error
} = useRequest(() => {
  return fetchKubeconfig({ id: props.clusterId })
})
const { copy } = useClipboard()

const copyKubeconfig = async () => {
  try {
    await copy(kubeconfig.value.config)
    notificationStore.notify({
      type: 'success',
      title: 'Copy Kubeconfig Success'
    })
  } catch (err) {
    notificationStore.notify({
      type: 'error',
      title: 'Copy Kubeconfig Failed',
      content: stringify(err)
    })
  }
}
const download = async () => {
  const { saveAs } = await import('file-saver')
  const blob = new Blob([kubeconfig.value?.config], { type: 'application/yaml' })
  await saveAs(blob, `${props.clusterId}.yaml`)
}
</script>
<template>
  <k-modal :model-value="visible">
    <template #title>View KubeConfig</template>
    <template #default>
      <KLoading :loading="loading">
        <div v-if="error">{{ error }}</div>
        <div v-else>
          <YamlConfigForm :options="options" :model-value="kubeconfig.config"></YamlConfigForm>
          <KButton class="text-$primary" @click="copyKubeconfig">
            <KIcon type="clone"></KIcon>
            Copy to Clipboard
          </KButton>
          <KButton class="text-$primary" @click="download">
            <KIcon type="download"></KIcon>
            Download
          </KButton>
        </div>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-secondary" @click="close">Cancel</k-button>
    </template>
  </k-modal>
</template>
