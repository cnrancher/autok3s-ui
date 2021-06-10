<template>
  <div>
    <div class="cluster-table__header">
      <cluster-bulk-actions
        class="cluster-table__actions"
        :clusters="selectedClusters"
        @exec-command="handleCommand">
      </cluster-bulk-actions>
      <radio-group v-model="groupBy">
        <radio-button label="">
          <k-icon type="category" :color="groupBy === '' ? '#fff' : ''"></k-icon>
        </radio-button>
        <radio-button label="provider">
          <k-icon type="folder" :color="groupBy === 'provider' ? '#fff' : ''"></k-icon>
        </radio-button>
      </radio-group>
      <input type="search" placeholder="Filter" class="input-sm cluster-table__search k-input-search" v-model="searchQuery">
    </div>
    <k-table
      :data="clusters"
      :state="loadingStatus"
      :group-by="groupBy"
      @selection-change="handleSelectionChange"
      >
      <k-table-column type="selection"></k-table-column>
      <k-table-column sortable label="State" field="status">
        <template #default="{row, column}">
          <cluster-state-tag :status="row[column.field]"></cluster-state-tag>
        </template>
      </k-table-column>
      <k-table-column sortable label="Name" field="name">
        <template #default="{row, column}">
          <router-link :to="{name: 'ClusterExplorerCoreClustersDetail', params: { clusterId: row.id}}">{{row[column.field]}}</router-link>
        </template>
      </k-table-column>
      <k-table-column sortable label="Provider" field="provider"></k-table-column>
      <k-table-column sortable label="Region" field="region"></k-table-column>
      <k-table-column sortable label="Master" field="master"></k-table-column>
      <k-table-column sortable label="Worker" field="worker"></k-table-column>
      <k-table-column type="action" field="action" width="30">
        <template #default="{row}">
          <cluster-actions :cluster="row" @exec-command="handleCommand"></cluster-actions>
        </template>
      </k-table-column>
      <template #error>
        <div class="cluster-table__error">
          <div>Load clusters failed: {{error}}</div>
          <div>Please click <button class="btn btn-sm role-secondary" @click="reload">refresh</button> button to reload cluster data</div>
        </div>
        
      </template>
    </k-table>
    <k-modal v-model="confirmModalVisible">
      <template #title>Are you sure?</template>
      <template #default>
        <div class="cluster-table__command-confirm">
          <p>You are attemping to remove the {{commandParams.length === 1 ? 'Cluster' : 'Clusters'}}:</p>
          <p>
            <template v-for="(p, index) in commandParams" :key="p.id">
              <router-link :to="{name: 'ClusterExplorerCoreClustersDetail', params: { clusterId: p.id}}">{{p.name}}</router-link>
              {{index === commandParams.length - 1 ? '': ','}}
            </template>
          </p>
        </div>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="confirmModalVisible = false">Cancel</k-button>
        <k-button class="bg-error" @click="deleteClusters(commandParams)">Delete</k-button>
      </template>
    </k-modal>
    <k-modal v-model="joinNodeModalVisible" v-if="joinNodeModalVisible">
      <template #title>Join Node</template>
      <template #default>
        <div class="cluster-table__join-Node">
          <div>Desired Master Nodes: {{desiredNodes.master}}</div>
          <div>Desired Worker Nodes: {{desiredNodes.worker}}</div>
          <k-input
            label="Master"
            v-model="joinNodeForm.master"
            required />
          <k-input
            label="Worker"
            v-model="joinNodeForm.worker"
            required />
        </div>
        <div>
          <k-alert v-for="(e, index) in joinNodeErrors" :key="index" type="error" :title="e"></k-alert>
        </div>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="joinNodeModalVisible = false">Cancel</k-button>
        <k-button class="bg-primary" :loading="joinNodeLoading" @click="saveNodes(commandParams)">Save</k-button>
      </template>
    </k-modal>
    <cli-command v-if="clusterForm && cliModalVisible" v-model:visible="cliModalVisible" :cluster-form="clusterForm"></cli-command>
  </div>
</template>
<script>
import {defineComponent, watch} from 'vue'
import { useRouter } from 'vue-router'
import { remove, joinNode, fetchById } from '@/api/cluster.js'
import ClusterActions from './ClusterActions.vue'
import ClusterBulkActions from './ClusterBulkActions.vue'
import ClusterStateTag from './ClusterStateTag.vue'
import {RadioGroup, RadioButton} from '@/components/Radio'
import CliCommand from '@/views/components/CliCommand.vue'
import useDataSearch from '@/composables/useDataSearch.js'
import useCluster from '@/composables/useCluster.js'
import useProviders from '@/composables/useProviders.js'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import {stringify} from '@/utils/error.js'
import { removeCreatingCluster, saveCreatingCluster, overwriteSchemaDefaultValue } from '@/utils'

import { computed, inject, reactive, ref, toRef, watchEffect } from 'vue'
export default defineComponent({
  setup() {
    const router =  useRouter()
    const notificationStore = inject('notificationStore')
    const wmStore = inject('windowManagerStore')
    const clusterStore = inject('clusterStore')
    const clustersInStore = toRef(clusterStore.state, 'clusters')
    const {searchQuery, searchFields, dataMatchingSearchQuery: clusters} = useDataSearch(clustersInStore)
    searchFields.value=['status', 'name', 'region', 'master', 'worker']

    // generate cli command
    const cliModalVisible = ref(false)
    const clusterForm = ref(null)
    const {loading: providersLoading, providers, error: loadProviderError} = useProviders()

    const loadingStatus = computed(() => {
      if (clusterStore.state.loading || providersLoading.value) {
        return 'loading'
      }
      if (clusterStore.state.error) {
        return 'error'
      }
      if (searchQuery.value && clusters.value.length === 0) {
        return 'noResults'
      }
      if (clusters.value.length === 0) {
        return 'noData'
      }
      return 'loaded'
    })
    const selectedClusters = ref([])
    const handleSelectionChange = (rows) => {
      selectedClusters.value = rows
    }

    const error = computed(() => clusterStore.state.error)
    const groupBy = ref('provider')
    const toggleGroupBy = () => {
      if (groupBy.value) {
        groupBy.value = ''
        return
      }
      groupBy.value = 'provider'
    }
    
    
    const commandParams = ref([])

    // join node
    const clusterId = ref('')
    const {errors: joinNodeErrors, loading: joinNodeLoading, visible: joinNodeModalVisible, desiredNodes, form: joinNodeForm, save: saveNodes } = useJionNodeModal(clusterId)

    // delete cluster
    const confirmModalVisible = ref(false)
    const handleCommand = ({command, data}) => {
      const [cluster] = data
      switch (command) {
        case 'delete':
          commandParams.value = data
          confirmModalVisible.value=true
          break;
        case 'viewLog':
          removeCreatingCluster(cluster.id)
          wmStore.action.addTab({
            id: `log_${cluster.id}`,
            component: 'ClusterLogs',
            label: `log: ${cluster.name}`,
            icon: 'log',
            attrs: {
              cluster: cluster.id,
            }
          })
          break;
        case 'joinNode':
          clusterId.value = cluster.id
          joinNodeModalVisible.value = true
          break;
        case 'clone':
        case 'edit':
          router.push({name: 'ClusterExplorerCoreClustersCreate', query: {clusterId: cluster.id}})
          break;
        case 'saveAsTemplate':
          router.push({name: 'ClusterExplorerSettingsTemplatesCreate', query: {clusterId: cluster.id}})
          break;
        case 'generateCliCommand':
          if (loadProviderError.value) {
            notificationStore.action.notify({
              type: 'error',
              title: 'Load Provider Failed',
              content: stringify(loadProviderError.value)
            })
            return
          }
          fetchById(cluster.id).then((cluster) => {
            const provider = providers.value.find((p) => p.id === cluster.provider)
            const defaultVal = {
              config: Object.keys(cluster)
                .filter((k) => k != 'options')
                .reduce((t, k) => {
                  t[k] = cluster[k]
                  return t
                }, {}),
              options: cluster.options,
            }

            const schema = overwriteSchemaDefaultValue(provider, defaultVal)
            const { form }= useFormFromSchema(schema)
            clusterForm.value = form
            cliModalVisible.value = true
          }).catch((err) => {
            if (err) {
              notificationStore.action.notify({
                type: 'error',
                title: 'Load Cluster Failed',
                content: stringify(err)
              })
            }
          })
      }
    }
    const deleteClusters = async (clusters) => {
      confirmModalVisible.value=false
      const results = await Promise.allSettled(clusters.map((c) => remove(c.id)))
      const errors = results
        .filter((p) => p.status === 'rejected')
        .map((p) => p.reason)
      errors.forEach((e) => {
         notificationStore.action.notify({
          type: 'error',
          title: 'Delete Cluster Failed',
          content: stringify(e)
        })
      })
    }
    watchEffect(() => {
      if(confirmModalVisible.value === false) {
        commandParams.value=[]
      }
    })
    const reload = () => {
      clusterStore.action.syncClusters()
    }

    return {
      clusters,
      loadingStatus,
      handleSelectionChange,
      searchQuery,
      selectedClusters,
      toggleGroupBy,
      groupBy,
      error,
      reload,
      handleCommand,
      commandParams,
      confirmModalVisible,
      deleteClusters,
      joinNodeModalVisible,
      joinNodeErrors,
      saveNodes,
      desiredNodes,
      joinNodeLoading,
      joinNodeForm,
      cliModalVisible,
      clusterForm,
    }
  },
  components: {
    ClusterActions,
    ClusterBulkActions,
    ClusterStateTag,
    CliCommand,
    RadioGroup,
    RadioButton,
  }
})

function useJionNodeModal(clusterId) {
  const notificationStore = inject('notificationStore')
  const {cluster, error: loadError, loading} = useCluster(clusterId)
  const formErrors = ref([])
  const visible = ref(false)
  const form = reactive({
    worker: '0',
    master: '0',
  })
  const desiredNodes = computed(() => {
    if (!cluster.value) {
      return {
          master: '0',
          worker: '0',
        }
    }
    return {
        master: `${parseInt(cluster.value.master, 10) + (parseInt(form.master, 10) || 0)}`,
        worker: `${parseInt(cluster.value.worker, 10) + (parseInt(form.worker, 10) || 0)}`,
      }
  })
  const errors = computed(() => {
    if (loadError.value) {
      return [loadError.value, ...formErrors.value]
    }
    return formErrors.value
  })
  watchEffect(() => {
    if (!visible.value) {
      cluster.value = null
      clusterId.value = null
      form.worker = '0'
      form.master = '0'
      return
    }
  })

  const validate = () => {
      const numReg = /^[0-9]+$/
      const errors = []
      if (!numReg.test(form.worker)) {
        errors.push('"Worker" must a number');
      }
      if (!numReg.test(form.master)) {
        errors.push('"Master" must be a number');
      }
      if (errors.length > 0) {
        formErrors.value = errors
        return false
      }
      if (parseInt(form.worker, 10) <= 0 && parseInt(form.master, 10) <= 0) {
        errors.push('One of "Master" and "Worker" must be greater than 0');
      }
      formErrors.value = errors
      return errors.length === 0
    }
  const save = async () => {
    if (!validate()) {
      return
    }
    try {
      const data = Object.assign({}, cluster.value, form)
      await joinNode(data)
      saveCreatingCluster(cluster.value.id)
    } catch (err) {
      notificationStore.action.notify({
          type: 'error',
          title: 'Join Nodes Failed',
          content: stringify(err),
        })
    }
    visible.value = false
  }

  return {
    loading,
    errors,
    visible,
    desiredNodes,
    form,
    save,
  }
}
</script>
<style>
.cluster-table__header {
  display: grid;
  grid-template-areas: "actions btn search";
  grid-template-columns: 1fr auto minmax(min-content, 200px);
  padding: 0 0 20px;
  column-gap: 10px;
}
.cluster-table__actions {
  grid-area: actions;
}
.cluster-table__search {
  grid-area: search;
}
.cluster-table__error {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}
.cluster-table__command-confirm {
  color: var(--input-label);
}
.cluster-table__join-Node {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 10px;
}
</style>