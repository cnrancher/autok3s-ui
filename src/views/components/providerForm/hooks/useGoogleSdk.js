import useProviderCredentials from '@/composables/useProviderCredentials.js'
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
  const { error, loading, credentials, refetch: fetchCredentials } = useProviderCredentials('google')

  const credentialInfo = reactive({
    error,
    loading,
    data: credentials
  })

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
    data: []
  })

  const diskTypeInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    zone: null,
    data: []
  })
  const machineImageInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const networkInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
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

  const fetchMachineTypes = async (z) => {
    machineTypeInfo.error = null
    machineTypeInfo.loading = true
    machineTypeInfo.loaded = false
    machineTypeInfo.data = []
    machineTypeInfo.zone = z
    const signal = abortController.signal
    const { credentialId, project } = keyInfo
    try {
      const { data = [] } = await request({
        url: `/credentials/${credentialId}`,
        method: 'get',
        params: {
          ...params,
          method: 'machineType',
          zone: z,
          project
        },
        signal
      })
      machineTypeInfo.data = data.map((item) => ({ value: item.name, label: item.name, raw: item }))
    } catch (err) {
      if (err.name !== 'AbortError') {
        machineTypeInfo.error = err?.response?.data?.message ?? err
      }
    }
    machineTypeInfo.loading = false
    machineTypeInfo.loaded = true
  }

  const fetchDiskTypes = async (z) => {
    diskTypeInfo.error = null
    diskTypeInfo.loading = true
    diskTypeInfo.loaded = false
    diskTypeInfo.data = []
    diskTypeInfo.zone = z
    const signal = abortController.signal
    const { credentialId, project } = keyInfo
    try {
      const { data = [] } = await request({
        url: `/credentials/${credentialId}`,
        method: 'get',
        params: {
          ...params,
          method: 'diskType',
          zone: z,
          project
        },
        signal
      })
      diskTypeInfo.data = data.map((item) => ({ value: item.name, label: item.name, raw: item }))
    } catch (err) {
      if (err.name !== 'AbortError') {
        diskTypeInfo.error = err?.response?.data?.message ?? err
      }
    }
    diskTypeInfo.loading = false
    diskTypeInfo.loaded = true
  }

  const fetchMachineImages = async () => {
    machineImageInfo.error = null
    machineImageInfo.loading = true
    machineImageInfo.loaded = false
    machineImageInfo.data = []
    const signal = abortController.signal
    const { credentialId, project } = keyInfo
    try {
      const { data = [] } = await request({
        url: `/credentials/${credentialId}`,
        method: 'get',
        params: {
          ...params,
          method: 'machineImage',
          // zone: z,
          project
        },
        signal
      })
      machineImageInfo.data = data.map((item) => ({ value: item.name, label: item.name, raw: item }))
    } catch (err) {
      if (err.name !== 'AbortError') {
        machineImageInfo.error = err?.response?.data?.message ?? err
      }
    }
    machineImageInfo.loading = false
    machineImageInfo.loaded = true
  }

  const fetchNetworks = async () => {
    networkInfo.error = null
    networkInfo.loading = true
    networkInfo.loaded = false
    networkInfo.data = []
    const signal = abortController.signal
    const { credentialId, project } = keyInfo
    try {
      const { data = [] } = await request({
        url: `/credentials/${credentialId}`,
        method: 'get',
        params: {
          ...params,
          method: 'network',
          project
        },
        signal
      })
      networkInfo.data = data.map((item) => ({ value: item.name, label: item.name, raw: item }))
    } catch (err) {
      if (err.name !== 'AbortError') {
        networkInfo.error = err?.response?.data?.message ?? err
      }
    }
    networkInfo.loading = false
    networkInfo.loaded = true
  }

  const resetRegionInfo = () => {
    regionInfo.data = []
    regionInfo.error = null
    regionInfo.loaded = false
    regionInfo.loading = false
  }
  const resetMachineTypeInfo = () => {
    machineTypeInfo.data = []
    machineTypeInfo.error = null
    machineTypeInfo.loaded = false
    machineTypeInfo.loading = false
    machineTypeInfo.zone = null
  }
  const resetDiskTypeInfo = () => {
    diskTypeInfo.data = []
    diskTypeInfo.error = null
    diskTypeInfo.loaded = false
    diskTypeInfo.loading = false
    diskTypeInfo.zone = null
  }
  const resetNetworkInfo = () => {
    networkInfo.data = []
    networkInfo.error = null
    networkInfo.loaded = false
    networkInfo.loading = false
  }

  const resetAll = () => {
    resetRegionInfo()
    resetMachineTypeInfo()
    resetDiskTypeInfo()
    resetNetworkInfo()
  }

  return {
    credentialInfo: readonly(credentialInfo),
    keyInfo: readonly(keyInfo),
    regionInfo: readonly(regionInfo),
    // zoneInfo: readonly(zoneInfo),
    machineTypeInfo: readonly(machineTypeInfo),
    diskTypeInfo: readonly(diskTypeInfo),
    machineImageInfo: readonly(machineImageInfo),
    networkInfo: readonly(networkInfo),
    validateKeys,
    fetchCredentials,
    fetchRegions,
    // fetchZones,
    fetchMachineTypes,
    fetchDiskTypes,
    fetchMachineImages,
    fetchNetworks,
    resetAll,
    resetRegionInfo,
    resetMachineTypeInfo,
    resetDiskTypeInfo,
    resetNetworkInfo
  }
}
