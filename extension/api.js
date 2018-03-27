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




window.gitHubNotifCount = (repo) => {
var prCount, commentCount, hiddenPRs, reducedPRs, teamMates, myId, list;


    const query = window.GitHubNotify.buildQuery({ perPage: 100 });
    const url = `${window.GitHubNotify.getApiUrl(repo)}?${query.join('&')}`;

    return window.GitHubNotify.request(url).then(response => {
      return response.json().then(repoData => {
      	prCount = repoData.length
console.log(repoData)

        hiddenPRs = window.GitHubNotify.settings.get('hiddenPRs');
        if (hiddenPRs !== undefined && hiddenPRs.length > 0) {
          hiddenPRs = JSON.parse(hiddenPRs);
        };


        reducedPRs = _(repoData).filter(function(prs) {
        	return !_(hiddenPRs).contains(prs.id);
        }, 0);

        window.GitHubNotify.store('repos', repo, reducedPRs)

          teamMates = localStorage.getItem('teamMates') || {};
          myId = localStorage.getItem('myId') || {};

          if (teamMates.length > 0) {

            myId = myId.split(",");
            teamMates = teamMates.split(",");
            list = teamMates.concat(myId);

            reducedPRs = _(reducedPRs).filter(function(pr) {
              return _(list).contains(pr.user.login);
            });
          };



// var test = window.tryThis(repoData)
// console.log("test" + test)

        repoData.forEach(prData => {




		window.tryThis(prData.comments_url).then(response => {


			console.log(response.count)

		}).catch(handleError);

        }); // comments forEach


 return {count: prCount, prCount: 11, interval: 60, lastModifed: 'today'};







      }); //PR url response

    }); //PR url request


}; //gitHubNotifCount


	window.tryThis = prData => {

          let comments = [];
          let commentsLength = 0

 console.log(prData)

          return window.GitHubNotify.request(prData).then(response => {
            return response.json().then(commentsData => {

              // comments = comments.concat(commentsData);
              // commentsLength = commentsLength + commentsData.length;

//              window.GitHubNotify.settings.set('comments', JSON.stringify(comments))
return {count: 123};


            }); //comments data response


          }); //comments url request
// console.log("commentsLength " + commentsLength)




        
	};



window.GitHubNotify.store = (key, repo, data) => {
var repos, jsonText;
repos = window.GitHubNotify.settings.get('repos') || {};
if (repos.length > 0) {
  repos = JSON.parse(repos);
}
repos[repo] = data;

jsonText = JSON.stringify(repos);
window.GitHubNotify.settings.set(key, jsonText);
};


})();
