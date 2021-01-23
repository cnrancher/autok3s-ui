<template>
  <div v-if="routeGroup.children && routeGroup.children.length > 0" :key="routeGroup.name">
    <div class="k-nav-group__header" @click="toggleOpen(routeGroup.name)">
      <h6>{{routeGroup.title}}</h6>
      <k-icon type="arrow-right" :direction="expandedStateMap[routeGroup.name] ? 'up':''"></k-icon>
    </div>
    <ul class="k-nav-group__children"
      :class="{'k-nav-group--expanded': expandedStateMap[routeGroup.name]}">
      <li v-for="child in routeGroup.children" :key="child.name">
        <nav-group :route-group="child" :expanded-state-map="expandedStateMap"></nav-group>
      </li>
    </ul>
  </div>
  <!-- <router-link v-else
    class="k-nav-group-link"
    :class="{'k-nav-group-link--has-icon': routeGroup.level > 1}"
    :to="{name: routeGroup.name}">
    <k-icon v-if="routeGroup.level > 1" :type="routeGroup.icon || 'folder'" class="k-nav-group-link__icon"></k-icon>
    <span>{{routeGroup.title}}</span>
  </router-link> -->
  <router-link v-else
    :to="{name: routeGroup.name}"
    custom
    v-slot="{ navigate, href, route, isActive, isExactActive}">
    <a
      :href="href"
      @click="navigate"
      class="k-nav-group-link"
      :class="{'router-link-active': isActive || $route.path.startsWith(route.path), 'router-link-exact-active': isExactActive, 'k-nav-group-link--has-icon': routeGroup.level > 1}">
      <k-icon v-if="routeGroup.level > 1" :type="routeGroup.icon || 'folder'" class="k-nav-group-link__icon"></k-icon>
      <span>{{routeGroup.title}}</span>
    </a>
  </router-link>
</template>
<script>
import KIcon from '@/components/Icon'
export default {
  props: {
    routeGroup: {
      type: Object,
      required: true,
    },
    expandedStateMap: {
      type: Object,
      required: true
    },
  },
  emits: ['toggle-open'],
  name: 'NavGroup',
  setup(props, context) {
    const {emit} = context
    const toggleOpen = (name) => {
      emit('toggle-open', name)
    }
    return {
      toggleOpen
    }
  },
  components: {
    KIcon
  }
}
</script>
<style>
.k-nav-group__header {
  display: grid;
  grid-template-columns: 1fr 22px;
  align-items: center;
  padding: 5px 0;
  background: transparent;
  cursor: pointer;
  color: var(--input-label);
  & > h6 {
    font-size: 14px;
    text-transform: none;
    padding-left: 10px;
    color: var(--body-text);
    margin: 0;
    letter-spacing: .1em;
    line-height: normal;
  }
}
.k-nav-group-link {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  border-left: 5px solid transparent;
  height: 40px;
  padding: 7.5px 7px 7.5px 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--link-text);
  text-decoration: none;
  &:hover {
    background: var(--dropdown-hover-bg);
    text-decoration: none;
    color: var(--body-text);
    & > .k-nav-group-link__icon {
      background-color: var(--body-text) !important;
    }
  }
  &.router-link-active {
    background-color: var(--nav-active);
    border-left-color: var(--primary);
    color: var(--body-text);
    & > .k-nav-group-link__icon {
      background-color: var(--body-text) !important;
    }
  }
  & > .k-nav-group-link__icon {
    background-color: var(--muted) !important;
  }
  &:focus {
    outline: none;
  }
}
.k-nav-group-link--has-icon {
  grid-template-columns: 20px 1fr;
}
.k-nav-group__children {
  margin: 0 0 5px 0;
  padding: 0;
  list-style-type: none;
  display: none;
}
.k-nav-group--expanded {
  display: block;
}

</style>