<script setup>
import { computed, reactive, ref, toRef, watch } from 'vue'
import { startCase } from 'lodash-es'
import ubuntu from '@/styles/images/brand/ubuntu.svg'
import suseLinux from '@/styles/images/brand/suseLinux.svg'
import amazonLinux from '@/styles/images/brand/amazonLinux.svg'
import redHat from '@/styles/images/brand/redHat.svg'
import debian from '@/styles/images/brand/debian.svg'
import { useUbuntuImages } from './useUbuntuImages.js'
import { useAmazonLinuxImages } from './useAmazonLinuxImages.js'
import { useRedHatImages } from './useRedHatImages.js'
import { useSuseLinuxImages } from './useSuseLinuxImages.js'
import { useDebianImages } from './useDebianImages.js'

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

const {
  versionOptions: ubuntuVersionOptions,
  nameMap: ubuntuNameMap,
  versionMap: ubuntuVersionMap,
  getImageName: getUbuntuImageName
} = useUbuntuImages(data)
const {
  versionOptions: amazonLinuxVersionOptions,
  nameMap: amazonLinuxMap,
  versionMap: amazonLinuxVersionMap,
  getImageName: getAmazonLinuxImageName
} = useAmazonLinuxImages(data)
const {
  versionOptions: redHatVersionOptions,
  nameMap: redHatNameMap,
  versionMap: redHatVersionMap,
  getImageName: getRedHatImageName
} = useRedHatImages(data)
const {
  versionOptions: suseLinuxVersionOptions,
  nameMap: suseLinuxNameMap,
  versionMap: suseLinuxVersionMap,
  getImageName: getSuseLinuxImageName
} = useSuseLinuxImages(data)
const {
  versionOptions: debianVersionOptions,
  nameMap: debianNameMap,
  versionMap: debianVersionMap,
  getImageName: getDebianImageName
} = useDebianImages(data)

const platformImage = reactive({
  ubuntu: {
    versionOptions: ubuntuVersionOptions,
    nameMap: ubuntuNameMap,
    versionMap: ubuntuVersionMap,
    getImageName: getUbuntuImageName
  },
  amazonLinux: {
    versionOptions: amazonLinuxVersionOptions,
    nameMap: amazonLinuxMap,
    versionMap: amazonLinuxVersionMap,
    getImageName: getAmazonLinuxImageName
  },
  redHat: {
    versionOptions: redHatVersionOptions,
    nameMap: redHatNameMap,
    versionMap: redHatVersionMap,
    getImageName: getRedHatImageName
  },
  suseLinux: {
    versionOptions: suseLinuxVersionOptions,
    nameMap: suseLinuxNameMap,
    versionMap: suseLinuxVersionMap,
    getImageName: getSuseLinuxImageName
  },
  debian: {
    versionOptions: debianVersionOptions,
    nameMap: debianNameMap,
    versionMap: debianVersionMap,
    getImageName: getDebianImageName
  }
})

const logoMap = {
  ubuntu,
  suseLinux,
  debian,
  redHat,
  amazonLinux
}

const platforms = computed(() =>
  data.value.map((item) => {
    return {
      value: item.platform,
      label: startCase(item.platform),
      logo: logoMap[item.platform]
    }
  })
)

const platform = ref('ubuntu')
const formData = ['ubuntu', 'suseLinux', 'amazonLinux', 'redHat', 'debian'].reduce((t, c) => {
  t[c] = {
    version: '',
    arch: '',
    buildVersion: ''
  }
  return t
}, {})

const form = reactive(formData)
const archOptions = computed(() => {
  const p = platform.value
  const { version, buildVersion } = form[p]
  const { nameMap, getImageName } = platformImage[p]
  const n = getImageName(version, buildVersion)
  const arches = nameMap.get(n)?.map((item) => item.Architecture) ?? []
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
    const { versionOptions, nameMap, versionMap, getImageName } = platformImage[p]

    version = versionOptions[0]?.value
    form[p].version = version

    buildVersion = versionMap.get(version)?.[0]
    form[p].buildVersion = buildVersion

    const n = getImageName(version, buildVersion)
    const archs = nameMap.get(n)?.map((item) => item.Architecture) ?? []
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
  const { nameMap, getImageName } = platformImage[p]
  const { version, arch, buildVersion } = form[p]
  return nameMap.get(getImageName(version, buildVersion))?.find((item) => item.Architecture === arch)
})

const handleVersionChanged = () => {
  form[platform.value].buildVersion = buildVersionOptions.value[0]?.value
  form[platform.value].arch = archOptions.value[0]?.value
}
const handleBuildVersionChanged = () => {
  form[platform.value].arch = archOptions.value[0]?.value
}
const handleSelect = () => {
  emit('select', selectedImage.value)
  emit('close')
}
</script>
<template>
  <KModal :model-value="visible">
    <template #title>Amazon Machine Images (AMI)</template>
    <template #default>
      <KLoading :loading="imageInfo.loading" class="w-min-60vw">
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
            <img :src="selectedPlatform?.logo" class="object-contain w-70px h-70px"/>
          </div>
          <div>
            <div>{{ selectedImage?.Description }}</div>
            <div>
              <div>{{ selectedImage?.ImageId }}({{ selectedImage?.Architecture }})</div>
            </div>
            <div class="flex gap-2 text-sm text-gray-500">
              <div>Virtualization Type: {{ selectedImage?.VirtualizationType }}</div>
              <div>Root Device Type: {{ selectedImage?.RootDeviceType }}</div>
              <div>Ena Support: {{ selectedImage?.EnaSupport }}</div>
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

<style scoped></style>
