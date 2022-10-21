<template>
  <KModal :model-value="visible">
    <template #title>View/Update Install Script</template>
    <template #default>
      <KLoading :loading="loading">
        <div v-if="errors.length">
          <KAlert v-for="(e, index) in errors" :key="index" type="error" :title="e"></KAlert>
        </div>
        <div v-else>
          <div class="grid grid-cols-2 gap-10px pb-20px min-w-600px">
            <KInput v-model.trim="form.name" label="Name" placeholder="e.g. test" disabled required />

            <KInput v-model.trim="form.k3sVersion" label="K3s Version" placeholder="e.g. v1.25.2+k3s1" required />
            <KSelect v-model="form.archs" label="Included Archs" placeholder="Please select archs..." multiple>
              <KOption value="amd64" label="amd64"></KOption>
              <KOption value="arm64" label="arm64"></KOption>
              <KOption value="arm" label="arm"></KOption>
            </KSelect>
          </div>
        </div>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-secondary" @click="close">Cancel</k-button>
      <k-button class="role-primary" :disabled="updating || loading" @click="updatePackage">Save</k-button>
    </template>
  </KModal>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { fetchById, update } from '@/api/package.js'
import useRequest from '@/composables/useRequest.js'
import Schema from 'async-validator'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  id: {
    type: [String, Number],
    required: true
  }
})
const emit = defineEmits(['close'])
const descriptor = {
  k3sVersion: {
    required: true,
    message: '"K3sVersion" is required'
  },
  archs: {
    required: true,
    message: '"Archs" is required'
  }
}

const validator = new Schema(descriptor)
const updating = ref(false)
const close = () => {
  emit('close')
}

const { data, loading, error } = useRequest(() => {
  return fetchById(props.id)
})

const form = ref({})
watch(
  data,
  (v) => {
    form.value = { ...v }
  },
  { immediate: true }
)

const validErrors = ref([])
const updateError = ref(null)

const errors = computed(() => {
  return [error.value, updateError.value, ...validErrors.value].filter((e) => e)
})

const updatePackage = async () => {
  try {
    await validator.validate(form.value)
  } catch ({ errors, fields }) {
    validErrors.value = errors.map((e) => e.message)
    return
  }

  updating.value = true
  try {
    await update(props.id, form.value)
    close()
  } catch (err) {
    updateError.value = error
  }
  updating.value = false
}
</script>
