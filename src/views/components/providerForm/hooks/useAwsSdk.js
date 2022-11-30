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
import { IAMClient, ListInstanceProfilesCommand } from '@aws-sdk/client-iam'
import { reactive, ref, readonly, computed, shallowReactive, onBeforeUnmount } from 'vue'
import Schema from 'async-validator'
const descriptor = {
  accessKey: {
    required: true,
    message: '"Access Key" is required'
  },
  secretKey: {
    required: true,
    message: '"Secret Key" is required'
  },
  region: {
    required: true,
    message: '"Region" is required'
  }
}
const validator = new Schema(descriptor)

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

// https://aws.amazon.com/cn/ec2/instance-types/
const instanceTypeSeries = [
  'mac1',
  't4g',
  't3',
  't3a',
  't2',
  'm6g',
  'm6gd',
  'm6i',
  'm6a',
  'm5',
  'm5d',
  'm5a',
  'm5ad',
  'm5n',
  'm5dn',
  'm5zn',
  'm4',
  'a1',
  'c7g',
  'c6g',
  'c6gd',
  'c6gn',
  'c6i',
  'c6a',
  'Hpc6a',
  'c5',
  'c5d',
  'c5a',
  'c5ad',
  'c5n',
  'c4',
  'r6g',
  'r6gd',
  'r6i',
  'r5',
  'r5d',
  'r5a',
  'r5ad',
  'r5b',
  'r5n',
  'r5dn',
  'r4',
  'x2gd',
  'x2idn',
  'x2iedn',
  'x2iezn',
  'x1e',
  'x1',
  'u-3tb1',
  'u-6tb1',
  'u-9tb1',
  'u-12tb1',
  'u-18tb1',
  'u-24tb1',
  'z1d',
  'p4d',
  'p3',
  'p3dn',
  'p2',
  'dl1',
  'trn1',
  'inf1',
  'g5',
  'g5g',
  'g4dn',
  'g4ad',
  'g3s',
  'g3',
  'f1',
  'vt1',
  'Im4gn',
  'Is4gen',
  'i4i',
  'i3',
  'i3en',
  'd2',
  'd3',
  'd3en',
  'h1'
]

// const enCollator = new Intl.Collator('en')

export default function useAwsSdk() {
  let abortController = null
  const accessKey = ref('')
  const secretKey = ref('')
  const region = ref('')
  const zone = ref('')
  const vpc = ref('')
  onBeforeUnmount(() => {
    abortController?.abort()
  })
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
  const instanceTypeInfo = shallowReactive({
    region: '',
    loading: false,
    loaded: false,
    arch: [], // 'arm64', 'i386', 'x86_64'
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

  const keyPairInfo = reactive({
    region: '',
    loading: false,
    loaded: true,
    error: null,
    data: []
  })

  const instanceProfileInfo = shallowReactive({
    region: '',
    loading: false,
    loaded: true,
    isTruncated: false,
    marker: null,
    error: null,
    data: []
  })

  const validateKeys = async (access, secret, r) => {
    keyInfo.accessKey = access ?? accessKey.value
    keyInfo.secretKey = secret ?? secretKey.value
    keyInfo.region = r ?? region.value
    try {
      await validator.validate(keyInfo)
    } catch ({ errors, fields }) {
      keyInfo.error = errors.map((e) => e.message).join('. ')
      keyInfo.valid = false
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
    abortController?.abort()
    abortController = new AbortController()
    const abortSignal = abortController.signal
    try {
      const data = await ec2client.send(new DescribeRegionsCommand({}), { abortSignal })
      regionInfo.data = data.Regions
      keyInfo.valid = true
    } catch (err) {
      if (err.name !== 'AbortError') {
        regionInfo.error = err.message ?? err
        keyInfo.error = err.message ?? err
        keyInfo.valid = false
      }
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
    const abortSignal = abortController.signal
    try {
      const data = await ec2client.send(
        new DescribeAvailabilityZonesCommand({ Filters: [{ Name: 'region-name', Values: [zoneInfo.region] }] }),
        { abortSignal }
      )
      zoneInfo.data = data.AvailabilityZones.map((z) => ({ label: z.ZoneName, value: z.ZoneName }))
    } catch (err) {
      if (err.name !== 'AbortError') {
        zoneInfo.error = err.message ?? err
      }
    }
    zoneInfo.loading = false
    zoneInfo.loaded = true
  }
  const fetchInstanceTypes = async (nextToken, r, arch = [], series = []) => {
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

    const filters = []

    if (arch.length > 0) {
      filters.push({ Name: 'processor-info.supported-architecture', Values: [...arch] })
    }
    if (series.length > 0) {
      filters.push({ Name: 'instance-type', Values: [...series.map((s) => `${s}.*`)] })
    }
    const input = { Filters: filters, MaxResults: 100 }
    if (nextToken) {
      input.NextToken = nextToken
    } else {
      instanceTypeInfo.data = []
      instanceTypeInfo.nextToken = ''
    }
    const abortSignal = abortController.signal
    try {
      const data = await ec2client.send(new DescribeInstanceTypesCommand(input), { abortSignal })
      const d = data.InstanceTypes.map((t) => ({
        value: t.InstanceType,
        label: `${t.InstanceType} (vCPU: ${t.VCpuInfo?.DefaultVCpus}, Memory: ${t.MemoryInfo?.SizeInMiB / 1024} GiB)`,
        group: t.InstanceType.split('.')[0],
        raw: t
      }))
      instanceTypeInfo.data = [...instanceTypeInfo.data, ...d]
      instanceTypeInfo.nextToken = data.NextToken
    } catch (err) {
      if (err.name !== 'AbortError') {
        instanceTypeInfo.error = err.message ?? err
        instanceTypeInfo.nextToken = ''
      } else {
        resetInstanceTypeInfo()
      }
    }
    instanceTypeInfo.loading = false
    instanceTypeInfo.loaded = true
  }

  const fetchAllInstanceTypes = async (r, arch = [], series = []) => {
    const tmpRegion = r ?? region.value
    if (instanceTypeInfo.region && instanceTypeInfo.region !== tmpRegion) {
      instanceTypeInfo.error = 'Region has changed, no further instance types information is available'
      return false
    }
    if (arch.length !== instanceTypeInfo.arch.length || arch.some((item) => !instanceTypeInfo.arch.includes(item))) {
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

    const filters = [
      {
        Name: 'supported-virtualization-type',
        Values: ['hvm']
      },
      {
        Name: 'bare-metal',
        Values: ['false']
      }
    ]

    if (arch.length > 0) {
      filters.push({ Name: 'processor-info.supported-architecture', Values: [...arch] })
    }
    if (series.length > 0) {
      filters.push({ Name: 'instance-type', Values: [...series.map((s) => `${s}.*`)] })
    }
    const input = { Filters: filters, MaxResults: 100 }

    instanceTypeInfo.data = []
    instanceTypeInfo.nextToken = ''
    const abortSignal = abortController.signal
    let tmpData = []

    const loadData = async (nextToken = '') => {
      if (nextToken) {
        input.NextToken = nextToken
      } else {
        input.NextToken = null
      }

      try {
        const data = await ec2client.send(new DescribeInstanceTypesCommand(input), { abortSignal })
        const d = data.InstanceTypes.map((t) => ({
          value: t.InstanceType,
          label: `${t.InstanceType} (vCPU: ${t.VCpuInfo?.DefaultVCpus}, Memory: ${t.MemoryInfo?.SizeInMiB / 1024} GiB)`,
          group: t.InstanceType.split('.')[0],
          vCPU: t.VCpuInfo?.DefaultVCpus,
          memory: t.MemoryInfo?.SizeInMiB / 1024,
          raw: t
        }))
        tmpData.push(...d)
        if (data.NextToken) {
          await loadData(data.NextToken)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          instanceTypeInfo.error = err.message ?? err
        } else {
          resetInstanceTypeInfo()
          tmpData = []
        }
      }
    }
    await loadData()
    tmpData.sort((a, b) => {
      if (a.value > b.value) {
        return 1
      }
      if (a.value < b.value) {
        return -1
      }
      return 0
    })
    instanceTypeInfo.data = tmpData
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
    const abortSignal = abortController.signal
    try {
      const data = await ec2client.send(new DescribeVpcsCommand(input), { abortSignal })
      const d = data.Vpcs.map((v) => {
        const nameTagValue = v.Tags?.find((t) => t.Key === 'Name')?.Value
        return {
          label: `${v.VpcId}${nameTagValue ? ` (${nameTagValue})` : ''}`,
          value: v.VpcId,
          raw: v
        }
      })
      vpcInfo.data.push(...d)
      vpcInfo.nextToken = data.NextToken
    } catch (err) {
      if (err.name !== 'AbortError') {
        vpcInfo.error = err.message ?? err
        vpcInfo.nextToken = ''
      } else {
        resetVpcInfo()
      }
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
    const abortSignal = abortController.signal
    try {
      const data = await ec2client.send(new DescribeSubnetsCommand(input), { abortSignal })
      const d = data.Subnets.map((s) => ({
        label: s.SubnetId,
        value: s.SubnetId
      }))
      subnetInfo.data.push(...d)
      subnetInfo.nextToken = data.NextToken
    } catch (err) {
      if (err.name !== 'AbortError') {
        subnetInfo.error = err.message ?? err
        subnetInfo.nextToken = ''
      } else {
        resetSubnetInfo()
      }
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
    const abortSignal = abortController.signal
    try {
      const data = await ec2client.send(new DescribeSecurityGroupsCommand(input), { abortSignal })
      const d = data.SecurityGroups.map((sg) => ({
        label: `${sg.GroupName} (${sg.GroupId})`,
        value: sg.GroupId
      }))
      securityGroupInfo.data.push(...d)
      securityGroupInfo.nextToken = data.NextToken
    } catch (err) {
      if (err.name !== 'AbortError') {
        securityGroupInfo.error = err.message ?? err
        securityGroupInfo.nextToken = ''
      } else {
        resetSecurityGroupInfo()
      }
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

    // const filters = [
    //   {
    //     Name: 'image-id',
    //     Values: [imageId]
    //   }
    // ]
    const input = {
      IncludeDeprecated: false,
      // Filters: filters,
      ImageIds: [imageId]
    }
    imageDetail.data = null
    imageDetail.loading = true
    imageDetail.loaded = false
    const abortSignal = abortController.signal
    try {
      const data = await ec2client.send(new DescribeImagesCommand(input), { abortSignal })

      if (data.Images?.length === 0) {
        imageDetail.error = `Not found image by id(${imageId})`
        imageDetail.data = null
      } else {
        imageDetail.data = data.Images[0]
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        imageDetail.error = err?.message ?? err
      }
    }
    imageDetail.loading = false
    imageDetail.loaded = true
  }

  const fetchImages = async (r) => {
    const options = {
      ubuntu: {
        ownerIds: [
          '099720109477'
          // '898082745236', // Deep Learning AMI
          // '652529143229' // with SQL Server
        ],
        namePrefix: ['ubuntu/images/hvm-ssd/ubuntu-']
      },
      amazonLinux: {
        ownerIds: [
          '137112412989'
          // '690405935483', // 1. .NET, Mono, PowerShell, and MATE DE pre-installed; 2. with SQL Server
          // '898082745236' // Deep Learning AMI
        ],
        namePrefix: ['amzn2-ami-kernel-']
      },
      redHat: {
        ownerIds: [
          '309956199498'
          // '199830906635' // with SQL Server
        ],
        namePrefix: ['RHEL-', 'RHEL_HA']
      },
      suseLinux: {
        ownerIds: ['013907871322'],
        namePrefix: ['suse-sles-']
      },
      debian: {
        ownerIds: ['136693071363'],
        namePrefix: ['debian-']
      }
    }

    const tmpRegion = r ?? region.value
    imageInfo.region = tmpRegion

    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: imageInfo.region
    })

    const { platforms, inputs } = Object.entries(options).reduce(
      (t, [p, o]) => {
        const filters = [
          {
            Name: 'owner-id',
            Values: o.ownerIds
          },
          {
            Name: 'image-type',
            Values: ['machine'] //machine | kernel | ramdisk
          },
          {
            Name: 'name',
            Values: o.namePrefix.map((n) => `${n}*`)
          },
          {
            Name: 'state',
            Values: ['available'] // available | pending | failed
          },
          {
            Name: 'virtualization-type',
            Values: ['hvm'] // paravirtual | hvm
          },
          {
            Name: 'architecture',
            Values: ['x86_64', 'arm64']
          },
          {
            Name: 'owner-alias',
            Values: ['amazon']
          }
        ]
        const input = {
          IncludeDeprecated: false,
          Filters: filters
        }

        t.platforms.push(p)
        t.inputs.push(input)

        return t
      },
      { platforms: [], inputs: [] }
    )

    // if (volumeTypes.length > 0) {
    //   filters.push({
    //     Name: 'block-device-mapping.volume-type',
    //     Values: volumeTypes // io1 | io2 | gp2 | gp3 | sc1 | st1 | standard
    //   })
    // }

    imageInfo.loading = true
    imageInfo.loaded = false
    imageInfo.data = []
    const abortSignal = abortController.signal
    try {
      const promies = inputs.map((input) => ec2client.send(new DescribeImagesCommand(input), { abortSignal }))
      const data = await Promise.all(promies)
      imageInfo.data = data.map((d, index) => ({ platform: platforms[index], data: d.Images }))
    } catch (err) {
      if (err.name !== 'AbortError') {
        imageInfo.error = err?.message ?? err
      }
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
    const abortSignal = abortController.signal
    try {
      const data = await ec2client.send(new DescribeKeyPairsCommand(input), { abortSignal })
      keyPairInfo.data = data.KeyPairs.map((item) => ({
        label: item.KeyName,
        value: item.KeyName
      }))
    } catch (err) {
      if (err.name !== 'AbortError') {
        keyPairInfo.error = err?.message ?? err
      }
    }
    keyPairInfo.loading = false
    keyPairInfo.loaded = true
  }

  const fetchInstanceProfiles = async (marker, r) => {
    const tmpRegion = r ?? region.value

    if (marker && instanceProfileInfo.region !== tmpRegion) {
      instanceProfileInfo.error = 'Region has changed, no further instance profiles information is available'
      return false
    }

    instanceProfileInfo.region = tmpRegion

    const client = new IAMClient({
      credentials: credentials.value,
      region: keyPairInfo.region
    })
    const input = {
      MaxItems: 100
    }

    if (marker) {
      input.Marker = marker
    } else {
      instanceProfileInfo.data = []
    }
    instanceProfileInfo.loading = true
    instanceProfileInfo.loaded = false
    const abortSignal = abortController.signal
    try {
      const data = await client.send(new ListInstanceProfilesCommand(input), { abortSignal })
      if (data.IsTruncated && data.Marker) {
        instanceProfileInfo.isTruncated = true
        instanceProfileInfo.marker = data.Marker
      }
      const d = data.InstanceProfiles.map((p) => ({
        label: p.InstanceProfileName,
        value: p.InstanceProfileName,
        raw: p
      }))
      instanceProfileInfo.data = [...instanceProfileInfo.data, ...d]
    } catch (err) {
      if (err.name !== 'AbortError') {
        instanceProfileInfo.error = err?.message ?? err
        instanceProfileInfo.marker = ''
      } else {
        resetInstanceProfileInfo()
      }
    }
    instanceProfileInfo.loading = false
    instanceProfileInfo.loaded = true
  }

  const fetchAll = async (r, z, vpcId) => {
    return await Promise.all([
      fetchZones(r),
      fetchKeyPairs(r),
      fetchInstanceTypes('', r),
      fetchVpcs('', r),
      fetchSubnets('', r, z, vpcId),
      fetchSecrityGroups('', r, vpcId),
      fetchInstanceProfiles('', r)
    ])
  }

  const updateImageDetail = (image) => {
    imageDetail.data = image
  }

  const resetAll = () => {
    // keyInfo.loaded = false
    // keyInfo.loading = false
    // keyInfo.error = null
    // // keyInfo.region = ''
    // // keyInfo.accessKey = ''
    // // keyInfo.secretKey = ''
    // keyInfo.valid = false
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
    resetInstanceProfileInfo()
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
    imageInfo.error = null
    imageInfo.data = []
  }

  const resetKeyPairInfo = () => {
    keyPairInfo.region = ''
    keyPairInfo.loaded = false
    keyPairInfo.loading = false
    keyPairInfo.error = null
    keyPairInfo.data = []
  }

  const resetInstanceProfileInfo = () => {
    instanceProfileInfo.region = ''
    instanceProfileInfo.loaded = false
    instanceProfileInfo.loading = false
    instanceProfileInfo.error = null
    instanceProfileInfo.data = []
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
    instanceTypeSeries: readonly(instanceTypeSeries),
    instanceProfileInfo: readonly(instanceProfileInfo),
    validateKeys,
    fetchRegions,
    fetchZones,
    fetchInstanceTypes,
    fetchAllInstanceTypes,
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
    fetchImageById,
    fetchInstanceProfiles,
    updateImageDetail
  }
}
