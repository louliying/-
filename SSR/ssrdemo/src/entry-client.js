// 客户端 entry 只需创建应用程序，并且将其挂载到 DOM 中
import {createApp} from './app.js';

const {app, router} = createApp();
// 挂载app之前调用router.onReady
// 因为路由器必须要提前解析路由配置中的异步组件，
// 才能正确调用组件中可能存在的路由钩子
router.onReady(() => {
	app.$mount('#app');	
});
