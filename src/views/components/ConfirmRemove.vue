<template>
  <KModal :model-value="visible">
    <template #title>Are you sure?</template>
    <template #default>
      <div>
        <p>You are attemping to remove the {{ resources.length === 1 ? type : plural || type }}:</p>
        <p class="text-light-blue-500">
          <template v-for="(p, index) in resources" :key="p.id">
            {{ p.name }}
            {{ index === resources.length - 1 ? '' : ',' }}
          </template>
        </p>
      </div>
    </template>
    <template #footer>
      <k-button class="role-secondary" @click="close">Cancel</k-button>
      <k-button class="role-danger" @click="remove(resources)">Delete</k-button>
    </template>
  </KModal>
</template>
<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  resources: {
    type: Array,
    required: true
  },
  plural: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'confirm'])
const remove = (resources) => {
  emit('confirm', resources)
  close()
}
const close = () => {
  emit('close')
}
</script>
