import { initStyle } from '../material-function/page-getter'
import { getController } from '../render'
export function setPageCss(css = '', pageId?: string) {
  const cssPageId = pageId ?? getController().getBaseInfo().pageId
  const key = `data-te-page-${cssPageId}`
  initStyle(key, css)
}

export function setGlobalCss(css = '') {
  initStyle('app-global-css', css)
}