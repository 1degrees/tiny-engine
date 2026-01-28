export default class Router {
  go(n) {
    window.history.go(n)
  }
  back() {
    window.history.back()
  }
  forward() {
    window.history.forward()
  }
  replace(to) {
    if (typeof to === 'string') {
      window.location.replace(to)
    } else if (to?.path) {
      const url = to.path + (to.query ? '?' + new URLSearchParams(to.query).toString() : '')
      window.location.replace(url)
    }
  }
  push(to) {
    if (typeof to === 'string') {
      window.location.assign(to)
    } else if (to?.path) {
      const url = to.path + (to.query ? '?' + new URLSearchParams(to.query).toString() : '')
      window.location.assign(url)
    }
    return Promise.resolve()
  }
}