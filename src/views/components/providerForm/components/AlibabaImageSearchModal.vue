<script setup>
import { toRef, ref, computed, watch } from 'vue'
import Pagination from '@/components/Pagination'

const props = defineProps({
  region: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  },
  instanceType: {
    type: String,
    default: null
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
const imageOwnerAlias = ref(props.imageInfo.imageOwnerAlias ?? null)
// const instanceType = ref(props.imageInfo.instanceType)
// const OSType = ref(props.imageInfo.OSType)
const architecture = ref(props.imageInfo.architecture)
const query = ref(props.imageInfo.query)
const field = ref(props.imageInfo.field)
const fields = ref(['ImageName', 'ImageId'])
const currentPage = computed({
  get() {
    return props.imageInfo.pageNumber
  },
  set(p) {
    props.fetchImages(props.region, {
      imageOwnerAlias: props.imageInfo.imageOwnerAlias,
      // instanceType: props.imageInfo.instanceType,
      // OSType: props.imageInfo.OSType,
      architecture: props.imageInfo.architecture,
      query: props.imageInfo.query,
      field: props.imageInfo.field,
      pageNumber: p
    })
  }
})

watch(field, (f) => {
  if (f === 'ImageId') {
    architecture.value = ''
    imageOwnerAlias.value = ''
  }
})

const searchImages = () => {
  props.fetchImages(props.region, {
    imageOwnerAlias: imageOwnerAlias.value,
    // instanceType: instanceType.value,
    // OSType: OSType.value,
    architecture: architecture.value,
    query: query.value,
    field: field.value
  })
}
</script>

<template>
  <KModal :model-value="visible">
    <template #title>Search Images</template>
    <template #default>
      <KLoading :loading="imageInfo.loading" class="w-60vw min-h-60vh">
        <div class="grid gap-2 place-content-center mb-2">
          <div class="grid grid-cols-[120px,400px,max-content] gap-2">
            <select v-model="field" class="border rounded focus-visible:outline-none px-12px">
              <option v-for="f in fields" :key="f" :value="f">{{ f }}</option>
            </select>
            <input
              v-model="query"
              type="search"
              placeholder="Filter image name or image id"
              class="border rounded px-12px hover:bg-gray-100 focus-visible:outline-none"
              @keyup.enter="searchImages"
            />
            <KButton :disabled="imageInfo.loading" class="role-primary self-start" @click="searchImages">Query</KButton>
          </div>
          <div class="grid grid-cols-[auto,auto,auto,1fr] gap-2 justify-self-start">
            Architecture:
            <label>
              <input v-model="architecture" type="radio" value="i386" />
              i386
            </label>
            <label>
              <input v-model="architecture" type="radio" value="x86_64" />
              x86_64
            </label>
            <label>
              <input v-model="architecture" type="radio" value="arm64" />
              arm64
            </label>
          </div>
          <div class="grid grid-cols-[auto,auto,auto,auto,1fr] gap-2 justify-self-start">
            Image Owner Alias:
            <label>
              <input v-model="imageOwnerAlias" type="radio" value="system" />
              System
            </label>
            <label>
              <input v-model="imageOwnerAlias" type="radio" value="self" />
              Self
            </label>
            <label>
              <input v-model="imageOwnerAlias" type="radio" value="others" />
              Others
            </label>
            <label>
              <input v-model="imageOwnerAlias" type="radio" value="marketplace" />
              Marketplace
            </label>
          </div>
        </div>

        <div v-if="imageInfo.error">{{ imageInfo.error }}</div>
        <div class="grid gap-4">
          <div
            v-for="d in data"
            :key="d.ImageId"
            class="odd:bg-gray-50 even:bg-light-50 p-y-4 grid grid-cols-[1fr,max-content] items-center"
          >
            <div>
              <div>Image ID: {{ d.ImageId }}</div>
              <div>Name: {{ d.ImageName }}</div>
              <div>Platform: {{ d.Platform }}</div>
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
        <Pagination
          v-model:current-page="currentPage"
          :total="imageInfo.totalCount"
          :page-size="imageInfo.pageSize"
        ></Pagination>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-secondary" @click="$emit('close')">Cancel</k-button>
    </template>
  </KModal>
</template>
