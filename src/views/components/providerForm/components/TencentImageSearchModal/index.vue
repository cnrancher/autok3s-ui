<script setup>
import { toRef, ref, computed, reactive, watch } from 'vue'
import { useCentOSImages } from './useCentOSImages.js'
import { useUbuntuImages } from './useUbuntuImages.js'
import { useDebianImages } from './useDebianImages.js'
import { useOpenSuseImages } from './useOpenSuseImages.js'
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
  props.fetchImages(props.region)
}
if (props.imageInfo.loaded === false && props.imageInfo.loading === false) {
  loadImages()
}

const platformImage = reactive({
  Ubuntu: useUbuntuImages(data),
  openSUSE: useOpenSuseImages(data),
  CentOS: useCentOSImages(data),
  Debian: useDebianImages(data)
})
const logoMap = {
  Ubuntu,
  openSUSE,
  CentOS,
  Debian
}

const platforms = computed(() => {
  return data.value.map((item) => ({
    value: item.platform,
    label: item.platform,
    logo: logoMap[item.platform]
  }))
})

const platform = ref('Ubuntu')
const formData = ['Ubuntu', 'openSUSE', 'CentOS', 'Debian'].reduce((t, c) => {
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
        <div v-if="imageInfo.error">{{ imageInfo.error }}</div>
        <div class="grid gap-10px grid-cols-1 sm:grid-cols-2 mb-20px">
          <KSelect v-model="platform" label="OS" required @change="handlePlatformChanged">
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
              :label="image.ImageName"
            ></KOption>
          </KSelect>
        </div>
        <div v-if="selectedImage" class="grid grid-cols-[auto,1fr] gap-2 items-center bg-gray-100 p-10px">
          <div class="text-center">
            <!-- {{selectedPlatform?.label}} -->
            <img :src="selectedPlatform?.logo" class="object-contain w-70px h-70px" />
          </div>
          <div>
            <div>{{ selectedImage?.ImageDescription }}</div>
            <div>
              <div>{{ selectedImage?.ImageId }}({{ selectedImage?.Architecture }})</div>
            </div>
            <div class="flex gap-2 text-sm text-gray-500">
              <div>Is Support Cloudinit: {{ selectedImage?.VirtualizationType }}</div>
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
