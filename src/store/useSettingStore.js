import { defineStore } from 'pinia'
import { fetchList } from '@/api/setting.js'
import createApiStore from './createApiStore.js'

const useSettingStore = defineStore('settingStore', createApiStore({ fetchList }))

export default useSettingStore
