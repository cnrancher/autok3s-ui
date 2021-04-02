import { EC2Client, DescribeRegionsCommand, DescribeAvailabilityZonesCommand, DescribeInstanceTypesCommand, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeAccountAttributesCommand } from "@aws-sdk/client-ec2"
import { IAMClient, ListAccessKeysCommand} from '@aws-sdk/client-iam'
import { ref, computed, watch, watchEffect } from "vue"

// These need to match the supported list in docker-machine:
// https://github.com/docker/machine/blob/master/drivers/amazonec2/region.go
export const REGIONS = [
  'af-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-east-1',
  'ap-south-1',
  'me-south-1',
  'ca-central-1',
  'cn-north-1',
  'cn-northwest-1',
  'eu-north-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'us-gov-west-1',
  'us-gov-east-1',
]

export default function useAwsSdk () {
  const zoneLoading = ref(false)
  const zoneLoadError = ref('')
  const instanceTypeLoading = ref(false)
  const instanceTypeLoadError = ref('')
  const vpcLoading = ref(false)
  const vpcLoadError = ref('')
  const subnetLoading = ref(false)
  const subnetLoadError = ref('')
  const securityGroupLoading = ref(false)
  const securityGroupLoadError = ref('')

  const accessKeyLoading = ref(false)
  const accessKeyLoadError = ref('')

  const validateKeysError = ref('')
  const validatingKeys = ref(false)
  const keyInvalid = ref(true)

  const accessKeyId = ref('')
  const secretAccessKey = ref('')

  const loading = computed(() => {
    return [zoneLoading, instanceTypeLoading, vpcLoading, subnetLoading, securityGroupLoading, accessKeyLoading, validatingKeys]
      .map((state) => state.value)
      .some((state) => state === true)
  })
  const errors = computed(() => {
    const errors = [zoneLoadError, instanceTypeLoadError, vpcLoadError, subnetLoadError, securityGroupLoadError, accessKeyLoadError, validateKeysError]
      .filter((e) => e.value)
      .map(e => e.value)

    return [...new Set(errors)]
  })

  const regions = ref(REGIONS)
  const zones = ref([])
  const instanceTypes = ref([])
  const vpcs = ref([])
  const subnets = ref([])
  const securityGroups = ref([])

  const accessKeys = ref([])

  const region = ref('us-east-1')
  const zone = ref('us-east-1a')
  const vpcId = ref('')
  const credentials = computed(() => {
    return {
      accessKeyId: accessKeyId.value,
      secretAccessKey: secretAccessKey.value
    }
  })
  // const loadRegions = async () => {
  //   regionLoading.value = true
  //   const ec2client = new EC2Client({
  //     credentials: credentials.value,
  //     region: region.value
  //   })
  //   try {
  //     const data = await ec2client.send(new DescribeRegionsCommand({}))
  //     regions.value = data.Regions
  //   } catch (err) {
  //     regionLoadError.value = err.message ?? err
  //   }
  //   regionLoading.value = false
  // }
  const loadZones = async () => {
    zoneLoading.value = true
    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: region.value
    })
    try {
      const data = await ec2client.send(new DescribeAvailabilityZonesCommand({ Filters: [{ Name: 'region-name', Values: [region.value]}]}))
      zones.value = data.AvailabilityZones
    } catch (err) {
      zoneLoadError.value = err.message ?? err
      zones.value = []
    }
    zoneLoading.value = false
  }

  const loadAllInstanceTypes = async (ec2client, nextToken) => {
    // const input = { Filters: [{Name: 'supported-root-device-type', Values: ['', '']}]}
    const results = []
    let input = {}
    if (nextToken) {
      input.NextToken = nextToken
    }
    const data = await ec2client.send(new DescribeInstanceTypesCommand(input))
    results.push(...data.InstanceTypes)
    if (data.NextToken) {
      const types = await loadAllInstanceTypes(ec2client, data.NextToken)
      results.push(...types)
    }
    return results
  }
  const loadInstanceTypes = async () => {
    instanceTypeLoading.value = true
    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: region.value
    })
    try {
      instanceTypes.value = await loadAllInstanceTypes(ec2client)
    } catch (err) {
      instanceTypeLoadError.value = err.message ?? err
      instanceTypes.value = []
    }
    instanceTypeLoading.value = false
  }

  const loadAllVpcs = async (ec2client, nextToken) => {
    const results = []
    const input = {Filters: [{Name: 'state', Values: ['available']}]}
    if (nextToken) {
      input.NextToken = nextToken
    }
    const data = await ec2client.send(new DescribeVpcsCommand(input))
    results.push(...data.Vpcs)
    if (data.NextToken) {
      const vpcs = await loadAllVpcs(ec2client, data.NextToken)
      results.push(...vpcs)
    }
    return results
  }

  const loadVpcs = async () => {
    vpcLoading.value = true
    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: region.value
    })
    try {
      vpcs.value = await loadAllVpcs(ec2client)
    } catch (err) {
      vpcLoadError.value = err.message ?? err
      vpcs.value = []
    }
    vpcLoading.value = false
  }

  const loadAllSubnets = async (ec2client, zone, vpcId, nextToken) => {
    const results = []
    let input = {Filters: [{Name: 'availability-zone', Values: [zone]}, {Name: 'vpc-id', Values: [vpcId]}]}
    if (nextToken) {
      input.NextToken = nextToken
    }
    const data = await ec2client.send(new DescribeSubnetsCommand(input))
    results.push(...data.Subnets)
    if (data.NextToken) {
      const subnets = await loadAllSubnets(ec2client, zone, vpcId, data.NextToken)
      results.push(...subnets)
    }
    return results
  }
  const loadSubnets = async () => {
    subnetLoading.value = true
    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: region.value
    })
    try {
      subnets.value = await loadAllSubnets(ec2client, zone.value, vpcId.value)
    } catch (err) {
      subnetLoadError.value = err.message ?? err
      subnets.value = []
    }
    subnetLoading.value = false
  }

  const loadAllSecurityGroups = async (ec2client, vpcId, nextToken) => {
    const results = []
    let input = {Filters: [{Name: 'vpc-id', Values: [vpcId]}]}
    if (nextToken) {
      input.NextToken = nextToken
    }
    const data = await ec2client.send(new DescribeSecurityGroupsCommand(input))
    results.push(...data.SecurityGroups)
    if (data.NextToken) {
      const securityGroups = await loadAllSubnets(ec2client, vpcId, data.NextToken)
      results.push(...securityGroups)
    }
    return results
  }
  const loadSecurityGroups = async () => {
    securityGroupLoading.value = true
    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: region.value
    })
    try {
      securityGroups.value = await loadAllSecurityGroups(ec2client, vpcId.value)
    } catch (err) {
      securityGroupLoadError.value = err.message ?? err
    }
    securityGroupLoading.value = false
  }

  const loadAllAccessKeys = async (iamClient, marker) => {
    const results = []
    let input = {}
    if (marker) {
      input.Marker = marker
    }
    const data = await iamClient.send(new ListAccessKeysCommand(input))
    results.push(...data.AccessKeyMetadata)
    if (data.IsTruncated) {
      const keys = await loadAllAccessKeys(iamClient, data.Marker)
      results.push(...keys)
    }
    return results
  }
  const loadAccessKeys = async () => {
    accessKeyLoading.value = true
    const iamClient = new IAMClient({
      credentials: credentials.value,
      region: region.value
    })
    try {
      accessKeys.value = await loadAllAccessKeys(iamClient)
    } catch (err) {
      accessKeyLoadError.value = err.message ?? err
    }
    accessKeyLoading.value = false
  }

  // const validate = async (regions, index = 0) => {
  //   const ec2client = new EC2Client({
  //     credentials: credentials.value,
  //     region: regions[index],
  //     maxAttempts: 0
  //   })
  //   try {
  //     await ec2client.send(new DescribeAccountAttributesCommand({}))
  //     return regions[index]
  //   } catch (err) {
  //     index = index + 1
  //     if (index >= regions.length) {
  //       return
  //     }
  //     return await validate(regions, index)
  //   }
  // }

  const validateKeys = async () => {
    keyInvalid.value = true
    if (!accessKeyId.value) {
      validateKeysError.value = '"Access Key" is required'
      return
    }
    if (!secretAccessKey.value) {
      validateKeysError.value = '"Secret Key" are required'
      return
    }
    if (!accessKeyId.value || !secretAccessKey.value) {
      validateKeysError.value = '"Access Key" and "Secret Key" are required'
      return
    }
    validatingKeys.value = true
    const currentRegion = region.value
    const ec2client = new EC2Client({
      credentials: credentials.value,
      region: currentRegion,
    })
    try {
      await ec2client.send(new DescribeAccountAttributesCommand({}))
      keyInvalid.value = false
    } catch (err) {
      validateKeysError.value = err.message ?? err
      // validateKeysError.value = '401 AuthFailure: There was a problem validating your keys. Enter valid credentials and try again.'
    }
    validatingKeys.value = false
  }

  watch([region, keyInvalid,], ([r, k]) => {
    if (!k && r) {
      loadVpcs()
      loadZones()
      loadInstanceTypes()
      loadAccessKeys()
      return
    }
    vpcs.value = []
    zones.value = []
    instanceTypes.value = []
    accessKeys.value = []
  })
  watch([vpcId, keyInvalid], ([vpc, keyInvalid]) => {
    if (vpc && !keyInvalid) {
      loadSecurityGroups()
      return
    }
    securityGroups.value = []
  })
  watch([zone, vpcId, keyInvalid], ([z, vpc, keyInvalid]) => {
    if (z && vpc && !keyInvalid) {
      loadSubnets()
      return
    }
    subnets.value = []
  })

  return {
    keyInvalid,
    validatingKeys,
    region,
    zone,
    vpcId,
    accessKeyId,
    secretAccessKey,

    regions,
    zones,
    instanceTypes,
    vpcs,
    subnets,
    securityGroups,
    accessKeys,

    loading,
    errors,

    // loadZones,
    // loadInstanceTypes,
    // loadVpcs,
    // loadSubnets,
    // loadSecurityGroups,
    // loadAccessKeys,
    validateKeys,
  }
}