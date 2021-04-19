(window.webpackJsonp = window.webpackJsonp || []).push([[0], {10(e, t, a) {
	'use strict'; a.r(t); const n = a(0); const r = a.n(n); const l = a(3); const c = a.n(l); const o = a(1); const s = (a(9), 'bg-green-400 rounded-lg px-2 py-1 font-semibold text-white block mt-2'); const u = 'http://episodes-fm.herokuapp.com/v1'; const m = function (e) {
		const t = e.title; const a = e.details; const n = e.children; return r.a.createElement('div', {className: 'mb-6'}, r.a.createElement('h3', {className: 'text-lg text-green-400'}, t), r.a.createElement('p', {className: 'text-sm mb-3'}, a), n);
	};

	const i = function () {
		const e = new Object(n.useState)(''); const t = new Object(o.a)(e, 2); const a = t[0]; const l = t[1]; const c = new Object(n.useCallback)(() => {
			window.location.href = ''.concat(u, '/episode/lookup/url/').concat(a);
		}, [a]); return r.a.createElement(m, {title: 'Get Episode with Share URL', details: 'Provides episode, podcast details & third-party URLs'}, r.a.createElement('input', {className: 'bg-gray-50 border-2 rounded-lg px-2 py-1 mr-2', type: 'text', value: a, onChange(e) {
			return l(e.target.value);
		}, placeholder: 'Share URL'}), r.a.createElement('button', {className: s, onClick() {
			return c();
		}}, 'Get Episode'));
	};

	const d = function () {
		const e = new Object(n.useState)(''); const t = new Object(o.a)(e, 2); const a = t[0]; const l = t[1]; const c = new Object(n.useState)(''); const i = new Object(o.a)(c, 2); const d = i[0]; const p = i[1]; const E = new Object(n.useCallback)(() => {
			window.location.href = ''.concat(u, '/episode/lookup/feed/').concat(a, '/').concat(d);
		}, [a, d]); return r.a.createElement(m, {title: 'Get Episode with Feed URL & GUID', details: 'Provides episode, podcast details & third-party URLs'}, r.a.createElement('input', {className: 'bg-gray-50 border-2 rounded-lg px-2 py-1 mr-2', type: 'text', value: a, onChange(e) {
			return l(e.target.value);
		}, placeholder: 'Feed URL'}), r.a.createElement('input', {className: 'bg-gray-50 border-2 rounded-lg px-2 py-1 mr-2', type: 'text', value: d, onChange(e) {
			return p(e.target.value);
		}, placeholder: 'GUID'}), r.a.createElement('button', {className: s, onClick() {
			return E();
		}}, 'Get Episode'));
	};

	const p = function () {
		return r.a.createElement(m, {title: 'Get all platforms', details: 'Returns all available third-party platforms'}, r.a.createElement('button', {className: s, onClick() {
			return window.location.href = ''.concat(u, '/platforms');
		}}, 'Get Platforms'));
	};

	const E = function () {
		const e = new Object(n.useState)(''); const t = new Object(o.a)(e, 2); const a = t[0]; const l = t[1]; const c = new Object(n.useCallback)(() => {
			window.location.href = ''.concat(u, '/podcast/lookup/feed/').concat(a);
		}, [a]); return r.a.createElement(m, {title: 'Get Podcast with Feed URL', details: 'Provides third-party podcast URLs'}, r.a.createElement('input', {className: 'bg-gray-50 border-2 rounded-lg px-2 py-1 mr-2', type: 'text', value: a, onChange(e) {
			return l(e.target.value);
		}, placeholder: 'Feed URL'}), r.a.createElement('button', {className: s, onClick() {
			return c();
		}}, 'Get Feeds'));
	};

	const f = function () {
		return r.a.createElement(m, {title: 'Get all users', details: 'Returns all users'}, r.a.createElement('button', {className: s, onClick() {
			return window.location.href = ''.concat(u, '/users');
		}}, 'Get Users'));
	};

	const b = function () {
		const e = new Object(n.useState)(''); const t = new Object(o.a)(e, 2); const a = t[0]; const l = t[1]; const c = new Object(n.useState)(''); const u = new Object(o.a)(c, 2); const i = u[0]; const d = u[1]; const p = new Object(n.useCallback)(() => {}, [a, i]); return r.a.createElement(m, {title: 'Create User', details: 'Creates API User'}, r.a.createElement('input', {className: 'bg-gray-50 border-2 rounded-lg px-2 py-1 mr-2', type: 'text', value: a, onChange(e) {
			return l(e.target.value);
		}, placeholder: 'Email'}), r.a.createElement('select', {onChange(e) {
			return d();
		}}, r.a.createElement('option', null, 'Role'), r.a.createElement('option', {value: 'admin'}, 'Admin'), r.a.createElement('option', {value: 'consumer'}, 'Consumer')), r.a.createElement('button', {className: s, onClick() {
			return p();
		}}, 'Create User'));
	};

	const h = function () {
		const e = new Object(n.useState)(''); const t = new Object(o.a)(e, 2); const a = t[0]; const l = t[1]; const c = new Object(n.useCallback)(() => {}, [a]); return r.a.createElement(m, {title: 'Delete User', details: 'Creates API User'}, r.a.createElement('input', {className: 'bg-gray-50 border-2 rounded-lg px-2 py-1 mr-2', type: 'text', value: a, onChange(e) {
			return l(e.target.value);
		}, placeholder: 'User ID'}), r.a.createElement('button', {className: s, onClick() {
			return c();
		}}, 'Delete User'));
	};

	const g = function (e) {
		const t = e.children; const a = e.name; return r.a.createElement('h2', {name: a, className: 'text-xl font-bold mt-5'}, t);
	};

	const v = 'text-green-400 mr-5 underline'; const y = function () {
		return r.a.createElement('div', {className: 'min-h-screen p-8'}, r.a.createElement('h1', {className: 'text-3xl font-bold text-green-400'}, 'Episode.fm API documentation'), r.a.createElement('div', null, r.a.createElement('a', {className: v, href: '#episodes'}, 'Episodes'), r.a.createElement('a', {className: v, href: '#platforms'}, 'Platforms'), r.a.createElement('a', {className: v, href: '#podcasts'}, 'Podcasts'), r.a.createElement('a', {className: v, href: '#users'}, 'Users')), r.a.createElement(g, {name: 'episode'}, 'Episodes'), r.a.createElement(i, null), r.a.createElement(d, null), r.a.createElement('hr', {className: 'my-10'}), r.a.createElement(g, {name: 'platforms'}, 'Platforms'), r.a.createElement(p, null), r.a.createElement('hr', {className: 'my-10'}), r.a.createElement(g, {name: 'podcasts'}, 'Podcasts'), r.a.createElement(E, null), r.a.createElement('hr', {className: 'my-10'}), r.a.createElement(g, {name: 'users'}, 'Users'), r.a.createElement(f, null), r.a.createElement(b, null), r.a.createElement(h, null));
	};

	c.a.render(r.a.createElement(y, null), document.querySelector('#root'));
}, 4(e, t, a) {
	e.exports = a(10);
}, 9(e, t, a) {}}, [[4, 1, 2]]]);
// # sourceMappingURL=main.81bcbe19.chunk.js.map
