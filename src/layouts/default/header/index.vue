<template>
  <header class="k-app-header">
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
<style>
.k-app-header {
  background-color: var(--header-bg);
  display: grid;
  grid-template-columns: var(--nav-width) max-content;
  align-items: center;
  justify-content: space-between;
  padding-right: 20px;
  border-bottom: var(--header-border-size) solid var(--header-border);
}
</style>
