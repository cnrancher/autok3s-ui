<template>
  <div>
    <div class="cluster-table__header">
      <cluster-bulk-actions :clusters="selectedClusters" @exec-command="handleCommand"></cluster-bulk-actions>
      <radio-group v-model="groupBy">
        <radio-button label="">
          <k-icon type="category" :color="groupBy === '' ? '#fff' : ''"></k-icon>
        </radio-button>
        <radio-button label="provider">
          <k-icon type="folder" :color="groupBy === 'provider' ? '#fff' : ''"></k-icon>
        </radio-button>
      </radio-group>
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Filter"
        class="border rounded px-12px hover:bg-gray-100 focus-visible:outline-none"
      />
    </div>
    <KGroupedTable :data="groupData" :group-by="groupBy" @selection-change="handleSelectionChange">
      <k-table-column type="selection"></k-table-column>
      <k-table-column sortable label="State" field="status">
        <template #default="{ row, column }">
          <cluster-state-tag :status="row[column.field]"></cluster-state-tag>
        </template>
      </k-table-column>
      <k-table-column sortable label="Name" field="name">
        <template #default="{ row, column }">
          <router-link
            class="text-$link"
            :to="{ name: 'ClusterExplorerCoreClustersDetail', params: { clusterId: row.id } }"
          >
            {{ row[column.field] }}
          </router-link>
        </template>
      </k-table-column>
      <k-table-column sortable label="Provider" field="provider">
        <template #default="{ row }">
          <Tooltip append-to-body>
            <img class="w-32px h-21px object-contain" :src="providerIconMap.get(row.provider)" />
            <template #popover>Provider: {{ row.provider }}</template>
          </Tooltip>
        </template>
      </k-table-column>
      <k-table-column sortable label="Region" field="region"></k-table-column>
      <k-table-column sortable label="Master" field="master"></k-table-column>
      <k-table-column sortable label="Worker" field="worker"></k-table-column>
      <k-table-column sortable label="HA Mode" field="is-ha-mode">
        <template #default="{ row }">
          <span v-if="row['is-ha-mode']">True</span>
          <span v-else-if="row['is-ha-mode'] === false">False</span>
          <span v-else>-</span>
        </template>
      </k-table-column>
      <k-table-column sortable label="Datastore Type" field="datastore-type">
        <template #default="{ row }">
          {{ row['datastore-type'] ?? '-' }}
        </template>
      </k-table-column>
      <k-table-column type="action" field="action" width="60">
        <template #default="{ row }">
          <div class="flex items-center justify-between">
            <explorer-link :cluster-id="row.id"></explorer-link>
            &nbsp;
            <cluster-actions :cluster="row" @exec-command="handleCommand"></cluster-actions>
          </div>
        </template>
      </k-table-column>
      <template #error="error">
        <div class="mb-2">
          <div class="cluster-table__group">
            <span class="cluster-table__group-by">provider:</span>
            <span>{{ error.group }}</span>
          </div>
          <div class="bg-white p-2">
            Cluster data load failed:
            <span class="text-error">{{ error.error }}</span>
          </div>
          <div class="bg-white p-2">
            Please click on the
            <button class="text-$link" :disabled="error.state === 'loading'" @click="reload(error.group)">
              refresh
            </button>
            link to reload the cluster data
          </div>
        </div>
      </template>
      <template #group="{ group }">
        <Tooltip append-to-body>
          <img class="w-32px h-21px object-contain" :src="providerIconMap.get(group)" />
          <template #popover>Provider: {{ group }}</template>
        </Tooltip>
      </template>
    </KGroupedTable>
    <k-modal v-model="confirmModalVisible">
      <template #title>Are you sure?</template>
      <template #default>
        <div>
          <p>You are attemping to remove the {{ commandParams.length === 1 ? 'Cluster' : 'Clusters' }}:</p>
          <p class="text-light-blue-500">
            <template v-for="(p, index) in commandParams" :key="p.id">
              <router-link :to="{ name: 'ClusterExplorerCoreClustersDetail', params: { clusterId: p.id } }">
                {{ p.name }}
              </router-link>
              {{ index === commandParams.length - 1 ? '' : ',' }}
            </template>
          </p>
        </div>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="confirmModalVisible = false">Cancel</k-button>
        <k-button class="role-danger" @click="deleteClusters(commandParams)">Delete</k-button>
      </template>
    </k-modal>
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router'
import { remove, fetchById, disableExplorer, enableExplorer } from '@/api/cluster.js'
import ClusterActions from './ClusterActions.vue'
import ClusterBulkActions from './ClusterBulkActions.vue'
import ClusterStateTag from './ClusterStateTag.vue'
import ExplorerLink from './ExplorerLink.vue'
import JoinNodeModal from './JoinNodeModal.vue'
import ViewKubeconfigModal from './ViewKubeconfigModal.vue'
import UpgradeModal from './UpgradeModal.vue'
import { RadioGroup, RadioButton } from '@/components/Radio'
import CliCommand from '@/views/components/CliCommand.vue'
import useDataSearch from '@/composables/useDataSearch.js'
import useProviders from '@/composables/useProviders.js'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import { stringify } from '@/utils/error.js'
import { overwriteSchemaDefaultValue } from '@/utils'
import useProviderClusterStores from '@/store/useProviderClusterStores.js'
import { computed, ref, watchEffect } from 'vue'
import { GroupedTable as KGroupedTable } from '@/components/Table'
import useNotificationStore from '@/store/useNotificationStore.js'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'
import useModal from '@/composables/useModal.js'
import { useProviderIcon } from '@/views/composables/useProviderIcon.js'
import Tooltip from '@/components/Tooltip'

const providerIconMap = useProviderIcon()
const router = useRouter()
const providerClusterStores = useProviderClusterStores()
const { loading: providersLoading, providers, error: loadProviderError } = useProviders()
const errorGroups = computed(() => {
  return (
    Object.entries(providerClusterStores)
      // eslint-disable-next-line no-unused-vars
      .filter(([_, v]) => !v.loading && v.error)
      .map(([k, v]) => ({
        group: k,
        state: 'error',
        error: v.error
      }))
  )
})

const loadedGroups = computed(() => {
  return (
    Object.entries(providerClusterStores)
      // eslint-disable-next-line no-unused-vars
      .filter(([_, v]) => !v.loading && !v.error)
      .map(([k, v]) => ({
        group: k,
        state: 'loaded',
        children: v.data
      }))
  )
})
const loadedData = computed(() => {
  return loadedGroups.value.reduce((t, c) => {
    t.push(...c.children)

    return t
  }, [])
})

const isAllLoading = computed(() => {
  return providersLoading.value || Object.values(providerClusterStores).every((item) => item.loading === true)
})

const isNoData = computed(() => {
  return errorGroups.value.length === 0 && loadedData.value.length === 0
})

const { searchQuery, searchFields, dataMatchingSearchQuery: clusters } = useDataSearch(loadedData)
searchFields.value = ['status', 'name', 'region', 'master', 'worker']
const groupStatus = computed(() => {
  const errorStatus = errorGroups.value.reduce((t, c) => {
    t[c.group] = {
      state: 'error',
      error: c.error
    }

    return t
  }, {})
  const loadingStatus = {
    loading: {
      state: 'loading'
    }
  }
  if (clusters.value.length === 0) {
    if (loadedData.value.length === 0) {
      return {
        noData: {
          state: 'noData'
        },
        ...loadingStatus,
        ...errorStatus
      }
    }

    if (searchQuery.value) {
      return {
        noResults: {
          state: 'noResults'
        },
        ...loadingStatus,
        ...errorStatus
      }
    }
  }

  return {
    ...loadedGroups.value.reduce((t, c) => {
      t[c.group] = {
        state: 'loaded'
      }
      return t
    }, {}),
    ...loadingStatus,
    ...errorStatus
  }
})

const groupData = computed(() => {
  if (isAllLoading.value) {
    return [
      {
        group: 'loading',
        state: 'loading'
      }
    ]
  }
  if (isNoData.value) {
    return [
      {
        group: 'noData',
        state: 'noData'
      }
    ]
  }
  const statusMap = groupStatus.value
  const groups = clusters.value.reduce((t, c) => {
    const g = t[c.provider] ?? { group: c.provider, ...statusMap[c.provider], children: [] }
    g.children.push(c)
    t[c.provider] = g

    return t
  }, [])
  return [...Object.values(groups), ...errorGroups.value]
})

const notificationStore = useNotificationStore()
const wmStore = useWindownManagerStore()

const selectedClusters = ref([])
const handleSelectionChange = (rows) => {
  selectedClusters.value = rows
}

const groupBy = ref('provider')

const commandParams = ref([])

// delete cluster
const confirmModalVisible = ref(false)
// join node
const { show: showJoinNode } = useModal(JoinNodeModal)
// generate cli command
const { show: showCliCommand } = useModal(CliCommand)
// show kubeconfig
const { show: showKubeconfig } = useModal(ViewKubeconfigModal)
// upgrade cluster
const { show: showUpgrade } = useModal(UpgradeModal)

const handleCommand = ({ command, data }) => {
  const [cluster] = data
  switch (command) {
    case 'delete':
      commandParams.value = data
      confirmModalVisible.value = true
      break
    case 'viewLog':
      wmStore.addTab({
        id: `log_${cluster.id}`,
        component: 'ClusterLogs',
        label: `log: ${cluster.name}`,
        icon: 'log',
        attrs: {
          cluster: cluster.id
        }
      })
      break
    case 'joinNode':
      showJoinNode({ clusterId: cluster.id })

      break
    case 'clone':
    case 'edit':
      router.push({ name: 'ClusterExplorerCoreClustersCreate', query: { clusterId: cluster.id } })
      break
    case 'saveAsTemplate':
      router.push({ name: 'ClusterExplorerSettingsTemplatesCreate', query: { clusterId: cluster.id } })
      break
    case 'generateCliCommand':
      if (loadProviderError.value) {
        notificationStore.notify({
          type: 'error',
          title: 'Load Provider Failed',
          content: stringify(loadProviderError.value)
        })
        return
      }
      fetchById(cluster.id)
        .then((cluster) => {
          const provider = providers.value.find((p) => p.id === cluster.provider)
          const defaultVal = {
            config: Object.keys(cluster)
              .filter((k) => k != 'options')
              .reduce((t, k) => {
                t[k] = cluster[k]
                return t
              }, {}),
            options: cluster.options
          }

          const schema = overwriteSchemaDefaultValue(provider, defaultVal)
          const { form } = useFormFromSchema(schema)
          showCliCommand({ clusterForm: form })
        })
        .catch((err) => {
          if (err) {
            notificationStore.notify({
              type: 'error',
              title: 'Load Cluster Failed',
              content: stringify(err)
            })
          }
        })
      break
    case 'disableExplorer':
      disableExplorer(cluster).catch((err) => {
        if (err) {
          notificationStore.notify({
            type: 'error',
            title: 'Disable explorer Error',
            content: stringify(err)
          })
        }
      })
      break
    case 'enableExplorer':
      enableExplorer(cluster)
        .then(({ data }) => {
          notificationStore.notify({
            type: 'success',
            title: 'Enable kube-explorer success',
            content: stringify(data)
          })
        })
        .catch((err) => {
          if (err) {
            notificationStore.notify({
              type: 'error',
              title: 'Enable explorer Error',
              content: stringify(err)
            })
          }
        })
      break
    case 'downloadKubeConfig':
      showKubeconfig({ clusterId: cluster.id })
      break
    case 'upgrade':
      showUpgrade({ clusterId: cluster.id, clusterName: cluster.name, providerId: cluster.provider })
      break
  }
}
const deleteClusters = async (clusters) => {
  confirmModalVisible.value = false
  const results = await Promise.allSettled(clusters.map((c) => remove(c.id)))
  const errors = results.filter((p) => p.status === 'rejected').map((p) => p.reason)
  errors.forEach((e) => {
    notificationStore.notify({
      type: 'error',
      title: 'Delete Cluster Failed',
      content: stringify(e)
    })
  })
}
watchEffect(() => {
  if (confirmModalVisible.value === false) {
    commandParams.value = []
  }
})
const reload = (provider) => {
  providerClusterStores[provider]?.loadData()
}
</script>
<style>
.cluster-table__header {
  display: grid;
  grid-template-columns: 1fr auto minmax(min-content, 200px);
  padding: 0 0 20px;
  column-gap: 10px;
}
.cluster-table__group {
  @apply h-40px leading-40px py-0 px-10px rounded-t bg-white relative inline-block min-w-72px z-0;
  &::after {
    @apply h-40px w-70px rounded-t-5px bg-white absolute;
    content: '';
    right: -15px;
    top: 0;
    transform: skewX(40deg);
    z-index: -1;
  }
}
.cluster-table__group-by {
  @apply capitalize text-gray-400;
}
</style>
