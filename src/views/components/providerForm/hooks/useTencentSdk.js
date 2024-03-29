import sha256 from 'crypto-js/sha256'
import hmacSHA256 from 'crypto-js/hmac-sha256'
import Hex from 'crypto-js/enc-hex'

import request from '@/utils/request'
import { onBeforeUnmount, reactive, readonly, ref, shallowReactive } from 'vue'
import Schema from 'async-validator'
const descriptor = {
  secretId: {
    required: true,
    message: '"Secret Id" is required'
  },
  secretKey: {
    required: true,
    message: '"Secret Key" is required'
  }
}
const validator = new Schema(descriptor)
const languages = ['zh-CN', 'en-US']
const currentLanguage = languages.includes(navigator.language) ? navigator.language : 'zh-CN'

const encodeHeaders = (headers = {}) => {
  const h = Object.entries(headers).reduce((t, [k, v]) => {
    t[`${k}`.trim().toLowerCase()] = `${v}`.trim().toLowerCase()

    return t
  }, {})
  const keys = Object.keys(h)
  keys.sort()

  return {
    canonicalHeaders: `${keys.map((k) => `${k}:${h[k]}`).join('\n')}\n`,
    signedHeaders: keys.join(';')
  }
}

const getTimestamp = (d = new Date()) => {
  return Math.floor(d.getTime() / 1000)
}

function getDate(timestamp) {
  const date = new Date(timestamp * 1000)
  const year = date.getUTCFullYear()
  const month = ('0' + (date.getUTCMonth() + 1)).slice(-2)
  const day = ('0' + date.getUTCDate()).slice(-2)
  return `${year}-${month}-${day}`
}

const signV3 = (credential, options) => {
  const { secretId, secretKey } = credential
  const {
    requestTimestamp,
    payload = {},
    httpRequestMethod = 'POST',
    canonicalQueryString = '',
    endpoint = 'cvm.tencentcloudapi.com',
    headers = {}
  } = options
  const canonicalURI = '/'
  // const requiredHeaders ={
  //   'content-type': `${httpRequestMethod === 'POST' ? 'application/x-www-form-urlencoded' : 'application/json'}; charset=utf-8`,
  //   'host': endpoint,
  // }
  const { canonicalHeaders, signedHeaders } = encodeHeaders(Object.assign({}, headers))

  const hashedRequestPayload =
    httpRequestMethod === 'POST' ? Hex.stringify(sha256(JSON.stringify(payload))) : Hex.stringify(sha256(''))

  // step 1: Canonical Request
  const canonicalRequest = [
    httpRequestMethod,
    canonicalURI,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedRequestPayload
  ].join('\n')

  const date = getDate(requestTimestamp)
  const service = endpoint.split('.')[0]

  const algorithm = 'TC3-HMAC-SHA256'
  const credentialScope = `${date}/${service}/tc3_request`
  const hashedCanonicalRequest = Hex.stringify(sha256(canonicalRequest))
  // step 2: String To Sign
  const stringToSign = [algorithm, requestTimestamp, credentialScope, hashedCanonicalRequest].join('\n')

  const secretDate = hmacSHA256(date, `TC3${secretKey}`)
  const secretService = hmacSHA256(service, secretDate)
  const secretSigning = hmacSHA256('tc3_request', secretService)

  // step 3: Signature
  const signature = Hex.stringify(hmacSHA256(stringToSign, secretSigning))
  // step 4: Authorization
  const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return authorization
}

function send(secretId, secretKey, action, region, payload, signal, host = 'cvm.tencentcloudapi.com') {
  const requestTimestamp = getTimestamp()
  const httpRequestMethod = 'POST'
  const requiredHeaders = {
    // 'Content-Type': 'application/json; charset=utf-8',
    'Content-Type': 'application/json',
    Host: host
  }
  const auth = signV3(
    {
      secretId,
      secretKey
    },
    {
      requestTimestamp,
      payload,
      httpRequestMethod,
      endpoint: host,
      headers: requiredHeaders
    }
  )
  const headers = {
    'Content-Type': 'application/json',
    'X-TC-Action': action,
    'X-TC-Timestamp': requestTimestamp,
    'X-TC-Version': '2017-03-12',
    'X-TC-Language': currentLanguage,
    Authorization: auth
  }

  if (region) {
    headers['X-TC-Region'] = region
  }
  const url = `https:/${host}`
  const target = import.meta.env.MODE === 'development' ? encodeURIComponent(url) : url
  return request({
    baseURL: '/',
    method: httpRequestMethod,
    url: `/meta/proxy/${target}`,
    data: payload,
    headers,
    withCredentials: false,
    signal
  })
}

// https://cloud.tencent.com/document/api/362/15669#Disk
const diskTypes = [
  {
    label: 'CLOUD_BASIC',
    value: 'CLOUD_BASIC'
  },
  {
    label: 'CLOUD_PREMIUM',
    value: 'CLOUD_PREMIUM'
  },
  {
    label: 'CLOUD_SSD',
    value: 'CLOUD_SSD'
  },
  {
    label: 'CLOUD_HSSD',
    value: 'CLOUD_HSSD'
  },
  {
    label: 'CLOUD_TSSD',
    value: 'CLOUD_TSSD'
  }
]

export default function useTencentSdk() {
  let abortController = null
  const secretId = ref('')
  const secretKey = ref('')
  const region = ref('')
  const zone = ref('')
  const vpc = ref('')

  onBeforeUnmount(() => {
    abortController?.abort()
  })

  const whitelistInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    data: []
  })
  const keyInfo = reactive({
    loading: false,
    loaded: false,
    secretId: null,
    secretKey: null,
    error: null,
    valid: false
  })

  const regionInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const zoneInfo = reactive({
    region: '',
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const instanceTypeInfo = reactive({
    region: '',
    zone: '',
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const vpcInfo = reactive({
    region: '',
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const subnetInfo = reactive({
    region: '',
    zone: '',
    vpcId: '',
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const securityGroupInfo = reactive({
    region: '',
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const keyPairInfo = reactive({
    region: '',
    loading: false,
    loaded: true,
    error: null,
    data: []
  })

  const imageInfo = shallowReactive({
    region: '',
    loading: false,
    loaded: false,
    error: null,
    data: []
  })
  const imageDetail = reactive({
    region: '',
    loading: false,
    loaded: true,
    error: null,
    data: null
  })
  let whitelist = []
  const updateWhitelist = async (domains, signal) => {
    if (domains.every((d) => whitelist.includes(d))) {
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
      if (domains.every((d) => values.includes(d))) {
        whitelist = values
      } else {
        values.push(...domains)
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

  const validateKeys = async (id, key) => {
    keyInfo.secretId = id ?? secretId.value
    keyInfo.secretKey = key ?? secretKey.value

    try {
      await validator.validate(keyInfo)
    } catch ({ errors, fields }) {
      keyInfo.error = errors.map((e) => e.message).join('. ')
      keyInfo.valid = false
      return false
    }

    abortController?.abort()
    abortController = new AbortController()
    const abortSignal = abortController.signal
    await updateWhitelist(['cvm.tencentcloudapi.com', 'vpc.tencentcloudapi.com'], abortSignal)
    await fetchRegions()
  }

  const fetchRegions = async () => {
    keyInfo.loaded = false
    keyInfo.loading = true
    keyInfo.error = null
    keyInfo.valid = false
    regionInfo.loaded = false
    regionInfo.loading = true
    regionInfo.error = null
    regionInfo.data = []
    const abortSignal = abortController.signal
    try {
      const resp = await send(keyInfo.secretId, keyInfo.secretKey, 'DescribeRegions', '', {}, abortSignal)
      if (resp.Response.Error) {
        throw new Error(resp.Response.Error.Message)
      }
      regionInfo.data = resp.Response?.RegionSet?.map((item) => ({ label: item.RegionName, value: item.Region })) ?? []
      keyInfo.valid = true
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        keyInfo.error = err
        regionInfo.error = err
      }
    }
    keyInfo.loaded = true
    keyInfo.loading = false
    regionInfo.loaded = true
    regionInfo.loading = false
  }

  const fetchZones = async (r) => {
    zoneInfo.region = r ?? region.value
    if (!zoneInfo.region) {
      zoneInfo.error = '"Region" is required'
      return false
    }
    zoneInfo.error = null
    zoneInfo.loading = true
    zoneInfo.loaded = false
    zoneInfo.data = []
    const abortSignal = abortController.signal
    try {
      const resp = await send(keyInfo.secretId, keyInfo.secretKey, 'DescribeZones', zoneInfo.region, {}, abortSignal)
      if (resp.Response.Error) {
        throw new Error(resp.Response.Error.Message)
      }
      zoneInfo.data =
        resp.Response?.ZoneSet?.filter((item) => item.ZoneState !== 'UNAVAILABLE' && !item.ZoneState.ParentZone).map(
          (item) => ({ label: item.ZoneName, value: item.Zone })
        ) ?? []
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        zoneInfo.error = err
      }
    }
    zoneInfo.loading = false
    zoneInfo.loaded = true
  }

  const fetchInstanceTypes = async (r, z) => {
    instanceTypeInfo.region = r ?? region.value
    instanceTypeInfo.zone = z ?? zone.value
    const errors = []
    if (!instanceTypeInfo.region) {
      errors.push('"Region" is required')
    }
    if (!instanceTypeInfo.zone) {
      errors.push('"Zone" is required')
    }
    if (errors.length > 0) {
      instanceTypeInfo.error = errors.join(', ')
      return false
    }
    instanceTypeInfo.error = null
    instanceTypeInfo.loading = true
    instanceTypeInfo.loaded = false
    instanceTypeInfo.data = []
    const abortSignal = abortController.signal
    try {
      const resp = await send(
        keyInfo.secretId,
        keyInfo.secretKey,
        'DescribeInstanceTypeConfigs',
        instanceTypeInfo.region,
        {
          Filters: [
            {
              Name: 'zone',
              Values: [instanceTypeInfo.zone]
            }
          ]
        },
        abortSignal
      )
      if (resp.Response.Error) {
        throw new Error(resp.Response.Error.Message)
      }
      instanceTypeInfo.data =
        resp.Response?.InstanceTypeConfigSet?.map((item) => ({
          label: `${item.InstanceType} (CPU: ${item.CPU}, Memory: ${item.Memory} GiB)`,
          value: item.InstanceType,
          raw: item
        })) ?? []
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        instanceTypeInfo.error = err
      }
    }
    instanceTypeInfo.loading = false
    instanceTypeInfo.loaded = true
  }

  const fetchVpcs = async (r) => {
    vpcInfo.region = r ?? region.value
    if (!vpcInfo.region) {
      vpcInfo.error = '"Region" is required'
      return false
    }
    vpcInfo.data = []
    vpcInfo.error = null
    vpcInfo.loaded = false
    vpcInfo.loading = true
    const abortSignal = abortController.signal
    const loadData = async (offset = 0, total = 0, limit = 100) => {
      const resp = await send(
        keyInfo.secretId,
        keyInfo.secretKey,
        'DescribeVpcs',
        vpcInfo.region,
        {
          Offset: `${offset}`,
          Limit: `${limit}`
        },
        abortSignal,
        'vpc.tencentcloudapi.com'
      )
      if (resp.Response.Error) {
        throw new Error(resp.Response.Error.Message)
      }
      vpcInfo.data.push(
        ...(resp?.Response?.VpcSet?.map((item) => ({
          label: item.VpcName,
          value: item.VpcId,
          raw: item
        })) ?? [])
      )
      total = resp?.Response?.TotalCount ?? 0
      offset = offset + limit
      if (offset > total) {
        return
      }
      await loadData(offset, total)
    }
    try {
      await loadData()
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        vpcInfo.error = err
      }
    }
    vpcInfo.loaded = true
    vpcInfo.loading = false
  }

  const fetchSubnets = async (r, z, vpcId) => {
    const tmpRegion = r ?? region.value
    const tmpZone = z ?? zone.value
    const tmpVpcId = vpcId ?? vpc.value
    const errors = []
    if (!tmpRegion) {
      errors.push('"Region" is required')
    }
    if (!tmpZone) {
      errors.push('"Zone" is required')
    }
    if (!tmpVpcId) {
      errors.push('"VPC" is required')
    }

    if (errors.length > 0) {
      subnetInfo.error = errors.join(', ')
      return false
    }

    subnetInfo.region = tmpRegion
    subnetInfo.zone = tmpZone
    subnetInfo.vpcId = tmpVpcId
    subnetInfo.data = []
    subnetInfo.error = null
    subnetInfo.loaded = false
    subnetInfo.loading = true
    const abortSignal = abortController.signal
    const loadData = async (offset = 0, total = 0, limit = 100) => {
      const resp = await send(
        keyInfo.secretId,
        keyInfo.secretKey,
        'DescribeSubnets',
        tmpRegion,
        {
          Filters: [
            {
              Name: 'vpc-id',
              Values: [tmpVpcId]
            },
            {
              Name: 'zone',
              Values: [tmpZone]
            }
          ],
          Offset: `${offset}`,
          Limit: `${limit}`
        },
        abortSignal,
        'vpc.tencentcloudapi.com'
      )
      if (resp.Response.Error) {
        throw new Error(resp.Response.Error.Message)
      }
      subnetInfo.data.push(
        ...(resp?.Response?.SubnetSet?.map((item) => ({
          label: `${item.IsDefault ? '[Default]' : ''}${item.SubnetName}`,
          value: item.SubnetId,
          raw: item
        })) ?? [])
      )
      total = resp?.Response?.TotalCount ?? 0
      offset = offset + limit
      if (offset > total) {
        return
      }
      await loadData(offset, total)
    }
    try {
      await loadData()
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        subnetInfo.error = err
      }
    }
    subnetInfo.loaded = true
    subnetInfo.loading = false
  }

  const fetchSecrityGroups = async (r) => {
    const tmpRegion = r ?? region.value
    if (!tmpRegion) {
      securityGroupInfo.error = '"Region" is required'
      return false
    }

    securityGroupInfo.region = tmpRegion
    securityGroupInfo.data = []
    securityGroupInfo.error = null
    securityGroupInfo.loaded = false
    securityGroupInfo.loading = true
    const abortSignal = abortController.signal
    const loadData = async (offset = 0, total = 0, limit = 100) => {
      const resp = await send(
        keyInfo.secretId,
        keyInfo.secretKey,
        'DescribeSecurityGroups',
        tmpRegion,
        {
          Offset: `${offset}`,
          Limit: `${limit}`
        },
        abortSignal,
        'vpc.tencentcloudapi.com'
      )
      if (resp.Response.Error) {
        throw new Error(resp.Response.Error.Message)
      }
      securityGroupInfo.data.push(
        ...(resp?.Response?.SecurityGroupSet?.map((item) => ({
          label: `${item.IsDefault ? '[Default]' : ''}${item.SecurityGroupName}`,
          value: item.SecurityGroupId,
          raw: item
        })) ?? [])
      )
      total = resp?.Response?.TotalCount ?? 0
      offset = offset + limit
      if (offset > total) {
        return
      }
      await loadData(offset, total)
    }
    try {
      await loadData()
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        securityGroupInfo.error = err
      }
    }
    securityGroupInfo.loaded = true
    securityGroupInfo.loading = false
  }

  const fetchKeyPairs = async (r) => {
    const tmpRegion = r ?? region.value
    if (!tmpRegion) {
      keyPairInfo.error = '"Region" is required'
      return false
    }

    keyPairInfo.region = tmpRegion
    keyPairInfo.data = []
    keyPairInfo.error = null
    keyPairInfo.loaded = false
    keyPairInfo.loading = true
    const abortSignal = abortController.signal
    const loadData = async (offset = 0, total = 0, limit = 100) => {
      const resp = await send(
        keyInfo.secretId,
        keyInfo.secretKey,
        'DescribeKeyPairs',
        tmpRegion,
        {
          Offset: offset,
          Limit: limit
        },
        abortSignal
      )
      if (resp.Response.Error) {
        throw new Error(resp.Response.Error.Message)
      }
      keyPairInfo.data.push(
        ...(resp?.Response?.KeyPairSet?.map((item) => ({
          label: item.KeyName,
          value: item.KeyId,
          raw: item
        })) ?? [])
      )
      total = resp?.Response?.TotalCount ?? 0
      offset = offset + limit
      if (offset > total) {
        return
      }
      await loadData(offset, total)
    }
    try {
      await loadData()
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        keyPairInfo.error = err
      }
    }
    keyPairInfo.loaded = true
    keyPairInfo.loading = false
  }

  const fetchImages = async (r, instanceType) => {
    imageInfo.region = r ?? region.value
    if (!imageInfo.region) {
      imageInfo.error = '"Region" is required'
      return false
    }
    imageInfo.error = null
    imageInfo.loading = true
    imageInfo.loaded = false
    imageInfo.data = []
    const abortSignal = abortController.signal
    try {
      const platforms = ['Ubuntu', 'Debian', 'CentOS', 'openSUSE']
      const imageType = 'PUBLIC_IMAGE'
      const param = {}
      if (instanceType) {
        param.InstanceType = instanceType
      }
      const promises = platforms.map((p) =>
        send(
          keyInfo.secretId,
          keyInfo.secretKey,
          'DescribeImages',
          imageInfo.region,
          {
            Filters: [
              {
                Name: 'platform',
                Values: [p]
              },
              {
                Name: 'image-type',
                Values: [imageType]
              }
            ],
            Offset: 0,
            Limit: 100,
            ...param
          },
          abortSignal
        )
      )

      const resp = await Promise.all(promises)
      const data = resp.map((d, index) => ({
        platform: platforms[index],
        data: d.Response?.ImageSet ?? []
      }))
      imageInfo.data = data
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

  const fetchImageById = async (r, imageId) => {
    if (imageDetail.data?.ImageId === imageId) {
      return
    }

    imageDetail.region = r ?? region.value
    if (!imageDetail.region) {
      imageDetail.error = '"Region" is required'
      return false
    }
    imageDetail.error = null
    imageDetail.loading = true
    imageDetail.loaded = false
    imageDetail.data = null
    const abortSignal = abortController.signal
    try {
      const payload = {
        Filters: [
          {
            Values: [imageId],
            Name: 'image-id'
          }
        ]
      }

      const resp = await send(
        keyInfo.secretId,
        keyInfo.secretKey,
        'DescribeImages',
        imageDetail.region,
        payload,
        abortSignal
      )
      if (resp.Response.Error) {
        throw new Error(resp.Response.Error.Message)
      }
      const data = resp.Response?.ImageSet ?? []

      if (data.length === 0) {
        imageDetail.error = `Not found image by id(${imageId})`
        imageDetail.data = null
      } else {
        imageDetail.data = data[0]
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        imageDetail.error = err
      }
    }
    imageDetail.loading = false
    imageDetail.loaded = true
  }

  const updateImageDetail = (image) => {
    imageDetail.data = image
  }

  // const resetKeyInfo = () => {
  //   keyInfo.valid = false
  //   keyInfo.loaded = false
  //   keyInfo.loading = false
  //   keyInfo.secretId = null
  //   keyInfo.secretKey = null
  // }
  const resetRegionInfo = () => {
    regionInfo.error = null
    regionInfo.data = []
    regionInfo.loaded = false
    regionInfo.loading = false
  }
  const resetZoneInfo = () => {
    zoneInfo.error = null
    zoneInfo.data = []
    zoneInfo.loaded = false
    zoneInfo.loading = false
    zoneInfo.region = ''
  }
  const resetInstanceTypeInfo = () => {
    instanceTypeInfo.error = null
    instanceTypeInfo.data = []
    instanceTypeInfo.loaded = false
    instanceTypeInfo.loading = false
    instanceTypeInfo.region = ''
    instanceTypeInfo.zone = ''
  }
  const resetVpcInfo = () => {
    vpcInfo.error = null
    vpcInfo.data = []
    vpcInfo.loaded = false
    vpcInfo.loading = false
    vpcInfo.region = ''
  }
  const resetSubnetInfo = () => {
    subnetInfo.region = ''
    subnetInfo.zone = ''
    subnetInfo.vpcId = ''
    subnetInfo.loaded = false
    subnetInfo.loading = false
    subnetInfo.error = null
    subnetInfo.data = []
  }
  const resetSecurityGroupInfo = () => {
    securityGroupInfo.region = ''
    securityGroupInfo.loaded = false
    securityGroupInfo.loading = false
    securityGroupInfo.error = null
    securityGroupInfo.data = []
  }
  const resetKeyPairInfo = () => {
    keyPairInfo.region = ''
    keyPairInfo.loaded = false
    keyPairInfo.loading = false
    keyPairInfo.error = null
    keyPairInfo.data = []
  }

  const resetImageInfo = () => {
    imageInfo.region = ''
    imageInfo.imageType = ''
    imageInfo.platform = ''
    imageInfo.instanceType = ''
    imageInfo.query = ''
    imageInfo.field = 'image-name'
    imageInfo.loaded = false
    imageInfo.loading = false
    imageInfo.error = null
    imageInfo.data = []
    imageInfo.total = 0
    imageInfo.offset = 0
  }
  const restAll = () => {
    // resetKeyInfo()
    resetRegionInfo()
    resetZoneInfo()
    resetInstanceTypeInfo()
    resetVpcInfo()
    resetSubnetInfo()
    resetSecurityGroupInfo()
    resetKeyPairInfo()
    resetImageInfo()
  }

  return {
    validateKeys,
    fetchZones,
    fetchInstanceTypes,
    fetchVpcs,
    fetchSubnets,
    fetchSecrityGroups,
    fetchKeyPairs,
    fetchImages,
    fetchImageById,
    updateImageDetail,
    restAll,
    resetZoneInfo,
    resetInstanceTypeInfo,
    resetVpcInfo,
    resetSubnetInfo,
    resetSecurityGroupInfo,
    resetKeyPairInfo,
    resetImageInfo,
    diskTypes: readonly(diskTypes),
    keyInfo: readonly(keyInfo),
    regionInfo: readonly(regionInfo),
    zoneInfo: readonly(zoneInfo),
    instanceTypeInfo: readonly(instanceTypeInfo),
    vpcInfo: readonly(vpcInfo),
    subnetInfo: readonly(subnetInfo),
    securityGroupInfo: readonly(securityGroupInfo),
    keyPairInfo: readonly(keyPairInfo),
    imageInfo: readonly(imageInfo),
    imageDetail: readonly(imageDetail),
    whitelistInfo: readonly(whitelistInfo)
  }
}
