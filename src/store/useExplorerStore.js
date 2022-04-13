import { defineStore } from 'pinia'
import { fetchList } from '@/api/explorer.js'
import { stringify } from '@/utils/error.js'

const useExplorerStore = defineStore('explorerStore', {
  state: () => {
    return {
      loading: false,
      error: null,
      data: []
    }
  },
  getters: {
    clusterExplorerMap: (state) => {
      return state.data.reduce((t, c) => {
        t[c.id] = c
        return t
      }, {})
    }
  },
  actions: {
    async loadData() {
      this.loading = true
      try {
        const { data } = await fetchList()
        this.data = data
        this.error = null
      } catch (err) {
        this.data = []
        this.error = stringify(err)
      }
      this.loading = false
    },
    add(template) {
      if (this.loading || this.error) {
        return
      }
      this.data.push(template)
    },
    update(template) {
      if (this.loading || this.error) {
        return
      }
      const index = this.data.findIndex((t) => t.id === template.id)
      if (index > -1) {
        this.data.splice(index, 1, template)
      }
    },
    remove(id) {
      const index = this.data.findIndex((item) => item.id === id)
      if (index > -1) {
        this.data.splice(index, 1)
      }
    }
  }
})

export default useExplorerStore
