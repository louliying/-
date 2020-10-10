const server = require('express')();
const Vue = require('vue');
// 读取html模板
// 内容插入在 “<!-- vue-ssr-outlet -->“ 注释开始的地方 
const template = require('fs').readFileSync('./index.template.html', 'utf-8');
const renderer = require('vue-server-renderer').createRenderer({
	template
});

const context = {
	title: 'vue ssr',
	metas: `
		<meta name="keyword" content="vue, srr, cindy" />
		<meta name="description" content="vue srr cindy lou" />
	`
};

console.log('cc');
server.get('*', (req, res) => {
	const app = new Vue({
		data: {
			url: req.url
		},
		template: `<div>The Url is: {{url}}</div>`
	});

	renderer.renderToString(app, context, (err, html) => {
		console.log('err:', err);
		if (err) {
			res.status(500).end('Internal Server Error!');
			return;
		}
		
		res.end(html);
	})
});
server.listen(8080);
