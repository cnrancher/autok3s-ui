import { computed, readonly } from 'vue'
import { useRouter } from 'vue-router'

const buildGroup = (route, level = 0) => {
  const g = {
    name: route.name,
    title: route.meta.title,
    icon: route.meta.icon,
    level: level,
    children: null
  }
  const children = (route.children ?? [])
    .filter((item) => !item.hidden)
    .map((item) => buildGroup(item, level+1))
  g.children = children

  return g
}
export default function() {
  const router =  useRouter()
  const routes = router.options.routes.filter((r) => !r.hidden)
  const routeGroups = routes.map((route) => buildGroup(route))
  const currentGroup = computed(() => {
    const path = router.currentRoute.value.path
    const route = routes.find((r) => path.startsWith(r.path))
    return routeGroups.find((g) => g.name === route?.name)
  })
  return {
    routeGroups: readonly(routeGroups),
    currentGroup,
  }
}