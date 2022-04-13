import { defineStore } from 'pinia'
import { fetchList } from '@/api/cluster.js'
import { cloneDeep } from '@/utils'
import { stringify } from '@/utils/error.js'
import { SUPPORTED_PROVIDERS } from '@/utils/constants.js'

export function defineClusterStoreFactory(provider) {
  return defineStore(`${provider}Store`, {
    state: () => ({
      loading: false,
      formHistory: [],
      historySize: 1,
      error: null,
      data: [],
      provider
    }),

    actions: {
      async loadData() {
        this.loading = true
        try {
          const { data } = await fetchList(provider)
          this.data = data
          this.error = null
        } catch (err) {
          this.data = []
          this.error = stringify(err)
        }
        this.loading = false
      },

      add(cluster) {
        if (this.loading || this.error) {
          return
        }
        this.data.push({
          ...cluster,
          status: cluster.status?.status,
          region: cluster.options?.region,
          zone: cluster.options?.zone
        })
      },

      update(cluster) {
        if (this.loading || this.error) {
          return
        }
        const index = this.data.findIndex((item) => item.id === cluster.id)
        if (index > -1) {
          const props = {
            region: cluster.options?.region,
            zone: cluster.options?.zone,
            status: cluster.status?.status,
            worker: cluster.worker,
            master: cluster.master
          }
          const temp = { ...cloneDeep(this.data[index]), ...props }
          this.data.splice(index, 1, temp)
        }
      },

      remove(id) {
        const index = this.data.findIndex((item) => item.id === id)
        if (index > -1) {
          this.data.splice(index, 1)
        }
      },

      saveFormHistory(form) {
        if (this.formHistory.length >= this.historySize) {
          this.formHistory.shift()
        }
        this.formHistory.push(cloneDeep(form))
      }
    }
  })
}

const defineClusterStores = SUPPORTED_PROVIDERS.reduce((t, c) => {
  t[c] = defineClusterStoreFactory(c)

  return t
}, {})

export default function useClusterStores() {
  return Object.entries(defineClusterStores).reduce((t, [k, v]) => {
    t[k] = v()

    return t
  }, {})
}
