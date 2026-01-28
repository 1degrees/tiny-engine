/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import useHttp from '../http'
import dataSources from './dataSource.json'
import { Modal } from '@opentiny/vue'

const createFn = (fnContent) => {
  return (...args) => {
    const fn = new Function(`return ${fnContent}`)()
    return fn.apply(this, args)
  }
}
const globalWillFetch = dataSources.willFetch ? createFn(dataSources.willFetch.value) : (opt) => opt
const globalDataHandle = dataSources.dataHandler ? createFn(dataSources.dataHandler.value) : (res) => res
const globalErrorHandler = dataSources.errorHandler
  ? createFn(dataSources.errorHandler.value)
  : (err) => Promise.reject(err)
const msgConf = { message: ``, status: 'error', top: 50 }
const tokenHandler = (config) => {
  !config.headers && (config.headers = {})
  const rg = /token=([^&]*)/
  const tokens = location.href?.match?.(rg) || []
  config.headers.CASAuthorization = tokens[1] || localStorage.getItem('jwtToken')
  return config
}
const notifyHandler = (res) => {
  const { data = {}, config = {} } = res || {}
  if (data.code === 401 || data.code === 502 || data.code === 302) {
    Modal.message({ ...msgConf, message: data?.msg || data?.message || '未登录或登录过期' })
    window.config?.switch && alert(JSON.stringify({ url: config.url, ...data }))
    sessionStorage.clear()
    localStorage.removeItem('jwtToken')
    if (import.meta.env.MODE === 'development') {
      alert('授权提示\n登录未授权，即将跳转登录页;\n若您已登录，首次访问链接尾部拼接?token=XXX值');
    }
    location.href = data?.msg || data?.message
  } else if (data.code !== 200 && data.code !== 0) {
    Modal.message({ ...msgConf, message: data?.msg || data?.message || '服务端错误' })
  }
  return res
}
const errorHander = (error) => {
  if (error?.response?.status === 504) {
    Modal.message({ ...msgConf, message: '服务端错误' })
    window.config?.switch && alert(JSON.stringify({ url: error?.response?.config?.url }))
  } else {
    Modal.message({ ...msgConf, message: '请求出错' })
  }
  return error
}
const applyFuns =
  (...funs) =>
  (params) => {
    let rs = params
    for (const fun of funs) {
      rs = fun(rs)
    }
    return rs
  }

const load = (http, options, dataSource, shouldFetch) => (params, path, customConfig) => {
  // 如果没有配置远程请求，则直接返回静态数据，返回前可能会有全局数据处理
  if (!options) {
    return Promise.resolve(globalDataHandle(dataSource.config.data))
  }

  if (!shouldFetch()) {
    return Promise.resolve(undefined)
  }

  dataSource.status = 'loading'

  const { method, uri: url, params: defaultParams, timeout, headers } = options
  const config = { method, url, headers, timeout, ...customConfig }

  const data = params || defaultParams

  config.url = path ? `${config.url}/${path}` : config.url

  if (['get', 'delete'].includes(method.toLowerCase())) {
    config.params = data
  } else {
    config.data = data
  }

  return http.request(config)
}
const dataSourceMap = {}
const initSourceMap = () => {
  dataSources.list.forEach((config) => {
    const dataSource = { config }
    // 添加重复名称检查
    if (dataSourceMap[config.name]) {
      // eslint-disable-next-line no-console
      console.warn(`数据源名称 "${config.name}" 已存在，新的配置将覆盖原有配置`)
      Modal.message({
        message: `数据源名称 "${config.name}" 已存在，新的配置将覆盖原有配置`,
        status: 'warning',
        top: 50
      })
    }
    dataSourceMap[config.name] = dataSource

    const shouldFetch = config.shouldFetch?.value ? createFn(config.shouldFetch.value) : () => true
    const willFetch = config.willFetch?.value ? createFn(config.willFetch.value) : (options) => options
    const dataHandler = (res) => {
      const data = config.dataHandler?.value ? createFn(config.dataHandler.value)(res) : res
      dataSource.status = 'loaded'
      dataSource.data = data
      return data
    }
    const errorHandler = (error) => {
      config.errorHandler?.value && createFn(config.errorHandler.value)(error)
      dataSource.status = 'error'
      dataSource.error = error
    }
    const http = useHttp({
      globalWillFetch: applyFuns(tokenHandler, globalWillFetch),
      globalDataHandle: applyFuns(notifyHandler, globalDataHandle),
      globalErrorHandler: applyFuns(errorHander, globalErrorHandler),
      willFetch,
      dataHandler,
      errorHandler
    })

    if (import.meta.env.VITE_APP_MOCK === 'mock') {
      http.mock([
        {
          url: config.options?.uri,
          response() {
            return Promise.resolve([200, { data: config.data }])
          }
        },
        {
          url: '*',
          proxy: '*'
        }
      ])
    }

    dataSource.status = 'init'
    dataSource.load = load(http, config.options, dataSource, shouldFetch)
  })
}
initSourceMap()
// 初始化授权功能，项目未登录，则提示登录
const initToken = (sourceMap) => {
  if (sourceMap?.getToken) {
    sourceMap?.getToken?.load()?.then((rs) => {
      localStorage.setItem('jwtToken', rs?.data || rs)
    })
  } else {
    Modal.message({
      message: `数据源缺少getToken接口，无法针对项目进行授权，请添加getToken接口`,
      status: 'warning',
      top: 50
    })
  }
}
initToken(dataSourceMap)
export default dataSourceMap
