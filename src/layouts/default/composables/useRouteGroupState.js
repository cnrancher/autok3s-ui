import { reactive, readonly } from 'vue'
import { useRoute } from 'vue-router'

const flatRouteGroupWithChildren = (routeGroup, groupStateMap, currentRoute) => {
  if ( routeGroup.children && routeGroup.children.length > 0) {
    groupStateMap[routeGroup.name] = currentRoute.matched.some((r) => r.name === routeGroup.name)
    routeGroup.children.forEach((g) => {
      flatRouteGroupWithChildren(g, groupStateMap, currentRoute)
    })
  }
}

export default function(routeGroups) {
  const currentRoute = useRoute()
  const stateMap = reactive({})
  routeGroups.forEach((g) => {
    flatRouteGroupWithChildren(g, stateMap, currentRoute)
  })
  
  const toggleOpenState = (name) => {
    if (Object.keys(stateMap).includes(name)) {
      stateMap[name] = !stateMap[name]
    }
  }

  return {
    stateMap: readonly(stateMap),
    toggleOpenState,
  }
}