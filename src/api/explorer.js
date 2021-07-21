import request from '@/utils/request'

export function fetchList() {
  return request({
    url: '/explorer',
    method: 'get',
      })
}
