import { reactive, readonly } from 'vue'
import request from '@/utils/request'

export function useWhitelist() {
  const whitelistInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    data: []
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

  return {
    updateWhitelist,
    whitelistInfo: readonly(whitelistInfo)
  }
}
