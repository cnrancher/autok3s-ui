<template>
  <k-button class="k-kubectl-btn role-tertiary" @click="modalVisible=true">
    <k-icon type="terminal"></k-icon>
    &nbsp; Launch Kubectl
  </k-button>
  <k-modal v-model="modalVisible">
      <template #title>Please Select A Cluster To Execute Kubectl Command</template>
      <template #default>
        <k-select
          :loading="loading"
          label="Cluster"
          v-model="kubectlContext" 
          placeholder="Please Select A Context..."
          required>
          <k-option v-for="c in contexts" :key="c.id" :value="c.id" :label="`${c.context}(${c.id})`"></k-option>
        </k-select>
        <alert v-for="(e, index) in formErrors" type="error" :key="index" :title="e"></alert>
        <alert v-if="error" type="error" :title="error"> </alert>
         <alert v-if="!loading && contexts.length === 0" type="error" title="Cluster not Found"></alert>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="modalVisible = false">Cancel</k-button>
        <k-button class="role-primary" @click="showShell">Confirm</k-button>
      </template>
    </k-modal>
</template>
<script>
import {computed, defineComponent, inject, ref, watchEffect} from 'vue'
import KIcon from '@/components/Icon'
import KButton from '@/components/Button'
import { Select as KSelect, Option as KOption} from '@/components/Select'
import KModal from "@/components/Modal"
import Alert from "@/components/Alert"
import useKubectlContext from '@/composables/useKubectlContext.js'


export default defineComponent({
  setup() {
    const wmStore = inject('windowManagerStore')
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
      wmStore.action.addTab({
        id: `kubectl_${selectedContext.value.id}`,
        component: 'KubectlShell',
        label: `kubectl: ${selectedContext.value.context}(${selectedContext.value.id})`,
        icon: 'terminal',
        attrs: {
          contextId: selectedContext.value.id,
        }
      })
    }
    return {
      kubectlContext,
      contexts,
      error,
      formErrors,
      loading,
      modalVisible,
      showShell,
    }
  },
  components: {
    KIcon,
    KButton,
    KModal,
    KSelect,
    KOption,
    Alert,
  }
})
</script>
<style scoped>
.k-kubectl-btn {
  border: none;
  background: var(--header-btn-bg);
  color: var(--header-btn-text);
  padding: 0 10px;
  line-height: 32px;
  min-height: 32px;
  &:hover {
    background: var(--primary);
    color: #fff;
  }
  &.btn:focus {
    box-shadow: none;
  }
}
</style>
