<script setup>
import { ref, toRef, watch, computed, reactive } from 'vue'
import { useUbuntuImages } from './useUbuntuImages.js'
import { useUbuntuProImages } from './useUbuntuProImages.js'
import { useSuseImages } from './useSuseImages.js'
// import { useCentOSImages } from './useCentOSImages.js';
import { useDebianImages } from './useDebianImages.js'
import { useRedHatImages } from './useRedHatImages.js'
import ubuntu from '@/styles/images/brand/ubuntu.svg'
import suseLinux from '@/styles/images/brand/suseLinux.svg'
import redHat from '@/styles/images/brand/redHat.svg'
import debian from '@/styles/images/brand/debian.svg'

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

const emit = defineEmits(['close', 'select'])
const data = toRef(props.imageInfo, 'data')
const loadImages = () => {
  props.fetchImages()
}
if (props.imageInfo.loaded === false && props.imageInfo.loading === false) {
  loadImages()
}
const logoMap = {
  'ubuntu-os-cloud': ubuntu,
  'ubuntu-os-pro-cloud': ubuntu,
  'suse-cloud': suseLinux,
  'debian-cloud': debian,
  'rhel-cloud': redHat
}
const platforms = computed(() => {
  return data.value.map((item) => ({
    label: item.label,
    value: item.value,
    logo: logoMap[item.value]
  }))
})

const platformImage = reactive({
  'ubuntu-os-cloud': useUbuntuImages(data),
  'ubuntu-os-pro-cloud': useUbuntuProImages(data),
  'suse-cloud': useSuseImages(data),
  // 'centos-cloud': useCentOSImages(data),
  'debian-cloud': useDebianImages(data),
  'rhel-cloud': useRedHatImages(data)
})

const platform = ref('ubuntu-os-cloud')
const formData = ['ubuntu-os-cloud', 'ubuntu-os-pro-cloud', 'suse-cloud', 'debian-cloud', 'rhel-cloud'].reduce(
  (t, c) => {
    t[c] = {
      version: '',
      arch: '',
      buildVersion: ''
    }

    return t
  },
  {}
)
const form = reactive(formData)
const archOptions = computed(() => {
  const p = platform.value
  const { version, buildVersion } = form[p]
  const { nameMap, getImageName, parseArch } = platformImage[p]
  const n = getImageName(version, buildVersion)
  const arches = nameMap.get(n)?.map((item) => parseArch(item)) ?? []
  arches.sort()

  return arches.map((item) => ({
    value: item,
    label: item
  }))
})

const buildVersionOptions = computed(() => {
  const p = platform.value
  const { version } = form[p]
  const { versionMap } = platformImage[p]
  return (
    versionMap
      .get(version)
      ?.slice(0, 10)
      .map((item) => ({
        value: item,
        label: item
      })) ?? []
  )
})
// init form
watch(
  [data, platform],
  // eslint-disable-next-line no-unused-vars
  ([_, p]) => {
    let { version, arch, buildVersion } = form[p]
    const { versionOptions, nameMap, versionMap, getImageName, parseArch } = platformImage[p]

    version = versionOptions[0]?.value
    form[p].version = version

    buildVersion = versionMap.get(version)?.[0]
    form[p].buildVersion = buildVersion

    const n = getImageName(version, buildVersion)
    const archs = nameMap.get(n)?.map((item) => parseArch(item)) ?? []
    archs.sort()
    arch = archs[0] ?? ''
    form[p].arch = arch
  },
  { immediate: true }
)
const selectedPlatform = computed(() => {
  const p = platform.value
  return platforms.value.find((item) => item.value === p)
})
const selectedImage = computed(() => {
  const p = platform.value
  const { nameMap, getImageName, parseArch } = platformImage[p]
  const { version, arch, buildVersion } = form[p]
  return nameMap.get(getImageName(version, buildVersion))?.find((item) => parseArch(item) === arch)
})

const handleVersionChanged = () => {
  form[platform.value].buildVersion = buildVersionOptions.value[0]?.value
  form[platform.value].arch = archOptions.value[0]?.value
}
const handleBuildVersionChanged = () => {
  form[platform.value].arch = archOptions.value[0]?.value
}
const handleSelect = () => {
  const image = selectedImage.value
  emit('select', { ...image, imageId: `${platform.value}/global/images/${image.name}` })
  emit('close')
}
</script>
<template>
  <KModal :model-value="visible">
    <template #title>Public Images</template>
    <template #default>
      <KLoading :loading="imageInfo.loading" class="w-60vw min-h-60vh">
        <div v-if="imageInfo.error">{{ imageInfo.error }}</div>
        <div class="grid gap-10px grid-cols-1 sm:grid-cols-2 mb-20px">
          <KSelect v-model="platform" label="OS" required>
            <KOption v-for="p in platforms" :key="p.value" :value="p.value" :label="p.label">
              <div class="flex gap-2">
                <img :src="p.logo" class="object-contain w-30px h-24px" />
                {{ p.label }}
              </div>
            </KOption>
          </KSelect>
          <KSelect v-model="form[platform].version" label="Version" required @change="handleVersionChanged">
            <KOption
              v-for="v in platformImage[platform].versionOptions"
              :key="v.value"
              :value="v.value"
              :label="v.label"
            ></KOption>
          </KSelect>
          <KSelect
            v-model="form[platform].buildVersion"
            label="Build Version"
            required
            @change="handleBuildVersionChanged"
          >
            <KOption v-for="v in buildVersionOptions" :key="v.value" :value="v.value" :label="v.label"></KOption>
          </KSelect>
          <KSelect v-model="form[platform].arch" label="Arch" required>
            <KOption v-for="a in archOptions" :key="a.value" :value="a.value" :label="a.label"></KOption>
          </KSelect>
        </div>
        <div v-if="selectedImage" class="grid grid-cols-[auto,1fr] gap-2 items-center bg-gray-100 p-10px">
          <div class="text-center">
            <!-- {{selectedPlatform?.label}} -->
            <img :src="selectedPlatform?.logo" class="object-contain w-70px h-70px" />
          </div>
          <div>
            <div>{{ selectedImage?.description }}</div>
            <div>
              <div>{{ selectedImage?.name }}</div>
            </div>
            <div class="flex gap-2 text-sm text-gray-500">
              <div>Family: {{ selectedImage?.family }}</div>
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
