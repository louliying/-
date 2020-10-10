// 服务器 entry 使用 default export 导出函数，并在每次渲染中重复调用此函数
// 除创建和返回应用程序实例外， 不会做太多其它事

import {createApp} from './app';

export default context => {
	// 因为可能会有异步路由钩子函数或组件，所以将返回一个Promise
	// 以便服务器能够等待所有的内容在渲染前， 就已经准备就绪

	return new Promise((resolve, reject) => {
		const {app, router} = createApp();
		// 设置服务器端router的位置
		router.push(context.url);
		// 等到router将可能的异步组件和钩子函数解析完
		router.onReady(() => {
			const matchedComponents = router.getMatchedComponents();
			// 匹配不到的路由，执行reject函数，并返回404
			if (!matchedComponents.lenght) {
				return reject({
					code: 404
				})
			}
			// resolve应用程序实例，以更它可以渲染
			resolve(app)
		}, reject);
	})
	
}