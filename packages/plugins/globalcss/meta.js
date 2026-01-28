export default {
  id: 'engine.plugins.globalcsscontroller',
  title: '全局样式(页面共享)',
  type: 'plugins',
  icon: 'plugin-icon-css',
  align: 'leftTop',
  width: 600,
  widthResizable: true,
  // 当点击插件栏切换或关闭前是否需要确认, 会调用插件中confirm值指定的方法，e.g. 此处指向 close方法，会调用插件的close方法执行确认逻辑
  confirm: 'close'
}
