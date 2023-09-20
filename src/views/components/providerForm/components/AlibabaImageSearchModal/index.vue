<script setup>
import { toRef, ref, computed, watch, reactive } from 'vue'
import { useImages } from './useImages.js'
import Ubuntu from '@/styles/images/brand/ubuntu.svg'
import openSUSE from '@/styles/images/brand/suse.svg'
import CentOS from '@/styles/images/brand/centos.svg'
import Debian from '@/styles/images/brand/debian.svg'

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

const emit = defineEmits(['close', 'select'])

const data = toRef(props.imageInfo, 'data')
const loadImages = () => {
  props.fetchImages(props.region, props.instanceType)
}
if (props.imageInfo.loaded === false && props.imageInfo.loading === false) {
  loadImages()
}
const logoMap = {
  Ubuntu,
  openSUSE,
  CentOS,
  'CentOS Stream': CentOS,
  Debian
}

const platformImage = reactive({
  Ubuntu: useImages(data, 'Ubuntu'),
  openSUSE: useImages(data, 'openSUSE'),
  CentOS: useImages(data, 'CentOS'),
  'CentOS Stream': useImages(data, 'CentOS Stream'),
  Debian: useImages(data, 'Debian')
})

const platforms = computed(() => {
  return data.value.map((item) => ({
    value: item.platform,
    label: item.platform,
    logo: logoMap[item.platform]
  }))
})

const platform = ref('Ubuntu')
const formData = ['Ubuntu', 'openSUSE', 'CentOS', 'CentOS Stream', 'Debian'].reduce((t, c) => {
  t[c] = {
    imageId: '',
    image: null,
    arch: ''
  }
  return t
}, {})
const form = reactive(formData)
const handleArchChanged = (arch) => {
  const p = platform.value
  form[p].imageId = platformImage[p].imageArchMap.get(arch)?.[0]?.ImageId ?? ''
}
const handlePlatformChanged = (p) => {
  const arch = platformImage[p]?.arches?.[0] ?? ''
  form[p].arch = arch
  form[p].imageId = platformImage[p].imageArchMap.get(arch)?.[0]?.ImageId ?? ''
}

watch(
  [data, platform],
  // eslint-disable-next-line no-unused-vars
  ([_, p]) => {
    handlePlatformChanged(p)
  },
  { immediate: true }
)

const selectedPlatform = computed(() => {
  const p = platform.value
  return platforms.value.find((item) => item.value === p)
})
const selectedImage = computed(() => {
  const p = platform.value
  const { imageId, arch } = form[p]

  return platformImage[p].imageArchMap.get(arch)?.find((item) => item.ImageId === imageId)
})
const handleSelect = () => {
  emit('select', selectedImage.value)
  emit('close')
}
</script>

<template>
  <KModal :model-value="visible">
    <template #title>Search Images</template>
    <template #default>
      <KLoading :loading="imageInfo.loading" class="w-60vw min-h-60vh">
        <KAlert v-if="imageInfo.error" type="error" :title="imageInfo.error"></KAlert>
        <div class="grid gap-10px grid-cols-1 sm:grid-cols-2 mb-20px">
          <KSelect v-model="platform" label="OS" required>
            <KOption v-for="p in platforms" :key="p.value" :value="p.value" :label="p.label">
              <div class="flex gap-2">
                <img :src="p.logo" class="object-contain w-30px h-24px" />
                {{ p.label }}
              </div>
            </KOption>
          </KSelect>
          <KSelect v-model="form[platform].arch" label="Arch" required @change="handleArchChanged">
            <KOption v-for="v in platformImage[platform].arches" :key="v" :value="v" :label="v"></KOption>
          </KSelect>
          <KSelect v-model="form[platform].imageId" label="Image" required>
            <KOption
              v-for="image in platformImage[platform].imageArchMap.get(form[platform].arch) ?? []"
              :key="image.ImageId"
              :value="image.ImageId"
              :label="image.OSNameEn ?? image.OSName"
            ></KOption>
          </KSelect>
        </div>
        <div v-if="selectedImage" class="grid grid-cols-[auto_1fr] gap-2 items-center bg-gray-100 p-10px">
          <div class="text-center">
            <!-- {{selectedPlatform?.label}} -->
            <img :src="selectedPlatform?.logo" class="object-contain w-70px h-70px" />
          </div>
          <div>
            <div>{{ selectedImage?.OSNameEN ?? selectedImage?.OSName }}</div>
            <div>
              <div>{{ selectedImage?.ImageName }}({{ selectedImage?.Architecture }})</div>
            </div>
            <div class="flex gap-2 text-sm text-gray-500">
              <div>Is Support Cloudinit: {{ selectedImage?.IsSupportCloudinit }}</div>
            </div>
          </div>
        </div>
      </KLoading>
    </template>
    <template #footer>
      <k-button class="role-primary" :disabled="!selectedImage" @click="handleSelect">Confirm</k-button>
      <k-button class="role-secondary" @click="$emit('close')">Cancel</k-button>
    </template>
  </KModal>
</template>
