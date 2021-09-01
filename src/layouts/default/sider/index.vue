<template>
  <nav class="k-app-nav border-r overflow-y-auto">
    <nav-group v-for="g in routeGroups" :key="g.name"
      :routeGroup="g"
      :expanded-state-map="stateMap"
      @toggle-open="toggleOpenState($event)"
      >
      </nav-group>
  </nav>
</template>
<script>
import NavGroup from "./NavGroup.vue"
import useRouteGroups from '../composables/useRouteGroups.js'
import useRouteGroupState from '../composables/useRouteGroupState.js'
import { computed } from 'vue'
export default {
  setup() {
    const { routeGroups: rootRouteGroups, currentGroup } = useRouteGroups()
    const {stateMap, toggleOpenState} = useRouteGroupState(rootRouteGroups)
    const routeGroups = computed(() => {
      return currentGroup.value.children
    })
    return {
      routeGroups,
      stateMap,
      toggleOpenState,
    }
  },
  components: {
    NavGroup
  }  
}
</script>
