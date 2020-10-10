import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export function createRouter () {
	return new Router({
		// 有history, hash二种模式
		mode: 'history',
		routes: [
			{
				// 异步路由组件
				path:'/', component: () => import('./components/Foot.vue')
			}
		]
	})
}