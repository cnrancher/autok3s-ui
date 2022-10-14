<script setup>
import { ref, toRef, watch } from 'vue'
import usePagination from '@/composables/usePagination.js'
import Pagination from '@/components/Pagination'
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  imageInfo: {
    type: Object,
    required: true
  },
  fetchImages: {
    type: Function,
    required: true
  }
})

defineEmits(['close', 'select'])
const data = toRef(props.imageInfo, 'data')

const { pageData, currentPage, total, pageSize } = usePagination(data)
pageSize.value = 10

const OSOptions = [
  {
    label: 'Ubuntu LTS',
    value: 'ubuntu-os-cloud'
  },
  {
    label: 'Ubuntu Pro',
    value: 'ubuntu-os-pro-cloud'
  },
  {
    label: 'SUSE Linux Enterprise Server (SLES)',
    value: 'suse-cloud'
  },
  {
    label: 'CentOS',
    value: 'centos-cloud'
  },
  {
    label: 'Debian',
    value: 'debian-cloud'
  },
  {
    label: 'Fedora CoreOS',
    value: 'fedora-coreos-cloud'
  },
  {
    label: 'Red Hat Enterprise Linux (RHEL)',
    value: 'rhel-cloud'
  },
  {
    label: 'Rocky Linux',
    value: 'rocky-linux-cloud'
  }
]
const project = ref(props.imageInfo.project ?? 'ubuntu-os-cloud')
watch(
  project,
  (p) => {
    props.fetchImages(p)
  },
  { immediate: true }
)
</script>
<template>
  <KModal :model-value="visible">
    <template #title>Search Images</template>
    <template #default>
      <KLoading :loading="imageInfo.loading" class="w-60vw min-h-60vh">
        <div class="grid grid-cols-[auto,400px] gap-2 place-content-center items-center mb-2">
          <div>OS:</div>
          <select v-model="project" class="border rounded focus-visible:outline-none px-12px h-40px">
            <option v-for="o in OSOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div v-if="imageInfo.error">{{ imageInfo.error }}</div>
        <div>
          <div v-for="d in pageData" :key="d.id" class="odd:bg-gray-50 even:bg-light-50 !hover:bg-gray-100 p-y-2">
            <div class="grid grid-cols-[1fr,max-content] items-center gap-2">
              <div>
                <div>Name: {{ d.name }}</div>
                <div>Description: {{ d.description ?? '-' }}</div>
                <div>Family: {{ d.family ?? '-' }}</div>
              </div>
              <KButton
                class="role-primary row-span-2"
                @click="
                  () => {
                    $emit('select', { image: `${project}/global/images/${d.name}` })
                    $emit('close')
                  }
                "
              >
                Choose
              </KButton>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-[1fr,auto] items-center">
          <Pagination v-model:current-page="currentPage" :total="total" :page-size="pageSize"></Pagination>
        </div>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-secondary" @click="$emit('close')">Cancel</k-button>
    </template>
  </KModal>
</template>
