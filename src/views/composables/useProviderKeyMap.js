
const PROVIDER_KEY_FIELD_MAP = {
  native: {
    key: 'access-key',
    secret: 'access-secret',
  },
  tencent: {
    key: 'secret-id',
    secret: 'secret-key'
  },
  alibaba: {
    key: 'access-key',
    secret: 'access-secret'
  },
  aws: {
    key: 'access-key',
    secret: 'secret-key'
  }
}

export default function useProviderKeyMap() {
  const providerFields = Object.entries(PROVIDER_KEY_FIELD_MAP)
  const keyMap = providerFields
    .reduce((t, [k, v])=> {
      t[k] = v.key
      return t
    }, {})
  const secretMap = providerFields
  .reduce((t, [k, v])=> {
    t[k] = v.secret
    return t
  }, {})
  return {
    providerKeyMap: keyMap,
    providerSecretMap: secretMap,
    providerKeyFieldMap: PROVIDER_KEY_FIELD_MAP
  }
}