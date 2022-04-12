<template>
  <k-button class="btn-sm role-primary" @click="modalVisible=true">
    <k-icon type="terminal"></k-icon>
    &nbsp; Launch Kubectl
  </k-button>
  <k-modal v-model="modalVisible">
      <template #title>Please Select A Cluster To Execute Kubectl Command</template>
      <template #default>
        <k-select
          v-model="kubectlContext"
          :loading="loading"
          label="Cluster" 
          placeholder="Please Select A Context..."
          required>
          <k-option v-for="c in contexts" :key="c.id" :value="c.id" :label="`${c.context}(${c.id})`"></k-option>
        </k-select>
        <Alert v-for="(e, index) in formErrors" :key="index" type="error" :title="e"></Alert>
        <Alert v-if="error" type="error" :title="error"> </Alert>
         <Alert v-if="!loading && contexts.length === 0" type="error" title="Cluster not Found"></Alert>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="modalVisible = false">Cancel</k-button>
        <k-button class="role-primary" @click="showShell">Confirm</k-button>
      </template>
    </k-modal>
</template>

<script setup>
import {computed, ref, watchEffect} from 'vue'
import KIcon from '@/components/Icon'
import KButton from '@/components/Button'
import { Select as KSelect, Option as KOption} from '@/components/Select'
import KModal from "@/components/Modal"
import Alert from "@/components/Alert"
import useKubectlContext from '@/composables/useKubectlContext.js'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'

const wmStore = useWindownManagerStore()
const modalVisible = ref(false)
const {contexts, error, loading, fetchContexts} = useKubectlContext()
const kubectlContext = ref('')
const formErrors = ref([])
const selectedContext = computed(() => {
  return contexts.value.find((c) => c.id === kubectlContext.value)
})
watchEffect(() => {
  if (modalVisible.value) {
    kubectlContext.value = ''
    formErrors.value = []
    fetchContexts()
  }
})
const validate = () => {
  if (!kubectlContext.value) {
    formErrors.value = [`"Cluster Context" is required`]
  }
  return !error.value && formErrors.value.length === 0
}
const showShell = () => {
  if (!validate()) {
    return
  }
  modalVisible.value = false
  wmStore.addTab({
    id: `kubectl_${selectedContext.value.id}`,
    component: 'KubectlShell',
    label: `kubectl: ${selectedContext.value.context}(${selectedContext.value.id})`,
    icon: 'terminal',
    attrs: {
      contextId: selectedContext.value.id,
    }
  })
}

</script>
