import { shallowReactive } from 'vue'

export interface IDataSourceMap {
  value?: string
}

export function useGlobalStyle() {
  const css = shallowReactive<IDataSourceMap>({})

  const getGlobalStyle = () => {
    return css.value
  }

  const setGlobalStyle = (list) => {
    css.value = css
  }
  return {
    css,
    getGlobalStyle,
    setGlobalStyle
  }
}
