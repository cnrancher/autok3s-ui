import jsyaml from 'js-yaml'
import { computed, reactive, watch } from 'vue'
import request from '@/utils/request'

const SYSTEM_NAMESPACES = [
  'cattle-dashboards',
  'cattle-global-data',
  'cattle-system',
  'gatekeeper-system',
  'ingress-nginx',
  'kube-node-lease',
  'kube-public',
  'kube-system',
  'linkerd',
  'security-scan',
  'tekton-pipelines'
]

const SYSTEM_NAMESPACE = 'management.cattle.io/system-namespace'
const FLEET_MANAGED = 'fleet.cattle.io/managed'

const HCI_LABELS_CLOUD_INIT = 'harvesterhci.io/cloud-init-template'

const filterNamespace = (namespaces = [], systemNamespaces = []) => {
  return namespaces.filter((ns) => {
    const nsName = ns.metadata.name
    const isSystemNs =
      ns.metadata?.annotations?.[SYSTEM_NAMESPACE] === 'true' ||
      SYSTEM_NAMESPACES.includes(nsName) ||
      nsName.endsWith('-system') ||
      systemNamespaces.includes(nsName)

    const isFleetMagaged = ns.metadata?.labels?.[FLEET_MANAGED] === 'true'
    return !isFleetMagaged && !isSystemNs
  })
}

const parseKubeConfigFile = (data) => {
  return jsyaml.load(data, 'utf8')
}

const getCurrentContext = (config) => {
  const currentContext = config?.['current-context']
  return config?.['contexts'].find((c) => c.name === currentContext)
}

const getTokenFromConfig = (config) => {
  const context = getCurrentContext(config)
  const userName = context?.context?.user
  const user = config?.['users']?.find((u) => u.name === userName)

  return user?.user?.token
}
const getClusterEndpoint = (config) => {
  const context = getCurrentContext(config)
  const clusterName = context?.context.cluster
  const cluster = config?.['clusters']?.find((c) => c.name === clusterName)

  return cluster?.cluster?.server
}

export default function useHarvesterSdk() {
  let controller = null
  let whitelist = []
  const configInfo = reactive({
    error: null,
    data: null,
    value: null
  })

  const namespaceInfo = reactive({
    controller: null,
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const imageInfo = reactive({
    controller: null,
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const configMapInfo = reactive({
    controller: null,
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const keyPairInfo = reactive({
    controller: null,
    loading: false,
    loaded: false,
    error: null,
    data: []
  })
  const whitelistInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    data: []
  })
  const parseConfig = (data) => {
    if (!data) {
      configInfo.error = 'KubeConfig is required'
      configInfo.data = null
      return
    }
    configInfo.error = null
    try {
      const config = parseKubeConfigFile(data)
      if (
        config?.['clusters']?.length > 0 &&
        config?.['users']?.length > 0 &&
        config?.['contexts'].length > 0 &&
        config?.['current-context']
      ) {
        configInfo.data = config
      } else {
        configInfo.error = 'KubeConfig missing some props (clusters, users, contexts, current-context)'
      }
    } catch (err) {
      configInfo.error = err
      configInfo.data = null
    }
  }
  watch(
    () => configInfo.value,
    (v) => {
      parseConfig(v)
    }
  )

  const updateWhitelist = async (domain, signal) => {
    if (whitelist.includes(domain)) {
      return
    }
    try {
      whitelistInfo.error = null
      whitelistInfo.loaded = false
      whitelistInfo.loading = true
      const data = await request({
        url: '/settings/whitelist-domain',
        method: 'get',
        signal
      })
      const values = data.value.split(',').map((v) => v.trim())
      if (values.includes(domain)) {
        whitelist = values
      } else {
        values.push(domain)
        data.value = [...new Set(values)].filter((v) => v).join(',')
        const resp = await request({
          url: '/settings/whitelist-domain',
          method: 'put',
          data
        })
        whitelist = resp.value.split(',').map((v) => v.trim())
      }
    } catch (err) {
      whitelistInfo.error = err
    }
    whitelistInfo.loaded = true
    whitelistInfo.loading = false
  }

  const token = computed(() => {
    return getTokenFromConfig(configInfo.data)
  })
  const endpoint = computed(() => {
    return getClusterEndpoint(configInfo.data)?.replaceAll('//', '/')
  })
  const hostname = computed(() => {
    if (!endpoint.value) {
      return ''
    }
    const url = new URL(endpoint.value)
    return url.hostname
  })

  const isConfigValid = computed(() => {
    return token.value && endpoint.value && hostname.value
  })

  const userData = computed(() => {
    return configMapInfo.data
      .filter((cm) => cm.metadata?.labels?.[HCI_LABELS_CLOUD_INIT] === 'user')
      .map((cm) => ({
        label: cm?.id,
        value: cm?.id,
        data: cm
      }))
  })

  const networkData = computed(() => {
    return configMapInfo.data
      .filter((cm) => cm.metadata?.labels?.[HCI_LABELS_CLOUD_INIT] === 'network')
      .map((cm) => ({
        label: cm?.id,
        value: cm?.id,
        data: cm
      }))
  })

  const fetchData = async () => {
    controller?.abort()
    controller = new AbortController()
    await updateWhitelist(hostname.value, controller.signal)

    await Promise.all([
      fetchSystemNamespaces(controller.signal),
      fetchImageInfo(controller.signal),
      fetchConfigMapInfo(controller.signal),
      fetchKeyPairInfo(controller.signal)
    ])
  }

  const fetchSystemNamespaces = async (signal) => {
    namespaceInfo.loading = true
    namespaceInfo.loaded = false
    signal.addEventListener('abort', () => {
      namespaceInfo.loading = false
      namespaceInfo.loaded = false
    })
    namespaceInfo.data = []
    try {
      const auth = `Bearer ${token.value}`
      const targetSysNs =
        import.meta.env.MODE === 'production'
          ? `${endpoint.value}/v1/management.cattle.io.settings/system-namespaces`
          : encodeURIComponent(`${endpoint.value}/v1/management.cattle.io.settings/system-namespaces`)
      const systemNamespaces = request({
        baseURL: '/',
        url: `/meta/proxy/${targetSysNs}`,
        method: 'get',
        signal: signal,
        headers: {
          Authorization: auth
        }
      })
      const targetAllNs =
        import.meta.env.MODE === 'production'
          ? `${endpoint.value}/v1/namespaces`
          : encodeURIComponent(`${endpoint.value}/v1/namespaces`)
      const allNamespaces = request({
        baseURL: '/',
        url: `/meta/proxy/${targetAllNs}`,
        method: 'get',
        signal: signal,
        headers: {
          Authorization: auth
        }
      })
      const [sysNs, allNs] = await Promise.all([systemNamespaces, allNamespaces])
      const namespaces = filterNamespace(
        allNs.data,
        sysNs.value.split(',').map((item) => item.trim() ?? [])
      )
      namespaceInfo.data = namespaces.map((n) => ({
        label: n.metadata?.name ?? n.id,
        value: n.id
      }))
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        namespaceInfo.error = err
      }
    }
    namespaceInfo.loading = false
    namespaceInfo.loaded = true
  }

  const fetchImageInfo = async (signal) => {
    imageInfo.loading = true
    imageInfo.loaded = false
    signal.addEventListener('abort', () => {
      imageInfo.loading = false
      imageInfo.loaded = false
    })
    imageInfo.data = []
    try {
      const auth = `Bearer ${token.value}`
      const target =
        import.meta.env.MODE === 'production'
          ? `${endpoint.value}/v1/harvester/harvesterhci.io.virtualmachineimages`
          : encodeURIComponent(`${endpoint.value}/v1/harvester/harvesterhci.io.virtualmachineimages`)
      const images = await request({
        baseURL: '/',
        url: `/meta/proxy/${target}`,
        method: 'get',
        signal: signal,
        headers: {
          Authorization: auth
        }
      })

      imageInfo.data = images.data.map((item) => ({
        label: `${item.metadata.namespace}/${item.spec.displayName}`,
        value: item.id
      }))
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        imageInfo.error = err
      }
    }
    imageInfo.loading = false
    imageInfo.loaded = true
  }

  const fetchConfigMapInfo = async (signal) => {
    configMapInfo.loading = true
    configMapInfo.loaded = false
    signal.addEventListener('abort', () => {
      configMapInfo.loading = false
      configMapInfo.loaded = false
    })
    configMapInfo.data = []
    try {
      const auth = `Bearer ${token.value}`
      const target =
        import.meta.env.MODE === 'production'
          ? `${endpoint.value}/v1/harvester/configmaps`
          : encodeURIComponent(`${endpoint.value}/v1/harvester/configmaps`)
      const configMaps = await request({
        baseURL: '/',
        url: `/meta/proxy/${target}`,
        method: 'get',
        signal: signal,
        headers: {
          Authorization: auth
        }
      })

      configMapInfo.data = configMaps.data
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        configMapInfo.error = err
      }
    }
    configMapInfo.loading = false
    configMapInfo.loaded = true
  }

  const fetchKeyPairInfo = async (signal) => {
    keyPairInfo.loading = true
    keyPairInfo.loaded = false
    signal.addEventListener('abort', () => {
      keyPairInfo.loading = false
      keyPairInfo.loaded = false
    })
    keyPairInfo.data = []
    try {
      const auth = `Bearer ${token.value}`
      const target =
        import.meta.env.MODE === 'production'
          ? `${endpoint.value}/v1/harvester/harvesterhci.io.keypairs`
          : encodeURIComponent(`${endpoint.value}/v1/harvester/harvesterhci.io.keypairs`)
      const keyPairs = await request({
        baseURL: '/',
        url: `/meta/proxy/${target}`,
        method: 'get',
        signal: signal,
        headers: {
          Authorization: auth
        }
      })

      keyPairInfo.data = keyPairs.data.map((item) => ({
        label: item.id,
        value: item.id
      }))
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        keyPairInfo.error = err
      }
    }
    keyPairInfo.loading = false
    keyPairInfo.loaded = true
  }

  const resetAll = () => {
    controller?.abort()
    controller = null

    namespaceInfo.data = []
    namespaceInfo.error = null
    namespaceInfo.loaded = false
    namespaceInfo.loading = false

    imageInfo.data = []
    imageInfo.error = null
    imageInfo.loaded = false
    imageInfo.loading = false

    keyPairInfo.data = []
    keyPairInfo.error = null
    keyPairInfo.loaded = false
    keyPairInfo.loading = false

    configMapInfo.data = []
    configMapInfo.error = null
    configMapInfo.loaded = false
    configMapInfo.loading = false
  }

  return {
    whitelistInfo,
    configInfo,
    namespaceInfo,
    imageInfo,
    keyPairInfo,
    isConfigValid,
    userData,
    networkData,
    fetchData,
    resetAll
  }
}
