export default class VueRouter {
	static install: () => void;
	static version: string;

	app: any;
	apps: Array<any>;
	ready: boolean;
	readyCbs: Array<Function>;
	options: RouterOptions;
	mode: string;
	history: HashHistory | HTMLHistory | AbstractHistory;
	matcher: Matcher;
	fallback: boolean;
	beforeHooks: Array<?NavigationGuard>;
	resolveHooks: Array<?NavigationGuard>;
	afterHooks: Array<?AfterNavigationHook>;

	constructor (options: RouterOptions = {}) {
		this.app = null;
		this.apps = [];
		this.beforeHooks = [];
		this.resolveHooks = [];
		this.afterHooks = [];
		this.matcher = createMatcher(options.routes || [], this);

		// 根据 mode 实例化具体的 History，默认为'hash'模式
		let mode = options.mode || 'hash';

		// 通过 supportsPushState 判断浏览器是否支持'history'模式
		// 如果设置的是'history'但是如果浏览器不支持的话，'history'模式会退回到'hash'模式
		// fallback 默认值为 true。
		// fallback 是当浏览器不支持 history.pushState 控制路由是否应该回退到 hash 模式。
		this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false;

		// 不支持history，退回hash
		if (this.fallback) {
			mode = 'hash';
		}

		// 不是在浏览器环境内， 退回abstract
		if (!inBrowser) {
			mode = 'abstract';
		}
		this.mode = mode;
		switch(mode) {
			case 'history':
				this.history = new HTML5History(this, options.base);
				break;
			case 'hash':
				this.history = new HashHistory(this, options.base, this.fallback);
				break;
			case 'abstract':
				this.history = new AbstractHistory(this, options.base);
				break;
			default:
				//如果不是在prodcution 模式下
				if (process.env.NODE_ENV !== 'production') {
					assert(false, `invalid mode:${mode}`);
				}
		}
	}

	match (
		raw: Rawlocation,
		current?: Route,
		redirectedFrom?: Location
	): Route {
		return this.matcher.match(raw, current, redirectedFrom);
	}

	get currentRoute (): ?Route {
		return this.history && this.history.current;
	}

	init (app: any /* Vue component instance */) {
		process.env.NODE_ENV !== 'production' && assert(
			install.installed,
      		`not installed. Make sure to call \`Vue.use(VueRouter)\` ` +
      		`before creating root instance.`
		);
		this.apps.push(app);

		if (this.app) {
			return;
		}

		this.app = app;
		const history = this.history;
		// 根据history的类别执行相应的初始化操作和监听
		if (history instanceof HTMLHistory) {
			history.transitionTo(history.getCurrentLocation());
		} else if (history instanceof HashHistory) {
			const setupHashListener = () => {
				history.setupListeners();
			}
			history.transitionTo(
		        history.getCurrentLocation(),
		        setupHashListener,
		        setupHashListener
		    );
		}

		history.listen(route => {
			this.apps.forEach((app) => {
				app._route = route;
			})
		})
	}
	// 路由跳转前
	beforeEach(fn: Function): Function {
		return registerHook(this.beforeHooks, fn);
	}

	// 路由导航被确定之前
	beforeResolve(fn: Function): Function {
		return registerHook(this.resolveHooks, fn);
	}

	// 路由跳转之后
	afterEach (fn: Function): Function {
		return registerHook(this.afterHooks, fn);
	}

	// 第一次路由跳转完成时被调用的回调函数
	onReady(cb:Function, errorCb?: Function) {
		this.history.onReady(cb, errorCb);
	}

	// 路由报错
	onError (errorCb: Function) {
		this.history.onError(errorCb);
	}
	// 路由添加，这个方法会向history栈添加一个记录，点击后退会返回到上一个页面
	push(location: RawLocation, onComplete?: Function, onAbort?: Function) {
		this.history.push(location, onComplete, onAbort);
	}

	// 这个方法不会向history里面添加新的记录，点击返回， 会跳转到上上一个页面。
	// 上一个记录是不存在的。
	replace (location: RawLocation, onCompelete?: Function, onAbort?: Function) {
		this.history.replace(location, onCompelete, onAbort);
	}

	// 相对于当前页面向前或向后跳多少个页面， 类似 window.history.go(n)
	// n可为正数，负数。
	go (n: number) {
		this.history.go(n);
	}

	// 后退到上一下页面
	back() {
		this.go(-1);
	}

	// 前进到下一个页面
	forward () {
		this.go(-1);
	}

	getMatchedComponents (to?: RawLocation | Route): Array<any> {
		const route: any = to ? (to.matched ? to : this.resolve(to).route) : this.currentRoute;
		if (!route) {
			return [];
		}
		return [].concat.apply([], route.mathced.map(m => {
			return Object.keys(m.components).map(key => {
				return m.components[key]
			});
		}));
	}

	resolve(
		to: RawLocation,
		current?: Route,
		append?: boolean
	): {
		location: location,
		route: Route,
		href: string,
		normalizedTo: Location,
		resolved: Route
	} {
		const location = normlizeLocation(
			to,
			current || this.history.current,
			append,
			this 
		);
		const route = this.match(location, current);
		const fullPath = route.redirectedFrom || route.fullPath;
		const base = this.history.base;
		const href = createHref(base, fullPath, this.mode);
		return {
			location,
			route,
			href,
			normalizedTo: location,
			resolved: route
		}
	}

	addRoutes (routes: Array<RouteConfig>) {
		this.matcher.addRoutes(routes);
		if (this.history,current !== START) {
			this.history.transitionTo(this.history.getCurrentLocation());
		}
	}

	transitionTo (location: Rawlocation, onComplete?: Funcion, onAbort?: Function) {
		// 找到匹配路由
		const route = this.router.match(location, this.current);
		// 确定是否转化
		this.confirmTransition(route, () => {
			// 更新route
			this.updateRoute(route);
			onComplete && onComplete(route);
			this.ensureURL();

			if (!this.ready) {
				this.ready = true;
				this.readyCbs.forEach(cb => {
					cb(route)
				});
			}
		}, err => {
			if (onAbort) {
				onAbort(err);
			}
			if (err && !this.ready) {
				this.ready = true;
				this.readyErrorCbs.forEach(cb => {
					cb(err);
				});
			}
		});
	}

	// 更新路由
	updateRoute (route: Route) {
		// 跳转前路由
		const prev = this.current;
		// 装备跳转路由
		this.current = route;
		// 回调函数，这一步很重要，
		// 这个回调函数在index文件中注册, 会更新被劫持的数据 _router
		this.cb && this.cb(route);
		this.router.afterHooks.forEach(hook => {
			hook && hook(route, prev);
		});
	}

}

export class HashHistory extends History {
	constructor (router: Router, base: ?string, fallback: boolean) {
		super(router, base);
		// check history fallback deeplinking
		// 如果是从history
		if (fallback && checkFallback(this.base)) {
			// 如果降级且做了降级处理，则返回
			return;
		}
		ensureSlash();
	}

	setupListeners () {
		window.addEventListener('hashchange', () => {
			if (!ensureSlash()) {
				return;
			}
		});
	}
}


function checkFallback(base) {
	const location = getLocation(base);
	// 得到除去base的真正的 location 值
	if (!/^\/#/.test(location)) {
		// 如果 此时地址不是以'/#' 开头的
		// 需要做一次降级处理，降为hash模式下应有的 '/#' 开头
		window.location.replace(
			cleanPath(base + '/#' + location)
		);
		return true;
	}
}

function ensureSlash():boolean {
	// 得到hash值 
	const path = getHash();
	if (path.charAt(0) === '/') {
		// 如果是以 / 开头的，直接返回即可
		return true;
	}
	// 不是的话，需要手动保证一次  替换 hash值 
	replaceHash('/' + path);
	return false;
}

export function getHash ():string {
	// 因为兼容性的问题，这里滑直接使用window.location.hash
	// 因为firefox docode hash值 
	const href = window.location.href;
	const index = href.indexOf('#');
	return index === -1 ? '' : decodeURI(href.slice(index + 1));
}

//  得到hash之前的URL地址
function getUrl (path) {
	const href = window.location.href;
	const i = href.indexOf('#');
	const base = i >= 0 ? href.slice(0, i) : href;
	return `${base}#${path}`;
}

// 添加一个hash
function pushHash(path) {
	if (supportsPushState) {
		pushState(getUrl(path));
	} else {
		window.location.hash = path;
	}
}

// 替代hash
function replaceHash (path) {
	if (supportsPushState) {
		replaceState(getUrl(path));
	} else {
		window.location.replace(getUrl(path));
	}
}

export function pushState (url?:string, replace?: boolean) {
	saveScrollPosition();

	// 加了try...catch是因为Safari有调用 pushState 100 次限制
	// 一旦达到了就会抛出DOM Exception 18 错误
	const history = window.history;
	try {
		if (replace) {
			// replace 的话, key还是当前的key， 没必要生成新的
			history.replaceState({
				key: _key
			}, '', url);
		} else {
			// 重新生成key
			_key = genKey();
			// 带入新的key值
			history.pushState({
				key: _key
			}, '', url);
		}
	} catch(e) {
		// 达到限制了， 则重新指定新的地址
		window.location[replace ? 'replace' : 'assign'](url);
	}
}

// 直接调用 pushState 传入replace 为true
export function replaceState(url?: string) {
	pushState(url, true);
}

export const supportsPushState = inBrowser && (function(){
	const ua = window.navigator.userAgent;

	if (
		(ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
		ua.indexOf('Mobile Safari') !== -1 &&
		ua.indexOf('Chrome') === -1 &&
		ua.indexOf('Window Phone') === -1
	) {
		return false;
	}
	return window.history && 'pushState' in window.history;
})();


export class HTML5History extends History {
	constructor (router: Router, base: ?string) {
		super(router, base);

		// 回滚方式 
		const expectScroll = router.options.scrollBehavior;
		const supportsScroll = supportsPushState && expectScroll;

		if (supportsScroll) {
			setupScroll();
		}

		const initLocation = getLocation(this.base);
		// 监听popstate事件
		window.addEventListener('popstate', e => {
			const current = this.current;

			// 避免在某些浏览器中首次发出popstate事件
			// 由于同一时间异步监听，history路由没有同时更新
			const location = getLocation(this.base);
			if (this.current === START && location === initLocation) {
				return;
			}

			this.transitionTo(location,route => {
				if (supportsScroll) {
					handleScroll(router, route, current, true);
				}
			});
		});

	}

}

export class AbstractHistory extends History {
	index: number;
	stack: Array<Route>;

	constructor (router: Router, base: ?string) {
		super(router, base);
		this.stack = [];
		this.index = -1;
	}

	//  对于go的模拟
	go (n: number) {
		// 新的历史记录位置
		const targetIndex = this.index + n;
		// 小于或大于超出则返回
		if (targetIndex < 0 || targetIndex >= this.stack.length) {
			return;
		}
		// 取得新的route 对象 
		// 因为是和浏览器无关的， 这里得到的一定已经访问过的
		const route = this.stack[targetIndex];
		// 所以这里直接调用 confirmTransition 了
		// 而不是调用 transitionTo 还要走一遍 match 逻辑
		this.confirmTransition(route, () => {
			this.index = targetIndex;
			this.updateRoute(route);
		});
	}
	// 确认是否转化路由
	confirmTransition (route: Route, onComplete: Function, onAbort?: Function) {
		const current = this.current;
		const abort = err => {
			if (isError(err)) {
				if (this.errorCbS.length) {
					this.errorCbS.forEach(cb => {
						cb(err);
					})
				} else {
					warn(false, 'uncaught error during route navigation:');
					console.error(err);
				}
			}
			onAbort && onAbort(err);
		}

		// 判断如果前后是同一个路由， 不进行操作
		if (
			isSameRoute(route, current) &&
			route.matched.length === current.matched.length
		){
			this.ensureURL();
			return abort();
		}
	}

	//下面是各类钩子函数的处理
    //*********************
}