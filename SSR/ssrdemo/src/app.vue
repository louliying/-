<template>
	<p>我是主入口</p>
</template>
<script>
	// Vue提供异步组件 加载 
	// 这是普通的组件加载，应用程序启动后，组件就被加载了
	// import Foo from './components/Foot.vue';
	
	// 这是按需加载，应用执行执行到此页面时， 才会去加载组件
	const Foo = () => import('./components/Foot.vue');
	
</script>