import axios from 'axios'
import Cookies from 'js-cookie'
import { getRootPath } from '@/utils/index.js'

const csrfKey = 'CSRF'

const service = axios.create({
  baseURL: `${getRootPath()}${import.meta.env.VITE_APP_BASE_API}`,
  timeout: 30000
})
service.defaults.headers.common.Accept = 'application/json';
service.defaults.withCredentials = true
// request interceptor
service.interceptors.request.use(
  (config) => {
    // do something before request is sent
    const csrf = Cookies.get(csrfKey)
    if (csrf) {
      config.headers['X-API-CSRF'] = csrf
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
);

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  response => {
    const res = response.data;
    return res;
  },
  error => {
    console.log('err' + error); // for debug

    return Promise.reject(error);
  }
)

export default service
