import { reactive, readonly } from 'vue'
// state
const state = {
  theme: 'theme-light',
  themes: ['theme-light']
}
const createStore = () => {
  return reactive(state)
}

// actions
function changeTheme (state) {
  return (theme) => {
    if (state.themes.includes(theme)) {
      state.theme = theme
    }
  }
}

function createAction(state) {
  return {
    changeTheme: changeTheme(state)
  }
}

// use store
const themeState = createStore();
const themeAction = createAction(themeState);

export default function useThemeStore() {
  return {
    state: readonly(themeState),
    action: readonly(themeAction),
  }
}
