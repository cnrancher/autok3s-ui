import { defineStore } from 'pinia'
import { fetchList } from '@/api/template.js'
import createApiStore from './createApiStore.js'

const useTemplateStore = defineStore('templateStore', createApiStore({ fetchList }))

export default useTemplateStore
