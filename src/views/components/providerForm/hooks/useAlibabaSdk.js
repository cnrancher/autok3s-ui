import { computed, reactive, ref, readonly, shallowReactive, onBeforeUnmount } from 'vue'
import Schema from 'async-validator'
import request from '@/utils/request'

import hmacSHA1 from 'crypto-js/hmac-sha1'
import base64 from 'crypto-js/enc-base64'

import { useWhitelist } from './useWhitelist'

const descriptor = {
  accessKey: {
    required: true,
    message: '"Access Key" is required'
  },
  accessSecret: {
    required: true,
    message: '"Access Secret" is required'
  }
}

const validator = new Schema(descriptor)

const encodeParams = (param) => {
  const keys = Object.keys(param)
  keys.sort()

  return keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(param[k])}`).join('&')
}

const mergeParams = (accessKey, payload = {}, options = {}) => {
  const now = new Date()
  const {
    Action,
    Version = '2014-05-26',
    Format = 'JSON',
    SignatureNonce = now.getTime(),
    Timestamp = now.toISOString(),
    SignatureMethod = 'HMAC-SHA1',
    SignatureVersion = '1.0'
  } = options

  const param = {
    Action,
    Version,
    Format,
    SignatureNonce,
    Timestamp,
    SignatureMethod,
    SignatureVersion,
    AccessKeyId: accessKey,
    ...payload
  }

  return param
}

// ref: https://help.aliyun.com/document_detail/315526.html
const sign = (accessKeySecret, canonicalizedQueryString, httpRequestMethod = 'POST') => {
  const stringToSign = [httpRequestMethod, encodeURIComponent('/'), encodeURIComponent(canonicalizedQueryString)].join(
    '&'
  )
  const signature = hmacSHA1(stringToSign, `${accessKeySecret}&`).toString(base64)
  return signature
}

const send = (accessKey, accessKeySecret, payload, options, signal, host = 'ecs.aliyuncs.com') => {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  const url = `http:/${host}`

  const target = import.meta.env.MODE === 'development' ? encodeURIComponent(url) : url
  const param = mergeParams(accessKey, payload, options)
  const canonicalizedQueryString = encodeParams(param)
  const signature = sign(accessKeySecret, canonicalizedQueryString)
  param.Signature = signature
  const data = encodeParams(param)

  return request({
    baseURL: '/',
    method: 'POST',
    headers,
    url: `/meta/proxy/${target}`,
    data,
    withCredentials: false,
    signal
  })
}

export default function useAlibabaSdk() {
  let abortController = null
  const accessKey = ref('')
  const accessSecret = ref('')
  const region = ref('')
  const zone = ref('')
  const vpc = ref('')

  onBeforeUnmount(() => {
    abortController?.abort()
  })

  const keyInfo = reactive({
    loading: false,
    loaded: false,
    accessKey: '',
    accessSecret: '',
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
  const vpcInfo = reactive({
    region: '',
    loading: false,
    loaded: false,
    error: null,
    totalCount: 0,
    pageSize: 50,
    pageNumber: 0,
    data: []
  })
  const vSwitchInfo = reactive({
    zone: '',
    vpc: '',
    loading: false,
    loaded: false,
    error: null,
    totalCount: 0,
    pageSize: 50,
    pageNumber: 0,
    data: []
  })
  const securityGroupInfo = reactive({
    region: '',
    vpc: '',
    loading: false,
    loaded: false,
    error: null,
    totalCount: 0,
    pageSize: 50,
    pageNumber: 0,
    data: []
  })

  const imageInfo = shallowReactive({
    regionId: '',
    imageName: '',
    imageOwnerAlias: '', // system| self | others| marketplace, 默认值:无，表示返回 system+self+others 不设置该参数说明不使用该参数进行过滤条件
    instanceType: '',
    // OSType: 'linux', // windows | linux
    architecture: '', // i386 | x86_64 | arm64
    query: '',
    loading: false,
    loaded: false,
    pageSize: 10,
    pageNumber: 1,
    totalCount: 0,
    field: 'ImageName', // ImageName | ImageId
    data: [],
    error: null
  })

  const instanceTypeInfo = shallowReactive({
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const imageDetail = reactive({
    regionId: '',
    loading: false,
    loaded: true,
    error: null,
    data: null
  })

  const vSwitchDetail = reactive({
    loading: false,
    loaded: false,
    data: null,
    error: null
  })

  const keyPairInfo = reactive({
    region: '',
    loading: false,
    loaded: true,
    error: null,
    data: []
  })

  const { updateWhitelist } = useWhitelist()

  // watch([() => imageInfo.regionId, imageInfo.instanceType], () => {
  //   imageInfo.data = []
  //   imageInfo.totalCount = 0
  //   imageInfo.error = null
  //   imageInfo.pageNumber = 1
  // })

  const ecsOptions = computed(() => {
    return {
      accessKeyId: keyInfo.accessKey,
      secretAccessKey: keyInfo.accessSecret,
      endpoint: 'https://ecs.aliyuncs.com',
      apiVersion: '2014-05-26'
    }
  })

  const validateKeys = async (access, secret) => {
    keyInfo.accessKey = access ?? accessKey.value
    keyInfo.accessSecret = secret ?? accessSecret.value
    try {
      await validator.validate(keyInfo)
    } catch ({ errors, fields }) {
      keyInfo.error = errors.map((e) => e.message).join('. ')
      keyInfo.valid = false
      return false
    }

    abortController?.abort()
    abortController = new AbortController()
    fetchRegions()
  }

  const fetchRegions = () => {
    keyInfo.loaded = false
    keyInfo.loading = true
    keyInfo.error = null
    keyInfo.valid = false
    regionInfo.loaded = false
    regionInfo.loading = true
    regionInfo.error = null
    regionInfo.data = []
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeRegions({}, (err, resp) => {
      keyInfo.loaded = true
      keyInfo.loading = false
      regionInfo.loaded = true
      regionInfo.loading = false
      if (err) {
        const msg = err.message ?? err
        keyInfo.error = msg
        regionInfo.error = msg
        return
      }
      keyInfo.valid = true
      regionInfo.data = resp.Regions.Region.map((r) => ({ label: r.LocalName, value: r.RegionId, raw: r }))
    })
  }

  const fetchZones = (r) => {
    const tmpRegion = r ?? region.value
    if (!tmpRegion) {
      zoneInfo.error = '"Region" is required'
      return false
    }
    zoneInfo.region = tmpRegion
    zoneInfo.loading = true
    zoneInfo.loaded = false
    zoneInfo.data = []
    zoneInfo.error = null
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeZones(
      {
        RegionId: zoneInfo.region
      },
      (err, resp) => {
        zoneInfo.loading = false
        zoneInfo.loaded = true
        if (err) {
          zoneInfo.error = err.message ?? err
          return
        }
        zoneInfo.data = resp.Zones.Zone.map((z) => ({ label: z.LocalName, value: z.ZoneId, raw: z }))
      }
    )
  }

  const fetchVpcs = (r, pageNumber = 1) => {
    const tmpRegion = r ?? region.value
    if (pageNumber !== 1) {
      if (tmpRegion !== vpcInfo.region) {
        vpcInfo.error = 'Region has changed, no further VPC information is available'
        return false
      }
    }
    const totalCount = vpcInfo.totalCount
    const pageSize = vpcInfo.pageSize

    if (pageNumber !== 1) {
      if (pageSize === 0) {
        return
      }
      const totalPage = Math.ceil(totalCount / pageSize)

      if (pageNumber > totalPage) {
        return
      }
    }

    if (pageNumber !== vpcInfo.pageNumber) {
      vpcInfo.pageNumber = pageNumber
    }
    if (pageNumber === 1) {
      vpcInfo.data = []
    }
    vpcInfo.region = tmpRegion
    vpcInfo.loading = true
    vpcInfo.loaded = false
    vpcInfo.error = null

    const p = {
      RegionId: vpcInfo.region,
      PageNumber: pageNumber,
      PageSize: vpcInfo.pageSize
    }
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeVpcs(p, (err, resp) => {
      vpcInfo.loading = false
      vpcInfo.loaded = true
      if (err) {
        vpcInfo.error = err.message ?? err
        return
      }
      vpcInfo.totalCount = resp.TotalCount
      vpcInfo.pageNumber = pageNumber
      vpcInfo.data = [
        ...vpcInfo.data,
        ...resp.Vpcs.Vpc.map((v) => ({
          label: `${v.IsDefault ? '[Default]' : ''}${v.VpcName ? `${v.VpcName} / ${v.VpcId}` : v.VpcId}`,
          value: v.VpcId,
          raw: v
        }))
      ]
    })
  }

  const fetchVSwitches = (z, v, pageNumber = 1) => {
    const tmpZone = z ?? zone.value
    const tmpVpc = v ?? vpc.value
    if (pageNumber !== 1) {
      if (tmpZone !== vSwitchInfo.zone) {
        vSwitchInfo.error = 'Zone has changed, no further vSwitch information is available'
        return false
      }
      if (tmpVpc !== vSwitchInfo.vpc) {
        vSwitchInfo.error = 'VPC has changed, no further vSwitch information is available'
        return false
      }
    }
    const totalCount = vSwitchInfo.totalCount
    const pageSize = vSwitchInfo.pageSize

    if (pageNumber !== 1) {
      if (pageSize === 0) {
        return
      }
      const totalPage = Math.ceil(totalCount / pageSize)

      if (pageNumber > totalPage) {
        return
      }
    }

    if (pageNumber !== vSwitchInfo.pageNumber) {
      vSwitchInfo.pageNumber = pageNumber
    }
    if (pageNumber === 1) {
      vSwitchInfo.data = []
    }
    vSwitchInfo.zone = tmpZone
    vSwitchInfo.vpc = tmpVpc
    vSwitchInfo.loading = true
    vSwitchInfo.loaded = false
    vSwitchInfo.error = null

    const p = {
      ZoneId: vSwitchInfo.zone,
      VpcId: vSwitchInfo.vpc,
      PageNumber: pageNumber,
      PageSize: vSwitchInfo.pageSize
    }
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeVSwitches(p, (err, resp) => {
      vSwitchInfo.loading = false
      vSwitchInfo.loaded = true
      if (err) {
        console.log(err)
        vSwitchInfo.error = err.message ?? err
        return
      }
      vSwitchInfo.totalCount = resp.TotalCount
      vSwitchInfo.pageNumber = pageNumber
      vSwitchInfo.data = [
        ...vSwitchInfo.data,
        ...resp.VSwitches.VSwitch.map((s) => ({
          label: `${s.IsDefault ? '[Default]' : ''}${s.VSwitchName ? `${s.VSwitchName} / ` : ''}${s.VSwitchId}`,
          value: s.VSwitchId,
          raw: s
        }))
      ]
    })
  }

  const fetchVSwitchDetail = (id) => {
    vSwitchDetail.loading = true
    vSwitchDetail.loaded = false
    vSwitchDetail.error = null

    const p = {
      VSwitchId: id
    }
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeVSwitchAttributes(p, (err, resp) => {
      vSwitchDetail.loading = false
      vSwitchDetail.loaded = true
      if (err) {
        vSwitchDetail.error = err.message ?? err
        return
      }
      vSwitchDetail.data = resp.VSwitches.VSwitch[0]
    })
  }

  const fetchSecurityGroups = (r, v, pageNumber = 1) => {
    const tmpRegion = r ?? region.value
    const tmpVpc = v ?? vpc.value
    if (pageNumber !== 1) {
      if (tmpRegion !== securityGroupInfo.zone) {
        securityGroupInfo.error = 'Region has changed, no further security group information is available'
        return false
      }
      if (tmpVpc !== securityGroupInfo.vpc) {
        securityGroupInfo.error = 'VPC has changed, no further security group information is available'
        return false
      }
    }
    const totalCount = securityGroupInfo.totalCount
    const pageSize = securityGroupInfo.pageSize

    if (pageNumber !== 1) {
      if (pageSize === 0) {
        return
      }
      const totalPage = Math.ceil(totalCount / pageSize)

      if (pageNumber > totalPage) {
        return
      }
    }

    if (pageNumber !== securityGroupInfo.pageNumber) {
      securityGroupInfo.pageNumber = pageNumber
    }
    if (pageNumber === 1) {
      securityGroupInfo.data = []
    }
    securityGroupInfo.region = tmpRegion
    securityGroupInfo.vpc = tmpVpc
    securityGroupInfo.loading = true
    securityGroupInfo.loaded = false
    securityGroupInfo.error = null

    const p = {
      RegionId: securityGroupInfo.region,
      VpcId: securityGroupInfo.vpc,
      PageNumber: pageNumber,
      PageSize: securityGroupInfo.pageSize
    }
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeSecurityGroups(p, (err, resp) => {
      securityGroupInfo.loading = false
      securityGroupInfo.loaded = true
      if (err) {
        securityGroupInfo.error = err.message ?? err
        return
      }
      securityGroupInfo.totalCount = resp.TotalCount
      securityGroupInfo.pageNumber = pageNumber
      securityGroupInfo.data = [
        ...securityGroupInfo.data,
        ...resp.SecurityGroups.SecurityGroup.map((sg) => ({
          label: `${sg.SecurityGroupName ? `${sg.SecurityGroupName} / ` : ''}${sg.SecurityGroupId}`,
          value: sg.SecurityGroupId,
          raw: sg
        }))
      ]
    })
  }

  const fetchImages = (r, instanceType) => {
    const tmpRegion = r ?? region.value
    imageInfo.data = []
    imageInfo.regionId = tmpRegion
    imageInfo.loading = true
    imageInfo.loaded = false
    imageInfo.error = null

    const p = {
      RegionId: imageInfo.regionId,
      OSType: 'linux',
      ImageOwnerAlias: 'system',
      PageNumber: 1,
      PageSize: 100
    }

    if (instanceType) {
      p.InstanceType = instanceType
    }

    const platforms = ['CentOS', 'CentOS Stream', 'Ubuntu', 'Debian', 'openSUSE']
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    imageInfo.loading = true
    imageInfo.loaded = false
    const data = []
    const loadData = (page = 1) => {
      ecs.describeImages(
        {
          ...p,
          PageNumber: page
        },
        (err, resp) => {
          if (err) {
            imageInfo.loading = false
            imageInfo.loaded = true
            imageInfo.error = err
            return
          }
          const d = resp.Images.Image
          const pageNumber = resp.PageNumber
          const pageSize = resp.PageSize
          const totalCount = resp.TotalCount
          const total = pageNumber * pageSize
          data.push(...d)
          if (total < totalCount) {
            loadData(pageNumber + 1)
          } else {
            imageInfo.data = platforms.map((p) => {
              return {
                platform: p,
                data: data.filter((item) => item.Platform === p)
              }
            })
            imageInfo.loading = false
            imageInfo.loaded = true
          }
        }
      )
    }
    loadData()
  }

  const fetchImageById = (r, imageId) => {
    const tmpRegion = r ?? region.value
    imageDetail.regionId = tmpRegion
    imageDetail.loading = true
    imageDetail.loaded = false
    imageDetail.error = null

    const p = { RegionId: imageDetail.regionId, ImageId: imageId }

    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeImages(p, (err, resp) => {
      imageDetail.loading = false
      imageDetail.loaded = true
      if (err) {
        imageDetail.error = err.message ?? err
        return
      }
      const data = resp.Images.Image ?? []
      if (data.length === 0) {
        imageDetail.error = `Not found image by id(${imageId})`
        imageDetail.data = null
      } else {
        imageDetail.data = data[0]
      }
    })
  }

  const fetchAllInstanceTypes = () => {
    instanceTypeInfo.loading = true
    instanceTypeInfo.loaded = false
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    const data = []
    const loadData = (p = {}) => {
      ecs.describeInstanceTypes(p, (err, resp) => {
        if (err) {
          instanceTypeInfo.error = err.message ?? err
          instanceTypeInfo.loading = false
          instanceTypeInfo.loaded = true
          return
        }
        data.push(...resp.InstanceTypes.InstanceType)
        if (resp.NextToken) {
          const p = {}
          p.NextToken = resp.NextToken
          loadData(p)
        } else {
          instanceTypeInfo.loading = false
          instanceTypeInfo.loaded = true
          instanceTypeInfo.data = data
        }
      })
    }
    loadData()
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
    const { accessKeyId, secretAccessKey } = ecsOptions.value
    const regionId = keyPairInfo.region
    const loadData = async (PageNumber = 1, PageSize = 50) => {
      const resp = await send(
        accessKeyId,
        secretAccessKey,
        {
          RegionId: regionId,
          PageNumber,
          secretAccessKey
        },
        {
          Action: 'DescribeKeyPairs'
        },
        abortSignal
      )
      const d =
        resp.KeyPairs?.KeyPair?.map((d) => ({
          label: d.KeyPairName,
          value: d.KeyPairName
        })) ?? []
      keyPairInfo.data = [...keyPairInfo.data, ...d]

      const lastPage = PageSize === 0 || resp.TotalCount === 0 ? 1 : Math.ceil(resp.TotalCount / PageSize)

      if (PageNumber < lastPage) {
        await loadData(PageNumber + 1, PageSize)
      } else {
        return
      }
    }
    try {
      await updateWhitelist(['ecs.aliyuncs.com'])
      await loadData()
    } catch (err) {
      if (err.name === 'AbortError') {
        // do nothing
      } else {
        keyPairInfo.error = err.message ?? err
      }
    }
    keyPairInfo.loaded = true
    keyPairInfo.loading = false
  }

  const updateImageDetail = (image) => {
    imageDetail.data = image
  }

  const resetZoneInfo = () => {
    zoneInfo.data = []
    zoneInfo.loaded = false
    zoneInfo.loading = false
    zoneInfo.error = null
    zoneInfo.region = ''
  }
  // const resetRegionInfo = () => {
  //   regionInfo.data = []
  //   regionInfo.loaded = false
  //   regionInfo.loading = false
  //   regionInfo.error = null
  // }
  const resetVpcInfo = () => {
    vpcInfo.data = []
    vpcInfo.loaded = false
    vpcInfo.loading = false
    vpcInfo.error = null
    vpcInfo.region = ''
    vpcInfo.totalCount = 0
    vpcInfo.pageSize = 50
    vpcInfo.pageNumber = 0
  }
  const resetVSwitchInfo = () => {
    vSwitchInfo.data = []
    vSwitchInfo.loaded = false
    vSwitchInfo.loading = false
    vSwitchInfo.error = null
    vSwitchInfo.zone = ''
    vSwitchInfo.vpc = ''
    vSwitchInfo.totalCount = 0
    vSwitchInfo.pageSize = 50
    vSwitchInfo.pageNumber = 0
  }

  const resetSecurityGroupInfo = () => {
    securityGroupInfo.data = []
    securityGroupInfo.loaded = false
    securityGroupInfo.loading = false
    securityGroupInfo.error = null
    securityGroupInfo.region = ''
    securityGroupInfo.vpc = ''
    securityGroupInfo.totalCount = 0
    securityGroupInfo.pageSize = 50
    securityGroupInfo.pageNumber = 0
  }

  const resetImageInfo = () => {
    imageInfo.regionId = ''
    imageInfo.imageName = ''
    imageInfo.imageOwnerAlias = null
    imageInfo.instanceType = ''
    imageInfo.OSType = 'linux'
    imageInfo.architecture = 'x86_64'
    imageInfo.pageSize = 10
    imageInfo.pageNumber = 1
    imageInfo.totalCount = 0
    imageInfo.data = []
    imageInfo.error = null
    imageInfo.loading = false
    imageInfo.loaded = false
  }

  const resetInstanceTypeInfo = () => {
    instanceTypeInfo.data = []
    instanceTypeInfo.loaded = false
    instanceTypeInfo.loading = false
    instanceTypeInfo.error = null
    instanceTypeInfo.regionId = ''
  }

  const resetAll = () => {
    // keyInfo.loaded = false
    // keyInfo.loading = false
    // keyInfo.valid = false
    // keyInfo.error = null
    resetInstanceTypeInfo, resetZoneInfo()
    resetVpcInfo()
    resetVSwitchInfo()
    resetSecurityGroupInfo()
    resetImageInfo()
  }

  return {
    keyInfo: readonly(keyInfo),
    regionInfo: readonly(regionInfo),
    zoneInfo: readonly(zoneInfo),
    vSwitchInfo: readonly(vSwitchInfo),
    vpcInfo: readonly(vpcInfo),
    securityGroupInfo: readonly(securityGroupInfo),
    vSwitchDetail: readonly(vSwitchDetail),
    imageInfo: readonly(imageInfo),
    imageDetail: readonly(imageDetail),
    keyPairInfo: readonly(keyPairInfo),
    instanceTypeInfo: readonly(instanceTypeInfo),
    resetZoneInfo,
    resetVpcInfo,
    resetVSwitchInfo,
    resetSecurityGroupInfo,
    resetImageInfo,
    resetAll,
    validateKeys,
    fetchZones,
    fetchVpcs,
    fetchVSwitches,
    fetchSecurityGroups,
    fetchVSwitchDetail,
    fetchImages,
    fetchImageById,
    fetchKeyPairs,
    updateImageDetail,
    fetchAllInstanceTypes
  }
}
