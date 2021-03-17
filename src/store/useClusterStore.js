import { reactive, readonly } from 'vue'
import { fetchList } from '@/api/cluster.js'
import {stringify} from '@/utils/error.js'
import { removeCreatingCluster } from '@/utils'

// state
export function createStore() {
  const state = {
    clusters: [],
    loading: false,
    quickStartFormHistory: {},
    formHistory: {},
    historySize: 1,
    socketState: null,
    error: null,
  }
  return reactive(state)
}

// actions
function initClusters(state) {
  return (clusters, err) => {
    state.clusters = clusters
    state.error = err
  }
}
function addCluster(state, wmStore) {
  return (...clusters) => {
    state.clusters.push(...clusters.map((c) => ({
      ...c,
      status: c.status?.status,
      region: c.options?.region,
    })))
    // view create logs
    clusters.forEach((c) => {
      const result = removeCreatingCluster(c.id)
      if (!result) {
        return
      }
      wmStore.action.addTab({
        id: `log_${c.id}`,
        component: 'ClusterLogs',
        label: `log: ${c.name}`,
        icon: 'log',
        attrs: {
          cluster: c.id,
        }
      })
    })
  }
}
function removeCluster(state) {
  return (cluster) => {
    const index = state.clusters.findIndex((c) => c.id === cluster.id)
    if (index > -1) {
      return state.clusters.splice(index, 1)
    }
  }
}
function updateCluster(state, wmStore) {
  return (cluster) => {
    const index = state.clusters.findIndex((c) => c.id === cluster.id)
    if (index > -1) {
      const props = {
        region: cluster.options?.region,
        status: cluster.status?.status,
        worker: cluster.worker,
        master: cluster.master,
        zone: cluster.options?.zone,
      }
      const c = { ...state.clusters[index], ...props}
      const pre = state.clusters.splice(index, 1, c)
      // view create logs
      if (['upgrading', 'creating'].includes((cluster.status?.status ?? '').toLowerCase())) {
        const result = removeCreatingCluster(cluster.id)
        if (!result) {
          return pre
        }
        wmStore.action.addTab({
          id: `log_${cluster.id}`,
          component: 'ClusterLogs',
          label: `log: ${cluster.name}`,
          icon: 'log',
          attrs: {
            cluster: cluster.id,
          }
        })
      }
      return pre
    }
  }
}
function changeLoading(state) {
  return (loading) => {
    state.loading = loading
  }
}

function syncClusters(state) {
  return () => {
    state.loading = true
    return fetchList().then(({data}) => {
      state.clusters = data
      state.error = null
    }).catch((err) => {
      state.clusters = []
      state.error = stringify(err)
    }).finally(() => {
      state.loading = false
    })
  }
}

function clearClusters(state) {
  return () => {
    state.clusters = []
  }
}

function saveFormHistory(state) {
  return (form) => {
    const h = state.formHistory[form.provider]
    if (h) {
      if (h.length >= state.historySize) {
        h.shift()
      }
      h.push(form)
      return
    }
    state.formHistory[form.provider] = [form]
    return
  }
}

function saveQuickStartFormHistory(state) {
  return (form) => {
    const h = state.quickStartFormHistory[form.provider]
    if (h) {
      if (h.length >= state.historySize) {
        h.shift()
      }
      h.push(form)
      return
    }
    state.quickStartFormHistory[form.provider] = [form]
    return
  }
}

function createAction(state, wmStore) {
  return {
    syncClusters: syncClusters(state),
    initClusters: initClusters(state),
    addCluster: addCluster(state, wmStore),
    removeCluster: removeCluster(state),
    updateCluster: updateCluster(state, wmStore),
    saveFormHistory: saveFormHistory(state),
    saveQuickStartFormHistory: saveQuickStartFormHistory(state),
    clearClusters: clearClusters(state),
    changeLoading: changeLoading(state),
  }
}

export default function useStore(wmStore) {
  const state = createStore()
  const action = createAction(state, wmStore)
  return {
    state: readonly(state),
    action: readonly(action)
  }
}
