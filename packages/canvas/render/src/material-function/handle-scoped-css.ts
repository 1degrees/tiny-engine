import postcss from 'postcss'
import scopedPlugin from './scope-css-plugin'

export function handleScopedCss(id: string, content: string) {
  const plugins = id ? [scopedPlugin(id)] : []
  return postcss(plugins).process(content, { from: undefined })
}