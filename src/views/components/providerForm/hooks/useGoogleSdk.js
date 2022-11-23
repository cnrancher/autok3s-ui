import { reactive, readonly } from 'vue'
import request from '@/utils/request'
import Schema from 'async-validator'

const descriptor = {
  credentialId: {
    required: true,
    message: '"GCE Credential" is required'
  },
  project: {
    required: true,
    message: '"project" is required'
  }
}
const validator = new Schema(descriptor)
const params = {
  link: 'forms',
  provider: 'google'
}

export default function useGoogleSdk() {
  let abortController = null

  const keyInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    project: '',
    credentialId: '',
    valid: false
  })

  const regionInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  // const zoneInfo = reactive({
  //   region: '',
  //   loading: false,
  //   loaded: false,
  //   error: null,
  //   data: []
  // })

  const machineTypeInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    zone: null,
    nextPageToken: null,
    data: []
  })

  const diskTypeInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    zone: null,
    nextPageToken: null,
    data: []
  })
  const imageInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    nextPageToken: null,
    project: null,
    filter: null,
    data: []
  })

  const networkInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    nextPageToken: null,
    data: []
  })

  const validateKeys = async (credentialId, project) => {
    abortController?.abort()
    abortController = new AbortController()
    keyInfo.credentialId = credentialId
    keyInfo.project = project
    try {
      await validator.validate(keyInfo)
    } catch ({ errors, fields }) {
      keyInfo.error = errors.map((e) => e.message).join('. ')
      keyInfo.valid = false
      return false
    }
    keyInfo.loading = true
    keyInfo.loaded = false
    regionInfo.loading = true
    regionInfo.loaded = false
    keyInfo.error = null
    regionInfo.error = null
    try {
      const { data = [] } = await fetchRegions(keyInfo.credentialId, keyInfo.project)
      regionInfo.data = data.map((r) => ({ value: r.name, label: r.name, raw: r }))
      keyInfo.valid = true
    } catch (err) {
      if (err.name !== 'AbortError') {
        keyInfo.valid = false
        keyInfo.error = err?.response?.data?.message ?? err
        regionInfo.error = err?.response?.data?.message ?? err
      }
    }
    regionInfo.loading = false
    regionInfo.loaded = true
    keyInfo.loading = false
    keyInfo.loaded = true
  }

  const fetchRegions = async (credentialId, project) => {
    const signal = abortController.signal
    return request({
      url: `/credentials/${credentialId}`,
      method: 'get',
      params: {
        ...params,
        method: 'region',
        project
      },
      signal
    })
  }

  // const fetchZones = async () => {
  //   zoneInfo.error = null
  //   zoneInfo.loading = true
  //   zoneInfo.loaded = false
  //   zoneInfo.data = []
  //   const signal = abortController.signal
  //   const {credentialId, project} = keyInfo
  //   try {
  //     const {data = []} = request({
  //       url: `/credentials/${credentialId}`,
  //       method: 'get',
  //       params: {
  //         ...params,
  //         method: 'zone',
  //         project
  //       },
  //       signal
  //     })
  //     console.log(data)
  //   } catch (err) {
  //     if (err.name !== 'AbortError') {
  //       zoneInfo.error = err?.response?.data?.message ?? err
  //     }
  //   }
  //   zoneInfo.loading = false
  //   zoneInfo.loaded = true
  // }

  const fetchMachineTypes = async (z, pageToken) => {
    resetResourceInfo(machineTypeInfo, ['data', 'nextPageToken'])
    machineTypeInfo.loading = true
    machineTypeInfo.loaded = false
    const signal = abortController.signal
    const { credentialId, project } = keyInfo
    const p = {
      ...params,
      method: 'machineType',
      zone: z,
      project
    }
    if (pageToken) {
      p.pageToken = pageToken
    } else {
      machineTypeInfo.data = []
      machineTypeInfo.zone = z
    }
    try {
      const { data = [], continue: nextPageToken } = await request({
        url: `/credentials/${credentialId}`,
        method: 'get',
        params: p,
        signal
      })
      const d = data.map((item) => ({ value: item.name, label: item.name, raw: item }))
      if (pageToken) {
        machineTypeInfo.data.push(...d)
      } else {
        machineTypeInfo.data = d
      }
      machineTypeInfo.nextPageToken = nextPageToken
    } catch (err) {
      if (err.name !== 'AbortError') {
        machineTypeInfo.error = err?.response?.data?.message ?? err
      }
    }
    machineTypeInfo.loading = false
    machineTypeInfo.loaded = true
  }

  const fetchDiskTypes = async (z, pageToken) => {
    resetResourceInfo(diskTypeInfo, ['data', 'nextPageToken'])
    diskTypeInfo.loading = true
    diskTypeInfo.loaded = false
    const signal = abortController.signal
    const { credentialId, project } = keyInfo
    const p = {
      ...params,
      method: 'diskType',
      zone: z,
      project
    }
    if (pageToken) {
      p.pageToken = pageToken
    } else {
      diskTypeInfo.data = []
      diskTypeInfo.zone = z
    }

    try {
      const { data = [], continue: nextPageToken } = await request({
        url: `/credentials/${credentialId}`,
        method: 'get',
        params: p,
        signal
      })
      const d = data.map((item) => ({ value: item.name, label: item.name, raw: item }))
      if (pageToken) {
        diskTypeInfo.data.push(...d)
      } else {
        diskTypeInfo.data = d
      }
      diskTypeInfo.nextPageToken = nextPageToken
    } catch (err) {
      if (err.name !== 'AbortError') {
        diskTypeInfo.error = err?.response?.data?.message ?? err
      }
    }
    diskTypeInfo.loading = false
    diskTypeInfo.loaded = true
  }

  const fetchImages = async (project, filter, pageToken) => {
    imageInfo.error = null
    imageInfo.loading = true
    imageInfo.loaded = false
    const p = {
      ...params,
      method: 'image',
      project
    }
    if (filter) {
      p.filter = filter
    } else {
      p.orderBy = 'creationTimestamp desc'
    }
    if (pageToken) {
      imageInfo.nextPageToken = pageToken
      p.pageToken = pageToken
    } else {
      imageInfo.data = []
      imageInfo.project = project
      imageInfo.filter = filter
    }
    const signal = abortController.signal
    const { credentialId } = keyInfo
    try {
      const { data = [], continue: nextPageToken } = await request({
        url: `/credentials/${credentialId}`,
        method: 'get',
        params: p,
        signal
      })
      const d = data.filter((item) => !item.deprecated)
      if (pageToken) {
        imageInfo.data.push(...d)
      } else {
        imageInfo.data = d
      }
      imageInfo.nextPageToken = nextPageToken
    } catch (err) {
      if (err.name !== 'AbortError') {
        imageInfo.error = err?.response?.data?.message ?? err
      }
    }
    imageInfo.loading = false
    imageInfo.loaded = true
  }

  const fetchNetworks = async (pageToken) => {
    networkInfo.error = null
    networkInfo.loading = true
    networkInfo.loaded = false
    const signal = abortController.signal
    const { credentialId, project } = keyInfo
    const p = {
      ...params,
      method: 'network',
      project
    }
    if (pageToken) {
      networkInfo.nextPageToken = pageToken
      p.pageToken = pageToken
    } else {
      networkInfo.data = []
    }
    try {
      const { data = [], continue: nextPageToken } = await request({
        url: `/credentials/${credentialId}`,
        method: 'get',
        params: p,
        signal
      })
      const d = data.map((item) => ({ value: item.name, label: item.name, raw: item }))
      if (pageToken) {
        networkInfo.data.push(...d)
      } else {
        networkInfo.data = d
      }
      networkInfo.nextPageToken = nextPageToken
    } catch (err) {
      if (err.name !== 'AbortError') {
        networkInfo.error = err?.response?.data?.message ?? err
      }
    }
    networkInfo.loading = false
    networkInfo.loaded = true
  }

  const resetResourceInfo = (r, excludes = []) => {
    const defaultValue = {
      data: [],
      error: null,
      loading: false,
      loaded: false,
      nextPageToken: null
    }
    const setDefaultValue = ([k, v]) => {
      r[k] = v
    }
    if (excludes.length === 0) {
      Object.entries(defaultValue).forEach(setDefaultValue)
    } else {
      Object.entries(defaultValue)
        .filter(([k]) => !excludes.includes(k))
        .forEach(setDefaultValue)
    }
  }

  const resetRegionInfo = () => {
    resetResourceInfo(regionInfo)
  }
  const resetMachineTypeInfo = () => {
    resetResourceInfo(machineTypeInfo)
    machineTypeInfo.zone = null
  }
  const resetDiskTypeInfo = () => {
    resetResourceInfo(diskTypeInfo)
    diskTypeInfo.zone = null
  }
  const resetNetworkInfo = () => {
    resetResourceInfo(networkInfo)
  }
  const resetImageInfo = () => {
    resetResourceInfo(imageInfo)
    imageInfo.project = null
    imageInfo.filter = null
  }

  const resetAll = () => {
    resetRegionInfo()
    resetMachineTypeInfo()
    resetDiskTypeInfo()
    resetNetworkInfo()
    resetImageInfo()
  }

  return {
    keyInfo: readonly(keyInfo),
    regionInfo: readonly(regionInfo),
    // zoneInfo: readonly(zoneInfo),
    machineTypeInfo: readonly(machineTypeInfo),
    diskTypeInfo: readonly(diskTypeInfo),
    imageInfo: readonly(imageInfo),
    networkInfo: readonly(networkInfo),
    validateKeys,
    fetchRegions,
    // fetchZones,
    fetchMachineTypes,
    fetchDiskTypes,
    fetchImages,
    fetchNetworks,
    resetAll,
    resetRegionInfo,
    resetMachineTypeInfo,
    resetDiskTypeInfo,
    resetNetworkInfo
  }
}
