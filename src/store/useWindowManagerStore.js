import { defineStore } from 'pinia'

const useWindowManagerStore = defineStore('windowManagerStore', {
  state: () => {
    return {
      tabs: [],
      active: null,
      open: false,
      userHeight: window.localStorage.getItem('wm-height')
    }
  },
  actions: {
    addTab(tab) {
      const tabCached = this.tabs.find((item) => item.id === tab.id)
      if (tabCached) {
        tabCached.renewCount = (tabCached.renewCount ?? 0) + 1
        return
      }
      tab.renewCount = 0
      this.tabs.push(tab)
      this.active = tab.id
      this.open = true
    },
    removeTab(id) {
      const index = this.tabs.findIndex((item) => item.id === id)
      if (index > -1) {
        this.tabs.splice(index, 1)
        if (this.active === id) {
          const nextIndex = index % this.tabs.length
          this.active = this.tabs[nextIndex]?.id ?? null
        }
      }
      if (this.tabs.length === 0) {
        this.open = false
      }
    },
    setActiveTab(id) {
      const index = this.tabs.findIndex((item) => item.id === id)
      if (index > -1) {
        this.active = id
        return true
      }
      return false
    },
    close() {
      this.tabs = []
      this.open = false
    },
    setUserHeight(height) {
      this.userHeight = height
      window.localStorage.setItem('wm-height', height)
    }
  }
})

export default useWindowManagerStore
