import { reactive, watchEffect } from 'vue'

function parseSchemaDefaultValue(field) {
  if (field?.default !== undefined) {
    return typeof field.default === 'object' ? JSON.parse(JSON.stringify(field.default)) : field.default
  }
  if (field.type === 'string') {
    return ''
  }
  if (field.type === 'bool') {
    return false
  }
  if (field.type === 'map') {
    return {}
  }
  if (field.type === 'slice') {
    return []
  }
  return ''
}

const linkReg = /(https:\/\/[^\s]+)/g
const replacer = (a, b) => {
  let link  = b
  if (b.endsWith('.') ) {
    link = b.substring(0, b.length-1)
  }
 return `<a target="_blank" href="${link}">${a}</a>`
}

export default function useFormFromSchema(schema) {
  const form = reactive({
    provider: '',
    config: {},
    options: {}
  })
  const desc = reactive({
    provider: '',
    config: {},
    options: {}
  })
  watchEffect(() => {
    const configEntries = Object.entries(schema.config)
    const config = configEntries.reduce((t, [k, v]) => {
      t[k] = parseSchemaDefaultValue(v)
      return t
    }, {})
    const configDesc = configEntries.reduce((t, [k, v]) => {
      t[k] = (v?.description ?? '').replace(linkReg, replacer)
      return t
    }, {})
    const optionsEntries = Object.entries(schema.options)
    const options = optionsEntries.reduce((t, [k, v]) => {
      t[k] = parseSchemaDefaultValue(v)
      return t
    }, {})
    const optionsDesc = optionsEntries.reduce((t, [k, v]) => {
      t[k] = (v?.description ?? '').replace(linkReg, replacer)
      return t
    }, {})
    form.provider = schema.id
    form.config = config
    form.options = options
    desc.provider = schema.id
    desc.config = configDesc
    desc.options = optionsDesc
  })
  return {
    form,
    desc
  }
}

export function useDescFromSchema(schema) {
  const desc = reactive({
    config: {},
    options: {}
  })
  watchEffect(() => {
    const configEntries = Object.entries(schema.config)
    const configDesc = configEntries.reduce((t, [k, v]) => {
      t[k] = (v?.description ?? '').replace(linkReg, replacer)
      return t
    }, {})

    const optionsEntries = Object.entries(schema.options)
    const optionsDesc = optionsEntries.reduce((t, [k, v]) => {
      t[k] = (v?.description ?? '').replace(linkReg, replacer)
      return t
    }, {})
    desc.provider = schema.id
    desc.config = configDesc
    desc.options = optionsDesc
  })
  return {
    desc
  }
}
