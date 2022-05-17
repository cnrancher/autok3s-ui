import request from '@/utils/request'

export function fetchList(signal) {
  return request({
    url: '/providers',
    method: 'get',
    signal
  })
}

export function fetchById(id, signal) {
  return request({
    url: `/providers/${id}`,
    method: 'get',
    signal
  })
}
