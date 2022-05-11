import {
  EC2Client,
  DescribeRegionsCommand,
  DescribeAvailabilityZonesCommand,
  DescribeInstanceTypesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeImagesCommand,
  DescribeKeyPairsCommand
  // DescribeFastLaunchImagesCommand
  // DescribeAccountAttributesCommand
} from '@aws-sdk/client-ec2'
// import { IAMClient, ListAccessKeysCommand } from '@aws-sdk/client-iam'
import { reactive, ref, readonly, computed, shallowReactive } from 'vue'
//
const defaultRegions = [
  'af-south-1',
  'ap-east-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ca-central-1',
  'cn-north-1',
  'cn-northwest-1',
  'eu-central-1',
  'eu-north-1',
  'eu-south-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'me-south-1',
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-gov-east-1',
  'us-gov-west-1',
  'us-iso-east-1',
  'us-isob-east-1',
  'us-west-1',
  'us-west-2'
]

const volumeTypes = ['gp2', 'gp3', 'io1', 'io2', 'sc1', 'st1', 'standard']

const enCollator = new Intl.Collator('en')

export default function useAwsSdk() {
  const accessKey = ref('')
  const secretKey = ref('')
  const region = ref('')
  const zone = ref('')
  const vpc = ref('')

  const credentials = computed(() => {
    return {
      accessKeyId: keyInfo.accessKey,
      secretAccessKey: keyInfo.secretKey
    }
  })

  const keyInfo = reactive({
    loading: false,
    loaded: false,
    accessKey: '',
    secretKey: '',
    region: '',
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
    loading: false,
    loaded: false,
    arch: ['arm64', 'i386', 'x86_64'],
    nextToken: '',
    data: []
  })
  const vpcInfo = reactive({
    region: '',
    loading: false,
    loaded: false,
    error: null,
    nextToken: '',
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
    vpcId: '',
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const imageInfo = shallowReactive({
    region: '',
    volumeTypes: [],
    arch: ['x86_64'],
    query: '',
    loading: false,
    loaded: true,
    error: null,
    data: []
  })

  const imageDetail = reactive({
    region: '',
    imageId: '',
    loading: false,
    loaded: true,
    error: null,
    data: null
  })

  const keyPairInfo = reactive({
    region: '',
    loading: false,
    loaded: true,
    error: null,
    data: []
  })

  const validateKeys = async (access, secret, r) => {
    keyInfo.accessKey = access ?? accessKey.value
    keyInfo.secretKey = secret ?? secretKey.value
    keyInfo.region = r ?? region.value
    const errors = []
    if (!keyInfo.accessKey) {
      errors.push('"Access Key" is required')
    }
    if (!keyInfo.secretKey) {
      errors.push('"Secret Key" is required')
    }
    if (!keyInfo.region) {
      errors.push('"Region" is required')
    }

    if (errors.length > 0) {
      keyInfo.error = errors.join('. ')
      return false
    }
    keyInfo.valid = false
    await fetchRegions(keyInfo.region)
  }
  const fetchRegions = async (r) => {
    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: r ?? region.value
    })
    regionInfo.loading = true
    regionInfo.loaded = false
    keyInfo.loading = true
    keyInfo.loaded = false
    regionInfo.error = null
    keyInfo.error = null
    keyInfo.valid = false
    regionInfo.data = []
    try {
      const data = await ec2client.send(new DescribeRegionsCommand({}))
      regionInfo.data = data.Regions
      keyInfo.valid = true
    } catch (err) {
      regionInfo.error = err.message ?? err
      keyInfo.error = err.message ?? err
      keyInfo.valid = false
    }
    regionInfo.loading = false
    regionInfo.loaded = true
    keyInfo.loading = false
    keyInfo.loaded = true
  }
  const fetchZones = async (r) => {
    zoneInfo.region = r ?? region.value

    if (!zoneInfo.region) {
      zoneInfo.error = '"Region" is required'
      return false
    }

    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: zoneInfo.region
    })
    zoneInfo.error = null
    zoneInfo.loading = true
    zoneInfo.loaded = false
    zoneInfo.data = []
    try {
      const data = await ec2client.send(
        new DescribeAvailabilityZonesCommand({ Filters: [{ Name: 'region-name', Values: [zoneInfo.region] }] })
      )
      zoneInfo.data = data.AvailabilityZones.map((z) => ({ label: z.ZoneName, value: z.ZoneName }))
    } catch (err) {
      zoneInfo.error = err.message ?? err
    }
    zoneInfo.loading = false
    zoneInfo.loaded = true
  }
  const fetchInstanceTypes = async (nextToken, r, arch = ['arm64', 'i386', 'x86_64']) => {
    const tmpRegion = r ?? region.value

    if (nextToken && instanceTypeInfo.region !== tmpRegion) {
      instanceTypeInfo.error = 'Region has changed, no further instance types information is available'
      return false
    }
    if (
      nextToken &&
      (arch.length !== instanceTypeInfo.arch.length || arch.some((item) => !instanceTypeInfo.arch.includes(item)))
    ) {
      instanceTypeInfo.error = 'Architecture has changed, no further instance types information is available'
      return false
    }
    instanceTypeInfo.region = tmpRegion
    instanceTypeInfo.arch = arch

    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: instanceTypeInfo.region
    })

    instanceTypeInfo.loading = true
    instanceTypeInfo.loaded = false

    const input = { Filters: [{ Name: 'processor-info.supported-architecture', Values: [...arch] }] }
    if (nextToken) {
      input.NextToken = nextToken
    } else {
      instanceTypeInfo.data = []
      instanceTypeInfo.nextToken = ''
    }

    try {
      const data = await ec2client.send(new DescribeInstanceTypesCommand(input))
      const d = data.InstanceTypes.map((t) => ({
        value: t.InstanceType,
        label: t.InstanceType,
        group: t.InstanceType.split('.')[0]
      }))
      d.sort((a, b) => {
        const result = enCollator.compare(a.group, b.group)
        if (result === 0) {
          return enCollator.compare(a.label, b.label)
        }
        return result
      })
      instanceTypeInfo.data.push(...d)
      instanceTypeInfo.nextToken = data.NextToken
    } catch (err) {
      instanceTypeInfo.error = err.message ?? err
    }
    instanceTypeInfo.loading = false
    instanceTypeInfo.loaded = true
  }
  const fetchVpcs = async (nextToken, r) => {
    const tmpRegion = r ?? region.value
    if (nextToken && vpcInfo.region !== tmpRegion) {
      vpcInfo.error = 'Region has changed, no further VPC information is available'
      return false
    }
    vpcInfo.region = tmpRegion

    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: vpcInfo.region
    })
    const input = { Filters: [{ Name: 'state', Values: ['available'] }] }
    if (nextToken) {
      input.NextToken = nextToken
    } else {
      vpcInfo.data = []
      vpcInfo.nextToken = ''
    }
    vpcInfo.loading = true
    vpcInfo.loaded = false

    try {
      const data = await ec2client.send(new DescribeVpcsCommand(input))
      const d = data.Vpcs.map((v) => ({
        label: `${v.VpcId}${v.IsDefault ? '(default)' : ''}`,
        value: v.VpcId
      }))
      vpcInfo.data.push(...d)
      vpcInfo.nextToken = data.NextToken
    } catch (err) {
      vpcInfo.error = err.message ?? err
    }
    vpcInfo.loading = false
    vpcInfo.loaded = true
  }
  const fetchSubnets = async (nextToken, r, z, vpcId) => {
    const tmpRegion = r ?? region.value
    const tmpZone = z ?? zone.value
    const tmpVpcId = vpcId ?? vpc.value
    if (nextToken) {
      if (subnetInfo.region !== tmpRegion) {
        subnetInfo.error = 'Region has changed, no further subnets information is available'
        return false
      }
      if (subnetInfo.zone !== tmpZone) {
        subnetInfo.error = 'Zone has changed, no further subnets information is available'
        return false
      }
      if (subnetInfo.vpcId !== tmpVpcId) {
        subnetInfo.error = 'VPC has changed, no further subnets information is available'
        return false
      }
    }

    subnetInfo.region = tmpRegion
    subnetInfo.zone = tmpZone
    subnetInfo.vpcId = tmpVpcId

    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: subnetInfo.region
    })

    const input = {
      Filters: [
        { Name: 'availability-zone', Values: [subnetInfo.zone] },
        { Name: 'vpc-id', Values: [subnetInfo.vpcId] }
      ]
    }
    if (nextToken) {
      input.NextToken = nextToken
    } else {
      subnetInfo.data = []
    }
    subnetInfo.loading = true
    subnetInfo.loaded = false

    try {
      const data = await ec2client.send(new DescribeSubnetsCommand(input))
      const d = data.Subnets.map((s) => ({
        label: s.SubnetId,
        value: s.SubnetId
      }))
      subnetInfo.data.push(...d)
    } catch (err) {
      subnetInfo.error = err.message ?? err
    }
    subnetInfo.loading = false
    subnetInfo.loaded = true
  }
  const fetchSecrityGroups = async (nextToken, r, vpcId) => {
    const tmpRegion = r ?? securityGroupInfo.region
    const tmpVpcId = vpcId ?? securityGroupInfo.vpcId
    if (nextToken) {
      if (securityGroupInfo.region !== tmpRegion) {
        securityGroupInfo.error = 'Region has changed, no further secrity group information is available'
        return false
      }
      if (securityGroupInfo.vpcId !== tmpVpcId) {
        securityGroupInfo.error = 'VPC has changed, no further secrity group information is available'
        return false
      }
    }

    securityGroupInfo.region = tmpRegion
    securityGroupInfo.vpcId = tmpVpcId

    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: securityGroupInfo.region
    })
    const input = { Filters: [{ Name: 'vpc-id', Values: [securityGroupInfo.vpcId] }] }
    if (nextToken) {
      input.NextToken = nextToken
    } else {
      securityGroupInfo.data = []
    }

    securityGroupInfo.loading = true
    securityGroupInfo.loaded = false
    try {
      const data = await ec2client.send(new DescribeSecurityGroupsCommand(input))
      const d = data.SecurityGroups.map((sg) => ({
        label: `${sg.GroupId}(${sg.GroupName} | ${sg.Description})`,
        value: sg.GroupId
      }))
      securityGroupInfo.data.push(...d)
      securityGroupInfo.nextToken = data.NextToken
    } catch (err) {
      securityGroupInfo.error = err.message ?? err
    }
    securityGroupInfo.loading = false
    securityGroupInfo.loaded = true
  }

  const fetchImageById = async (r, imageId) => {
    if (imageDetail.data?.ImageId === imageId) {
      return
    }
    const tmpRegion = r ?? region.value

    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: tmpRegion
    })

    const filters = [
      {
        Name: 'image-id',
        Values: [imageId]
      }
    ]
    const input = {
      IncludeDeprecated: false,
      Filters: filters
    }
    imageDetail.data = null
    imageDetail.loading = true
    imageDetail.loaded = false
    try {
      const data = await ec2client.send(new DescribeImagesCommand(input))

      if (data.Images?.length === 0) {
        imageDetail.error = `Not found image by id(${imageId})`
        imageDetail.data = null
      } else {
        imageDetail.data = data.Images[0]
      }
    } catch (err) {
      imageDetail.error = err?.message ?? err
    }
    imageDetail.loading = false
    imageDetail.loaded = true
  }

  const fetchImages = async (r, volumeTypes = [], arch = [], query = '') => {
    const tmpRegion = r ?? region.value
    imageInfo.region = tmpRegion
    imageInfo.volumeTypes = volumeTypes
    imageInfo.arch = arch
    imageInfo.query = query

    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: imageInfo.region
    })

    const filters = [
      // {
      //   Name: 'architecture',
      //   Values: ['i386', 'x86_64', 'arm64'] // i386 | x86_64 | arm64
      // },
      // {
      //   Name: 'block-device-mapping.volume-type',
      //   Values: ['io1', 'io2', 'gp2', 'gp3', 'sc1', 'st1', 'standard'] // io1 | io2 | gp2 | gp3 | sc1 | st1 | standard
      // },
      // {
      //   Name: 'description',
      //   Values: []
      // },
      {
        Name: 'image-type',
        Values: ['machine'] //machine | kernel | ramdisk
      },
      // {
      //   Name: 'name',
      //   Values: ['ubuntu*']
      // },
      // {
      //   Name: 'description',
      //   Values: ['ubuntu*']
      // },
      // {
      //   Name: 'platform',
      //   Values: ['ubuntu']
      // },
      {
        Name: 'state',
        Values: ['available'] // available | pending | failed
      }
      // {
      //   Name: 'virtualization-type',
      //   Values: [] // paravirtual | hvm
      // }
    ]

    if (arch?.length > 0) {
      filters.push({
        Name: 'architecture',
        Values: arch // i386 | x86_64 | arm64
      })
    }

    if (query) {
      if (!query.includes('*')) {
        query = `*${query}*`
      }
      filters.push(
        {
          Name: 'name',
          Values: [query]
        },
        {
          Name: 'description',
          Values: [query]
        }
      )
    }

    if (volumeTypes.length > 0) {
      filters.push({
        Name: 'block-device-mapping.volume-type',
        Values: volumeTypes // io1 | io2 | gp2 | gp3 | sc1 | st1 | standard
      })
    }

    const input = {
      Owners: ['self', 'amazon', 'aws-marketplace'],
      IncludeDeprecated: false,
      Filters: filters
    }

    imageInfo.loading = true
    imageInfo.loaded = false
    imageInfo.data = []
    try {
      const data = await ec2client.send(new DescribeImagesCommand(input))
      imageInfo.data = data.Images
    } catch (err) {
      imageInfo.error = err?.message ?? err
    }
    imageInfo.loading = false
    imageInfo.loaded = true
  }

  const fetchKeyPairs = async (r) => {
    const tmpRegion = r ?? region.value

    keyPairInfo.region = tmpRegion
    keyPairInfo.data = []

    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: keyPairInfo.region
    })

    const input = {}
    keyPairInfo.loading = true
    keyPairInfo.loaded = false
    try {
      const data = await ec2client.send(new DescribeKeyPairsCommand(input))
      keyPairInfo.data = data.KeyPairs.map((item) => ({
        label: item.KeyName,
        value: item.KeyName
      }))
    } catch (err) {
      keyPairInfo.error = err?.message ?? err
    }
    keyPairInfo.loading = false
    keyPairInfo.loaded = true
  }

  const fetchAll = async (r, z, vpcId) => {
    return await Promise.all([
      fetchZones(r),
      fetchKeyPairs(r),
      fetchInstanceTypes('', r),
      fetchVpcs('', r),
      fetchSubnets('', r, z, vpcId),
      fetchSecrityGroups('', r, vpcId)
    ])
  }

  const resetAll = () => {
    keyInfo.loaded = false
    keyInfo.loading = false
    // keyInfo.region = ''
    // keyInfo.accessKey = ''
    // keyInfo.secretKey = ''
    keyInfo.valid = false
    keyInfo.error = null

    regionInfo.loaded = false
    regionInfo.loading = false
    regionInfo.error = null
    regionInfo.data = []
    resetZoneInfo()
    resetInstanceTypeInfo()
    resetVpcInfo()
    resetSubnetInfo()
    resetSecurityGroupInfo()
    resetImageInfo()
    resetKeyPairInfo()
  }

  const resetZoneInfo = () => {
    zoneInfo.region = ''
    zoneInfo.loaded = false
    zoneInfo.loading = false
    zoneInfo.nextToken = ''
    zoneInfo.error = null
    zoneInfo.data = []
  }
  const resetInstanceTypeInfo = () => {
    instanceTypeInfo.region = ''
    instanceTypeInfo.loaded = false
    instanceTypeInfo.loading = false
    instanceTypeInfo.nextToken = ''
    instanceTypeInfo.error = null
    instanceTypeInfo.data = []
  }

  const resetVpcInfo = () => {
    vpcInfo.region = ''
    vpcInfo.loaded = false
    vpcInfo.loading = false
    vpcInfo.error = null
    vpcInfo.nextToken = ''
    vpcInfo.data = []
  }

  const resetSubnetInfo = () => {
    subnetInfo.region = ''
    subnetInfo.zone = ''
    subnetInfo.vpcId = ''
    subnetInfo.loaded = false
    subnetInfo.loading = false
    subnetInfo.error = null
    subnetInfo.nextToken = ''
    subnetInfo.data = []
  }

  const resetSecurityGroupInfo = () => {
    securityGroupInfo.region = ''
    securityGroupInfo.vpcId = ''
    securityGroupInfo.loaded = false
    securityGroupInfo.loading = false
    securityGroupInfo.error = null
    securityGroupInfo.data = []
  }

  const resetImageInfo = () => {
    imageInfo.region = ''
    imageInfo.loaded = false
    imageInfo.loading = false
    imageInfo.data = []
  }

  const resetKeyPairInfo = () => {
    keyPairInfo.region = ''
    keyPairInfo.loaded = false
    keyPairInfo.loading = false
    keyPairInfo.data = []
  }

  return {
    accessKey,
    secretKey,
    defaultRegions,
    volumeTypes,
    region,
    zone,
    vpc,
    keyInfo: readonly(keyInfo),
    regionInfo: readonly(regionInfo),
    zoneInfo: readonly(zoneInfo),
    instanceTypeInfo: readonly(instanceTypeInfo),
    vpcInfo: readonly(vpcInfo),
    subnetInfo: readonly(subnetInfo),
    securityGroupInfo: readonly(securityGroupInfo),
    imageInfo: readonly(imageInfo),
    imageDetail: readonly(imageDetail),
    keyPairInfo: readonly(keyPairInfo),
    validateKeys,
    fetchRegions,
    fetchZones,
    fetchInstanceTypes,
    fetchVpcs,
    fetchSubnets,
    fetchSecrityGroups,
    fetchKeyPairs,
    fetchAll,
    resetAll,
    resetZoneInfo,
    resetInstanceTypeInfo,
    resetVpcInfo,
    resetSubnetInfo,
    resetSecurityGroupInfo,
    resetImageInfo,
    resetKeyPairInfo,
    fetchImages,
    fetchImageById
  }
}
