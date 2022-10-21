<template>
  <KModal :model-value="visible">
    <template #title>View/Update Install Script</template>
    <template #default>
      <KLoading :loading="loading">
        <div v-if="errors.length">
          {{ errors.join('; ') }}
        </div>
        <div v-else>
          <KAlert
            v-if="!loading && !installScript"
            type="warning"
            title="The Install script is not available yet, you can get latest version by updating install script."
          ></KAlert>
          <ShellForm label="Install Script" :options="options" :model-value="installScript">
            <KButton class="btn-sm role-secondary" @click="update">Update Install Script</KButton>
          </ShellForm>
        </div>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-secondary" @click="close">Cancel</k-button>
    </template>
  </KModal>
</template>
<script setup>
import { computed, ref } from 'vue'
import ShellForm from './ShellForm.vue'
import { fetchInstallScript, updateInstallScript } from '@/api/package.js'
import useRequest from '@/composables/useRequest.js'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['close'])
const close = () => {
  emit('close')
}

const options = {
  readOnly: true
}

const { data, loading, error, refetch } = useRequest(() => {
  return fetchInstallScript()
})

const installScript = computed(() => {
  return data.value.value ?? ''
})

const updating = ref(false)
const updateError = ref(null)

const errors = computed(() => {
  const errors = []
  if (error.value) {
    errors.push(error.value)
  }
  if (updateError.value) {
    errors.push(updateError.value)
  }
  return errors
})

const update = async () => {
  updating.value = true
  try {
    await updateInstallScript(installScript.value)
    await refetch()
  } catch (err) {
    updateError.value = error
  }
  updating.value = false
}
</script>
