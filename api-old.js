(() => {
	'use strict';

	window.GitHubNotify = (() => {
		const defaults = {
			rootUrl: 'https://api.github.com/',
			oauthToken: '',
			useParticipatingCount: false,
			interval: 60
		};

		const api = {
			settings: {
				get: name => {
					//console.log("name " + name)
					const item = localStorage.getItem(name);
					//console.log("item " + item)

					if (item === null) {
						return {}.hasOwnProperty.call(defaults, name) ? defaults[name] : undefined;
					}

					if (item === 'true' || item === 'false') {
						return item === 'true';
					}

					return item;
				},
				set: localStorage.setItem.bind(localStorage),
				remove: localStorage.removeItem.bind(localStorage),
				reset: localStorage.clear.bind(localStorage)
			}
		};

		api.defaults = defaults;

		return api;
	})();

	window.GitHubNotify.requestPermission = permission => {
//console.log("requestPermission")
		return new Promise(resolve => {
			chrome.permissions.request({
				permissions: [permission]
			}, granted => {
				window.GitHubNotify.settings.set(`${permission}_permission`, granted);
				resolve(granted);
			});
		});
	};

	window.GitHubNotify.queryPermission = permission => {
//console.log("queryPermission")
		return new Promise(resolve => {
			chrome.permissions.contains({
				permissions: [permission]
			}, resolve);
		});
	};

	window.GitHubNotify.request = url => {
//console.log("request")
		const token = window.GitHubNotify.settings.get('oauthToken');
		if (!token) {
			return Promise.reject(new Error('missing token'));
		}

		/* eslint-disable quote-props */
		const headers = Object.assign({
			Authorization: `token ${token}`,
			'If-Modified-Since': ''
		});
		/* eslint-enable quote-props */

		return fetch(url, {headers});
	};

	window.GitHubNotify.getApiUrl = () => {
//console.log("getApiUrl")
		const rootUrl = window.GitHubNotify.settings.get('rootUrl');

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
			return 'https://api.github.com/repos/benjaminkwhite/PR-Helper/pulls';
		}
		return `${rootUrl}api/v3/notifications`;
	};

//https://api.github.com/repos/benjaminkwhite/PR-Helper/pulls?per_page=100&access_token=c9acae2943fcb0dce82efdfb6816abf2c676334e

	window.GitHubNotify.getTabUrl = () => {
//console.log("getTabUrl")
		let rootUrl = window.GitHubNotify.settings.get('rootUrl');

		if (/api.github.com\/$/.test(rootUrl)) {
			rootUrl = 'https://github.com/';
		}

		const tabUrl = `${rootUrl}notifications`;
		if (window.GitHubNotify.settings.get('useParticipatingCount')) {
			return `${tabUrl}/participating`;
		}
		return tabUrl;
	};

	window.GitHubNotify.buildQuery = options => {
//console.log("buildQuery")
		const perPage = options.perPage;
		const query = [`per_page=${perPage}`];
		if (window.GitHubNotify.settings.get('useParticipatingCount')) {
			query.push('participating=true');
		}
		return query;
	};

	window.gitHubNotifCount = () => {
		const query = window.GitHubNotify.buildQuery({perPage: 100});
		const url = `${window.GitHubNotify.getApiUrl()}?${query.join('&')}`;

		return window.GitHubNotify.request(url).then(response => {
			const status = response.status;
			const interval = Number(response.headers.get('X-Poll-Interval'));
			const lastModifed = response.headers.get('Last-Modified');

			const linkheader = response.headers.get('Link');

			if (linkheader === null) {
				return response.json().then(data => {
					return {count: data.length, interval, lastModifed};
				});
			}

			if (status >= 500) {
				return Promise.reject(new Error('server error'));
			}

			if (status >= 400) {
				return Promise.reject(new Error(`client error: ${status} ${response.statusText}`));
			}

			return {count, interval, lastModifed};
		});
	};
})();
