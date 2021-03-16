export function cloneDeep(source) {
  const t = typeof source
  if (['string'].includes(t)) {
    return source
  }

  return JSON.parse(JSON.stringify(source));
}
export function parseSchemaDefaultValue(field) {
  if (field?.default !== undefined) {
    return typeof field.default === 'object' ? JSON.parse(JSON.stringify(field.default)) : field.default;
  }
  if (field.type === 'string') {
    return '';
  }
  if (field.type === 'bool') {
    return false;
  }
  return ''
}
export function overwriteSchemaDefaultValue (schema, defaultVal, excludeKeys) {
  const newSchema = schema ? JSON.parse(JSON.stringify(schema)) : {}
  if (!defaultVal) {
    return newSchema
  }
  let excludeConfigKeys = []
  let excludeOptionsKeys = []
  if (excludeKeys) {
    excludeConfigKeys = excludeKeys.filter((k) => k.startsWith('config.')).map((k) => k.substr(7))
    excludeOptionsKeys = excludeKeys.filter((k) => k.startsWith('options.')).map((k) => k.substr(8))
  }
  Object.entries(newSchema.config)
    .filter(([k, v]) => !excludeConfigKeys.includes(k) && (v.default !== undefined || defaultVal.config[k] !== undefined))
    .forEach(([k, v]) => {
      v.default = defaultVal.config[k]
    })
  Object.entries(newSchema.options)
    .filter(([k, v]) => !excludeOptionsKeys.includes(k) && (v.default !== undefined || defaultVal.options[k] !== undefined))
    .forEach(([k, v]) => {
      v.default = defaultVal.options[k]
    })
    return newSchema
}

export function convertSchemaToFormAndDesc (schema) {
  const form = {
    config: {},
    options: {},
  }
  const desc = {
    config: {},
    options: {}
  }
  const configEntries = Object.entries(schema.config)
  const config = configEntries.reduce((t, [k, v]) => {
    t[k] = parseSchemaDefaultValue(v)
    return t
  }, {})
  const configDesc = configEntries.reduce((t, [k, v]) => {
    t[k] = v?.description ?? ''
    return t
  }, {})
  const optionsEntries = Object.entries(schema.options)
  const options = optionsEntries.reduce((t, [k, v]) => {
    t[k] = parseSchemaDefaultValue(v)
    return t
  }, {})
  const optionsDesc = optionsEntries.reduce((t, [k, v]) => {
    t[k] = v?.description ?? ''
    return t
  }, {})
  form.config = config
  form.options = options
  desc.config = configDesc
  desc.options = optionsDesc
  return {
    form,
    desc,
  }
}

export function convertSchemaToDesc (schema) {
  const desc = {
    config: {},
    options: {}
  }
  const configEntries = Object.entries(schema.config)
  const configDesc = configEntries.reduce((t, [k, v]) => {
    t[k] = v?.description ?? ''
    return t
  }, {})

  const optionsEntries = Object.entries(schema.options)
  const optionsDesc = optionsEntries.reduce((t, [k, v]) => {
    t[k] = v?.description ?? ''
    return t
  }, {})
  desc.config = configDesc
  desc.options = optionsDesc
  return {
    desc,
  }
}

const creatingClustersKey = 'auk3s-ui__creating-clusters'

export function saveCreatingCluster(id) {
  let clusters = []
  try {
    const clustersStr = window.sessionStorage.getItem(creatingClustersKey)
    clusters = JSON.parse(clustersStr ?? '[]')
  } catch (err) {
    console.warn('Parse creating clusters data in sessionStorage error', err)
  }
  if (!clusters.includes(id)) {
    clusters.push(id)
    window.sessionStorage.setItem(creatingClustersKey, JSON.stringify(clusters))
  }
}

export function removeCreatingCluster(id) {
  let clusters = []
  try {
    const clustersStr = window.sessionStorage.getItem(creatingClustersKey)
    clusters = JSON.parse(clustersStr ?? '[]')
  } catch (err) {
    console.warn('Parse creating clusters data in sessionStorage error', err)
  }
  const index = clusters.indexOf(id)
  if (index > -1) {
    clusters.splice(index, 1)
    window.sessionStorage.setItem(creatingClustersKey, JSON.stringify(clusters))
    return true
  }
  return false
}
