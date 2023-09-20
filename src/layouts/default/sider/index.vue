<template>
  <nav
    class="k-app-nav border-r h-full flex flex-col transform lg:transform-none -translate-x-full"
    :class="{ '-translate-x-0': openSideBar }"
  >
    <div class="lg:hidden h-$header-height grid grid-cols-[auto_auto_1fr] items-center gap-x-10px py-0 px-5px">
      <k-icon type="arrow-right" direction="left" class="cursor-pointer" :size="24" @click="toggleSideBar"></k-icon>
      <img class="h-32px object-contain" :src="k3sLogo" />
      <div class="overflow-ellipsis">{{ currentGroup.title }}</div>
    </div>
    <div class="overflow-y-auto flex-grow">
      <nav-group
        v-for="g in routeGroups"
        :key="g.name"
        :route-group="g"
        :expanded-state-map="stateMap"
        @toggle-open="toggleOpenState($event)"
      ></nav-group>
    </div>
  </nav>
</template>
<script setup>
import NavGroup from './NavGroup.vue'
import useRouteGroups from '../composables/useRouteGroups.js'
import useRouteGroupState from '../composables/useRouteGroupState.js'
import KIcon from '@/components/Icon'
import { computed, inject } from 'vue'
import k3sLogo from '@/assets/k3s.svg'

const { routeGroups: rootRouteGroups, currentGroup } = useRouteGroups()
const { stateMap, toggleOpenState } = useRouteGroupState(rootRouteGroups)
const routeGroups = computed(() => {
  return currentGroup.value.children
})
const openSideBar = inject('openSideBar')
const toggleSideBar = () => {
  openSideBar.value = !openSideBar.value
}
</script>
