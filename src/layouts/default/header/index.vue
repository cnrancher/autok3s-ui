<template>
  <header class="grid grid-cols-[var(--nav-width),max-content] items-center justify-between pr-20px border-b bg-white">
    <k-dropdown-nav :route-groups="routeGroups" :current-group="currentGroup"></k-dropdown-nav>
    <kube-ctl-button></kube-ctl-button>
  </header>
</template>
<script>
import KDropdownNav from './DropdownNav.vue'
import KubeCtlButton from './KubeCtlButton.vue'
import useRouteGroups from '../composables/useRouteGroups.js'
export default {
  setup() {
    const { routeGroups, currentGroup } = useRouteGroups()
    return {
      routeGroups,
      currentGroup
    }
  },
  components: {
    KDropdownNav,
    KubeCtlButton,
  }
}
</script>

