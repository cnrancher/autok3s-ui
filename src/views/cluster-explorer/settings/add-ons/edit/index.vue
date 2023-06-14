<template>
  <div>
    <PageHeader>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerSettingsAddOns' }">Add-ons:</router-link>
        Edit
      </template>
    </PageHeader>
    <KLoading :loading="loading || saving">
      <AddonsForm ref="form" :init-value="initValue" mode="edit"></AddonsForm>
    </KLoading>
    <KAlert v-for="(e, index) in errors" :key="index" type="error" :title="e"></KAlert>
    <FooterActions>
      <router-link :to="{ name: 'ClusterExplorerSettingsAddOns' }" class="btn role-secondary">Cancel</router-link>
      <KButton class="role-primary" type="button" :loading="saving" @click="save">Save</KButton>
    </FooterActions>
  </div>
</template>
<script setup>
import { reactive, ref, watch } from 'vue'
import FooterActions from '@/views/components/FooterActions.vue'
import PageHeader from '@/views/components/PageHeader.vue'
import AddonsForm from '../components/AddonsForm.vue'
import { update, fetchById } from '@/api/addon.js'
import { useRouter, useRoute } from 'vue-router'
import { stringify } from '@/utils/error.js'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const router = useRouter()
const route = useRoute()
const form = ref(null)
const errors = ref([])
const saving = ref(false)
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
const save = async () => {
  const result = await form.value.validate()
  if (!result) {
    return
  }
  const d = form.value.getForm()
  saving.value = true
  try {
    await update(route.params.id, d)
    router.push({ name: 'ClusterExplorerSettingsAddOns' })
  } catch (err) {
    errors.value = [stringify(err)]
  }
  saving.value = false
}
</script>
