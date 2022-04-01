<template>
  <div>
    <div class="template-table__header">
      <template-bulk-actions
        class="template-table__actions"
        :templates="selectedTemplates"
        @exec-command="handleCommand">
      </template-bulk-actions>
      <k-radio-group v-model="groupBy">
        <k-radio-button label="">
          <k-icon type="category" :color="groupBy === '' ? '#fff' : ''"></k-icon>
        </k-radio-button>
        <k-radio-button label="provider">
          <k-icon type="folder" :color="groupBy === 'provider' ? '#fff' : ''"></k-icon>
        </k-radio-button>
      </k-radio-group>
      <input type="search" placeholder="Filter" class="template-table__search focus-visible:outline-none px-12px rounded border hover:bg-gray-100" v-model="searchQuery">
    </div>
    <k-table
      :data="data"
      :state="state"
      :group-by="groupBy"
      @selection-change="handleSelectionChange"
      >
      <k-table-column type="selection"></k-table-column>
      <k-table-column sortable label="ID" field="id">
        <template #default="{row, column}">
          <div class="flex items-center" v-if="row.status">
            {{row[column.field]}}
            <k-tooltip >
              <k-icon type="warning" color="var(--error)"></k-icon>
              <template #popover>{{row.status}}</template>
            </k-tooltip>
          </div>
          <template v-else>
            {{row[column.field]}}
          </template>
        </template>
      </k-table-column>
      <k-table-column sortable label="Provider" field="provider"></k-table-column>
      <k-table-column sortable label="Default" field="is-default">
        <template #default="{row}">
          <!-- <k-icon :type="row['is-default'] ? 'favorites-fill': 'favorites'"></k-icon> -->
          {{row['is-default'] ? 'True':'False'}}
        </template>
      </k-table-column>
      <k-table-column sortable label="Name" field="name">
        <template #default="{row, column}">
          <router-link class="text-$link" :to="{name: 'ClusterExplorerSettingsTemplatesDetail', params: { templateId: row.id}}">{{row[column.field]}}</router-link>
        </template>
      </k-table-column>
      <k-table-column sortable label="Region" field="options.region"></k-table-column>
      <k-table-column sortable label="Zone" field="options.zone"></k-table-column>
      <k-table-column type="action" field="action" width="30">
        <template #default="{row}">
          <template-actions :template="row" @exec-command="handleCommand"></template-actions>
        </template>
      </k-table-column>
      <template #error>
        <div class="flex justify-center flex-col items-center">
          <div>Load templates failed: {{error}}</div>
          <div>Please click <button class="btn btn-sm role-secondary" @click="reload">refresh</button> button to reload template data</div>
        </div>
        
      </template>
    </k-table>
    <k-modal v-model="confirmModalVisible">
      <template #title>Are you sure?</template>
      <template #default>
        <div>
          <p>You are attemping to remove the {{commandParams.length === 1 ? 'Template' : 'Templates'}}:</p>
          <p class="text-light-blue-500">
            <template v-for="(p, index) in commandParams" :key="p.id">
              <router-link :to="{name: 'ClusterExplorerSettingsTemplatesDetail', params: { templateId: p.id}}">{{p.name}}</router-link>
              {{index === commandParams.length - 1 ? '': ','}}
            </template>
          </p>
        </div>
      </template>
      <template #footer>
        <k-button class="role-secondary" @click="confirmModalVisible = false">Cancel</k-button>
        <k-button class="role-danger" @click="deleteTemplates(commandParams)">Delete</k-button>
      </template>
    </k-modal>
  </div>
</template>
<script>
import {defineComponent, toRefs} from 'vue'
import { useRouter } from 'vue-router'
import { remove, update } from '@/api/template.js';
import TemplateActions from './TemplateActions.vue'
import TemplateBulkActions from './TemplateBulkActions.vue'
import useDataSearch from '@/composables/useDataSearch.js'
import useTableState from '@/composables/useTableState.js'
import {stringify} from '@/utils/error.js'
import { cloneDeep } from '@/utils'
import useTemplateStore from '@/store/useTemplateStore.js'
import { storeToRefs } from 'pinia'
import useNotificationStore from '@/store/useNotificationStore.js'

import { inject,  ref, watchEffect } from 'vue'
export default defineComponent({
  setup() {
    const router =  useRouter()
    const notificationStore = useNotificationStore()
    const templateStore = useTemplateStore()
    const {loading, error, data: templates,} = storeToRefs(templateStore)
    const {searchQuery, searchFields, dataMatchingSearchQuery: data} = useDataSearch(templates)
    searchFields.value = ['id', 'provider', 'name', 'options.region', 'options.zone']
    const { state }= useTableState(loading, error, templates, data)
    const selectedTemplates = ref([])
    const handleSelectionChange = (rows) => {
      selectedTemplates.value = rows
    }
    const groupBy = ref('provider')
    const toggleGroupBy = () => {
      if (groupBy.value) {
        groupBy.value = ''
        return
      }
      groupBy.value = 'provider'
    }
    const commandParams = ref([])
    // delete template
    const confirmModalVisible = ref(false)
    const reload = () => {
      templateStore.loadData()
    }
    const setDefault = async (template) => {
      const results = await Promise.allSettled([
        ...templates.value.filter((t) => t.provider === template.provider && t['is-default'] && t.id !== template.id)
          .map((t) => {
            return update(t.id, {
              ...cloneDeep(t),
              'is-default': false,
            })
          }),
          update(template.id, {
            ...template,
            'is-default': true,
          })
        ])
        const errors = results
          .filter((p) => p.status === 'rejected')
          .map((p) => p.reason)

        errors.forEach((e) => {
          notificationStore.notify({
            type: 'error',
            title: 'Update Template Failed',
            content: stringify(e)
          })
        })
    }
    const unsetDefault = async (template) => {
      try {
        await update(template.id, {
          ...template,
          'is-default': false,
        })
      } catch (err) {
        notificationStore.notify({
          type: 'error',
          title: 'Update Template Failed',
          content: stringify(e)
        })
      }
    }
    const handleCommand = ({command, data}) => {
      switch (command) {
        case 'delete':
          commandParams.value = data
          confirmModalVisible.value=true
          break;
        case 'createCluster':
          router.push({name: 'ClusterExplorerCoreClustersCreate', query: {templateId: data[0].id}})
          break;
        case 'edit':
          router.push({name: 'ClusterExplorerSettingsTemplatesEdit', params: {templateId: data[0].id}})
          break;
        case 'clone':
          router.push({name: 'ClusterExplorerSettingsTemplatesCreate', query: {templateId: data[0].id}})
          break;
        case 'setDefault':
          setDefault(data[0])
          break;
        case 'unsetDefault':
          unsetDefault(data[0])
          break;
      }
    }
    const deleteTemplates = async (templates) => {
      confirmModalVisible.value=false
      const results = await Promise.allSettled(templates.map((c) => remove(c.id)))
      const errors = results
        .filter((p) => p.status === 'rejected')
        .map((p) => p.reason)
      errors.forEach((e) => {
         notificationStore.notify({
          type: 'error',
          title: 'Delete Template Failed',
          content: stringify(e)
        })
      })
    }
    watchEffect(() => {
      if(confirmModalVisible.value === false) {
        commandParams.value=[]
      }
    })

    return {
      data,
      state,
      handleSelectionChange,
      searchQuery,
      selectedTemplates,
      toggleGroupBy,
      groupBy,
      error,
      reload,
      handleCommand,
      commandParams,
      confirmModalVisible,
      deleteTemplates,
    }
  },
  components: {
    TemplateActions,
    TemplateBulkActions,
  }
})
</script>
<style>
.template-table__header {
  display: grid;
  grid-template-areas: "actions btn search";
  grid-template-columns: 1fr auto minmax(min-content, 200px);
  padding: 0 0 20px;
  column-gap: 10px;
}
.template-table__actions {
  grid-area: actions;
}
.template-table__search {
  grid-area: search;
}
</style>
