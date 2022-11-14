<template>
  <div v-if="routeGroup.children && routeGroup.children.length > 0" :key="routeGroup.name">
    <div
      class="grid grid-cols-[1fr,22px] items-center py-5px cursor-pointer hover:bg-gray-200"
      @click="toggleOpen(routeGroup.name)"
    >
      <h6 class="pl-10px font-400">{{ routeGroup.title }}</h6>
      <k-icon
        type="arrow-right"
        :direction="expandedStateMap[routeGroup.name] ? 'up' : ''"
        class="justify-self-center"
      ></k-icon>
    </div>
    <ul :class="[expandedStateMap[routeGroup.name] ? 'block' : 'hidden']">
      <li v-for="child in routeGroup.children" :key="child.name">
        <nav-group :route-group="child" :expanded-state-map="expandedStateMap"></nav-group>
      </li>
    </ul>
  </div>
  <!-- <router-link v-else
    class="k-nav-group-link"
    :class="{'grid-cols-[20px,1fr]': routeGroup.level > 1}"
    :to="{name: routeGroup.name}">
    <k-icon v-if="routeGroup.level > 1" :type="routeGroup.icon || 'folder'" class="k-nav-group-link__icon"></k-icon>
    <span>{{routeGroup.title}}</span>
  </router-link> -->
  <router-link
    v-else
    v-slot="{ navigate, href, route, isActive, isExactActive }"
    :to="{ name: routeGroup.name }"
    custom
  >
    <a
      :href="href"
      class="k-nav-group__link grid grid-cols-[auto,1fr] gap-2px items-center py-3px"
      :class="[
        isActive || $route.path.startsWith(route.path) ? 'router-link-active bg-[#eeeff4]' : 'hover:bg-[#dcdee7]',
        isExactActive ? 'router-link-exact-active' : '',
        routeGroup.level > 1 ? 'grid-cols-[20px,1fr] pl-12px' : 'pl-10px'
      ]"
      @click="navigate"
    >
      <k-icon
        v-if="routeGroup.level > 1"
        class="k-nav-group__icon"
        :type="routeGroup.icon || 'folder'"
        :class="[isActive || $route.path.startsWith(route.path) ? 'k-nav-group__icon--active' : '']"
      ></k-icon>
      <span class="overflow-hidden overflow-ellipsis whitespace-nowrap">{{ routeGroup.title }}</span>
    </a>
  </router-link>
</template>
<script>
import KIcon from '@/components/Icon'
export default {
  name: 'NavGroup',
  components: {
    KIcon
  },
  props: {
    routeGroup: {
      type: Object,
      required: true
    },
    expandedStateMap: {
      type: Object,
      required: true
    }
  },
  emits: ['toggle-open'],
  setup(props, context) {
    const { emit } = context
    const toggleOpen = (name) => {
      emit('toggle-open', name)
    }
    return {
      toggleOpen
    }
  }
}
</script>
<style>
.k-nav-group__link {
  font-size: 13px;
  height: 31px;
}
.k-nav-group__link:hover .k-nav-group__icon {
  @apply text-gray-800;
}
.k-nav-group__icon {
  @apply text-gray-400;
}
.k-nav-group__icon--active {
  @apply text-gray-800;
}
</style>
