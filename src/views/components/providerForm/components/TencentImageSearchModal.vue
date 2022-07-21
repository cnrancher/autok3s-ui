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
const instanceType = ref(props.imageInfo.instanceType)
const imageType = ref(props.imageInfo.imageType)
const platform = ref(props.imageInfo.platform)
const query = ref(props.imageInfo.query)
const field = ref(props.imageInfo.field)
const fields = ref(['image-name', 'image-id'])
const currentPage = computed({
  get() {
    if (props.imageInfo.total === 0 || props.imageInfo.limit === 0 || props.imageInfo.offset === 0) {
      return 1
    }

    return Math.ceil(props.imageInfo.offset / props.imageInfo.limit) + 1
  },
  set(p) {
    props.fetchImages(props.region, {
      instanceType: props.imageInfo.instanceType,
      imageType: props.imageInfo.imageType,
      platform: props.imageInfo.platform,
      query: props.imageInfo.query,
      field: props.imageInfo.field,
      offset: (p - 1) * props.imageInfo.limit
    })
  }
})

watch(field, (f) => {
  if (f === 'image-id') {
    platform.value = ''
    imageType.value = ''
    instanceType.value = ''
  }
})

const searchImages = () => {
  props.fetchImages(props.region, {
    instanceType: instanceType.value,
    imageType: imageType.value,
    platform: platform.value,
    offset: 0,
    total: 0,
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
          <div class="grid grid-cols-[auto,auto,auto,auto,1fr] gap-2 justify-self-start">
            Image Type:
            <label>
              <input v-model="imageType" type="radio" value="" />
              All
            </label>
            <label>
              <input v-model="imageType" type="radio" value="PRIVATE_IMAGE" />
              Private Image
            </label>
            <label>
              <input v-model="imageType" type="radio" value="PUBLIC_IMAGE" />
              Public Image
            </label>
            <label>
              <input v-model="imageType" type="radio" value="SHARED_IMAGE" />
              Shared Image
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
          :total="imageInfo.total"
          :page-size="imageInfo.limit"
        ></Pagination>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-secondary" @click="$emit('close')">Cancel</k-button>
    </template>
  </KModal>
</template>
