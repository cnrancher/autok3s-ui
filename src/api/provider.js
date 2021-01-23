import request from '@/utils/request'

export function fetchList() {
  return request({
    url: '/providers',
    method: 'get',
  });
}