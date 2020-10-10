// 通用 entry(universal entry)
// 在纯客户端应用程序中，我们将在此文件中创建根 Vue 实例，并直接挂载到 DOM
// 对于服务器端渲染(SSR)，责任转移到纯客户端 entry 文件
import Vue from 'vue';
import App from './app.vue';
import {createRouter} from './router.js';

export function createApp () {
	// 导出一个工厂函数，用于创建新的 应用程序， router, store实例
	// 创建router实例
	const router = createRouter();

	const app = new Vue({
		// 注入router到根Vue实例
		router,
		render: h => h(App)
	});
	return { app, router}
}