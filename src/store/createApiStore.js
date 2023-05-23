import { stringify } from '@/utils/error.js'

export default function createApiStore({ fetchList }) {
  return {
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
      add(p) {
        if (this.loading || this.error) {
          return
        }
        this.data.push(p)
      },
      update(p) {
        if (this.loading || this.error) {
          return
        }
        const index = this.data.findIndex((t) => t.id === p.id)
        if (index > -1) {
          this.data.splice(index, 1, p)
        }
      },
      remove(id) {
        const index = this.data.findIndex((item) => item.id === id)
        if (index > -1) {
          this.data.splice(index, 1)
        }
      }
    }
  }
}
