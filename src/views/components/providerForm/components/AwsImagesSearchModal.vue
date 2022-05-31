<script setup>
import { ref, toRef, watch } from 'vue'
import usePagination from '@/composables/usePagination.js'
import Pagination from '@/components/Pagination'
const props = defineProps({
  // volumeType: {
  //   type: String,
  //   default: 'gp2' // io1 | io2 | gp2 | gp3 | sc1 | st1 | standard
  // },
  region: {
    type: String,
    required: true
  },
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
const defaultArch = props.imageInfo.arch ?? ref(['x86_64'])
const query = ref(props.imageInfo.query) ?? ref('')
const owners = ref([...props.imageInfo.owners]) ?? ref(['self', 'amazon', 'aws-marketplace'])
const field = ref(props.imageInfo.field) ?? ref('name')
const fields = ref(['name', 'description', 'image-id'])

const { pageData, currentPage, total, pageSize } = usePagination(data)
pageSize.value = 10
const searchQuery = ref(query)
const arch = ref([...defaultArch])
const virtualizationType = ref([...props.imageInfo.virtualizationType])
// const platform = ref([...props.imageInfo.platform])
// const allLinusOrUnixPlatforms = ref(['linux'])
// const allWindowsPlatforms = ref(['windows'])

const searchImages = () => {
  props.fetchImages(props.region, {
    // volumeTypes: [props.volumeType],
    arch: [...arch.value],
    query: searchQuery.value,
    owners: [...owners.value],
    field: field.value,
    virtualizationType: [...virtualizationType.value]
    // platform: [...platform.value]
  })
}

watch(
  field,
  (v) => {
    if (v === 'image-id') {
      owners.value = []
      arch.value = []
      virtualizationType.value = []
    }
  },
  { immediate: true }
)
</script>
<template>
  <KModal :model-value="visible">
    <template #title>Search Amazon Machine Images (AMI)</template>
    <template #default>
      <KLoading :loading="imageInfo.loading" class="w-60vw min-h-60vh">
        <div class="grid grid-cols-[auto,400px,max-content] grid-rows-[40px,auto,auto] gap-2 place-content-center mb-2">
          <select v-model="field" class="border rounded focus-visible:outline-none px-12px">
            <option v-for="f in fields" :key="f" :value="f">{{ f }}</option>
          </select>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Filter name, description or image-id (case sensitive)"
            class="border rounded px-12px hover:bg-gray-100 focus-visible:outline-none"
            @keyup.enter="searchImages"
          />

          <KButton :disabled="imageInfo.loading" class="role-primary self-start" @click="searchImages">Query</KButton>
          <div class="col-span-3 grid gap-4 grid-cols-[auto,auto,auto,1fr] justify-self-start">
            Architecture:
            <label>
              <input v-model="arch" type="checkbox" value="i386" />
              i386
            </label>
            <label>
              <input v-model="arch" type="checkbox" value="x86_64" />
              x86_64
            </label>
            <label>
              <input v-model="arch" type="checkbox" value="arm64" />
              arm64
            </label>
          </div>
          <div class="col-span-3 grid gap-4 grid-cols-[auto,auto,auto,1fr] justify-self-start">
            Owners:
            <label>
              <input v-model="owners" type="checkbox" value="self" />
              Self
            </label>
            <label>
              <input v-model="owners" type="checkbox" value="amazon" />
              Amazon
            </label>
            <label>
              <input v-model="owners" type="checkbox" value="aws-marketplace" />
              AWS Marketplace
            </label>
          </div>
          <div class="col-span-3 grid gap-y-2 gap-x-4 grid-cols-[auto,auto,auto,1fr] justify-self-start">
            Virtualization Type
            <label>
              <input v-model="virtualizationType" type="checkbox" value="hvm" />
              HVM
            </label>
            <label>
              <input v-model="virtualizationType" type="checkbox" value="paravirtual" />
              Paravirtual
            </label>
          </div>
          <!-- <div class="col-span-3 grid gap-y-2 gap-x-4 grid-cols-[auto,auto,auto,1fr] justify-self-start">
            System OS(Linux/Unix)
            <label v-for="p in allLinusOrUnixPlatforms" :key="p">
              <input v-model="platform" type="checkbox" :value="p" />
              {{ p }}
            </label>
          </div>
          <div class="col-span-3 grid gap-y-2 gap-x-4 grid-cols-[auto,auto,auto,1fr] justify-self-start">
            System OS(Windows)
            <label v-for="p in allWindowsPlatforms" :key="p">
              <input v-model="platform" type="checkbox" :value="p" />
              {{ p }}
            </label>
          </div> -->
        </div>
        <div v-if="imageInfo.error">{{ imageInfo.error }}</div>
        <div class="grid gap-4">
          <div
            v-for="d in pageData"
            :key="d.ImageId"
            class="odd:bg-gray-50 even:bg-light-50 p-y-4 grid grid-cols-[1fr,max-content] items-center"
          >
            <div>
              <div>Image ID: {{ d.ImageId }}</div>
              <div>Name: {{ d.Name }}</div>
              <div>Description: {{ d.Description }}</div>
              <div>Architecture: {{ d.Architecture }}</div>
            </div>
            <KButton
              class="role-primary row-span-2"
              @click="
                () => {
                  $emit('select', d)
                  $emit('close')
                }
              "
            >
              Choose
            </KButton>
          </div>
        </div>
        <Pagination v-model:current-page="currentPage" :total="total" :page-size="pageSize"></Pagination>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-secondary" @click="$emit('close')">Cancel</k-button>
    </template>
  </KModal>
</template>
