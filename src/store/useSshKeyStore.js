import { defineStore } from 'pinia'
import { fetchList } from '@/api/sshKey.js'
import { stringify } from '@/utils/error.js'

const useSshKeyStore = defineStore('sshKeyStore', {
  state: () => {
    return {
      loading: false,
      error: null,
      data: []
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
    add(sshKey) {
      if (this.loading || this.error) {
        return
      }
      this.data.push(sshKey)
    },
    update(sshKey) {
      if (this.loading || this.error) {
        return
      }
      const index = this.data.findIndex((t) => t.id === sshKey.id)
      if (index > -1) {
        this.data.splice(index, 1, sshKey)
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

export default useSshKeyStore
