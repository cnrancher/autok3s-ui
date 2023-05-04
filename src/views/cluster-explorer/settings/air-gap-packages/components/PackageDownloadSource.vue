<script setup>
import { computed, ref } from 'vue'
import useRequest from '@/composables/useRequest.js'
import { fetchPackageSouce, updatePackageSource } from '@/api/package.js'

const sourceOptions = ref([
  {
    label: 'Github Source',
    value: 'github'
  },
  {
    label: 'AliyunOSS Source',
    value: 'aliyunoss'
  }
])

const {
  data: source,
  loading,
  error,
  refetch
} = useRequest((signal) => {
  return fetchPackageSouce(signal)
})

const currentPackageSource = computed(() => {
  return sourceOptions.value.find((o) => o.value === source.value?.value)
})

const update = async (d) => {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    const data = {
      name: 'package-download-source',
      value: d
    }
    await updatePackageSource(data)
    await refetch()
  } catch (err) {
    error.value = err
  }
  loading.value = false
}
</script>
<template>
  <KDropdown v-if="currentPackageSource">
    <div class="btn role-secondary flex items-center cursor-pointer gap-1">
      {{ currentPackageSource.label }}
      <KIcon type="arrow-right" direction="down" />
    </div>
    <template #content>
      <KDropdownMenu v-for="s in sourceOptions" :key="s.value" @click="update(s.value)">
        <KDropdownMenuItem :class="[currentPackageSource.value === s.value ? 'text-white bg-warm-gray-400' : '']">
          {{ s.label }}
        </KDropdownMenuItem>
      </KDropdownMenu>
    </template>
  </KDropdown>
</template>
