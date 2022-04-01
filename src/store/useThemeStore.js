import { defineStore } from 'pinia'

const useThemeStore = defineStore('themeStore', {
  state: () => {
    return {
      theme: 'theme-light',
      themes: ['theme-light']
    }
  },

  actions: {
    changeTheme(theme) {
      if (this.themes.includes(theme)) {
        this.theme = theme
      }
    }
  }
})

export default useThemeStore
