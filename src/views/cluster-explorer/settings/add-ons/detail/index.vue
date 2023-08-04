<template>
  <div>
    <PageHeader>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerSettingsAddOns' }">Add-ons:</router-link>
        Detail
      </template>
    </PageHeader>
    <KLoading :loading="loading">
      <AddonsForm ref="form" :init-value="initValue" :readonly="true" mode="view"></AddonsForm>
    </KLoading>
    <KAlert v-for="(e, index) in errors" :key="index" type="error" :title="e"></KAlert>
    <FooterActions>
      <router-link :to="{ name: 'ClusterExplorerSettingsAddOns' }" class="btn role-secondary">Cancel</router-link>
    </FooterActions>
  </div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue'
import FooterActions from '@/views/components/FooterActions.vue'
import PageHeader from '@/views/components/PageHeader.vue'
import AddonsForm from '../components/Form.vue'
import { fetchById } from '@/api/addon.js'
import { stringify } from '@/utils/error.js'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const form = ref(null)
const errors = ref([])
const loading = ref(true)
const initValue = reactive({})

watch(
  () => props.id,
  async (id) => {
    if (!id) {
      loading.value = false
      errors.value = ['"ID" param is required']
      return
    }
    loading.value = true
    try {
      const d = await fetchById(id)
      Object.assign(initValue, d)
    } catch (err) {
      errors.value = [stringify(err)]
    }
    loading.value = false
  },
  { immediate: true }
)
</script>
