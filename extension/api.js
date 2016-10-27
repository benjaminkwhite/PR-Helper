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

	window.GitHubNotify.getApiUrl = (repo) => {
//console.log("getApiUrl")
		const rootUrl = window.GitHubNotify.settings.get('rootUrl');

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
			return 'https://api.github.com/repos/'+repo+'/pulls';
		}
		return `${rootUrl}api/v3/repos/`+repo+`/pulls`;
	};

//https://github.corp.achievers.com/api/v3/repos/BE/PFA/pulls?access_token=9b03b8b48a278f91575387a5351b7ee77ae88341

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



				// return response.json().then(response => {
				// 	return {count: data.length, interval, lastModifed};
				// });

			

  let repositories = JSON.parse(window.GitHubNotify.settings.get('repositories'));


  repositories.forEach(repo => {
    const query = window.GitHubNotify.buildQuery({ perPage: 100 });
    const url = `${window.GitHubNotify.getApiUrl(repo)}?${query.join('&')}`;

    window.GitHubNotify.request(url).then(response => {
      const interval = Number(response.headers.get('X-Poll-Interval'));
      //      const lastModifed = response.headers.get('Last-Modified');

      const linkheader = response.headers.get('Link');

      if (linkheader === null) {

        response.json().then(data => {

          window.GitHubNotify.store('repos', repo, data)
          data.forEach(data => {

            let comments = [];
            window.GitHubNotify.request(data.issue_url).then(response => {

              response.json().then(data => {

                comments = comments.concat(data);
                window.GitHubNotify.settings.set('comments', JSON.stringify(comments))

              }); //comments data response

            }); //comments url request

          }); // comments forEach

        }); //PR url response

      }



      if (status >= 500) {
        return Promise.reject(new Error('server error'));
      }

      if (status >= 400) {
        return Promise.reject(new Error(`client error: ${status} ${response.statusText}`));
      }


    }); //PR url request

  }); //PR forEach

}; //gitHubNotifCount



window.GitHubNotify.store = (key, repo, data) => {
    var repos, jsonText;
    repos = JSON.parse(window.GitHubNotify.settings.get('repos')) || {};
    repos[repo] = data;

    jsonText = JSON.stringify(repos);
    window.GitHubNotify.settings.set(key, jsonText);
  };

})();
