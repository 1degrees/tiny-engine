function addCss(href) {
  const link = document.createElement('link')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('href', href)
  document.head.appendChild(link)
}

function addScript(code, options = {}) {
  const {
      async = false,
      defer = false,
      isSrc = false
  } = options;
  const scriptElement = document.createElement('script');
  scriptElement.type = 'text/javascript';
  if (isSrc) {
    scriptElement.src = code;
  } else {
    scriptElement.textContent = code;
  }
  if (async) scriptElement.async = true;
  if (defer) scriptElement.defer = true;
  document.head.appendChild(scriptElement);
}

// tailwindcss function and directive 特性需要使用 <style type="text/tailwindcss"> 标签
// https://tailwindcss.com/docs/functions-and-directives
// vue-repl 默认是使用 style[css] 标签，我们需要将它转换为 <style type="text/tailwindcss"> 标签
// 并重新插入一遍使得 tailwindcss 识别并生效
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function enableTailwindCSS(tryCount = 0) {
  if (tryCount > 100) {
    return
  }

  while (!document.querySelectorAll('style[css]').length) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    enableTailwindCSS(tryCount + 1)
    return
  }

  const allStyles = document.querySelectorAll('style[css]')
  allStyles.forEach((el) => {
    const content = el.innerHTML
    const attributes = {}
    Array.from(el.attributes).forEach((attr) => {
      attributes[attr.name] = attr.value
    })

    el.remove()

    attributes.type = 'text/tailwindcss'
    const attributeText = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')

    document.head.insertAdjacentHTML('beforeend', `<style ${attributeText}>${content}</style>`)
  })
}
