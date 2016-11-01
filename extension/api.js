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

    return fetch(url, { headers });
  };

  window.GitHubNotify.getApiUrl = (repo) => {
    //console.log("getApiUrl")
    const rootUrl = window.GitHubNotify.settings.get('rootUrl');

    if (/(^(https:\/\/)?(api\.)?github\.com)/.test(rootUrl)) {
      return 'https://api.github.com/repos/' + repo + '/pulls';
    }
    return `${rootUrl}api/v3/repos/` + repo + `/pulls`;
  };


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

    let urls = [];
    var prCount, currentRepo, hiddenPRs, reducedPRs, teamMates, myId, list;


    const grabContent = url => window.GitHubNotify.request(url)
      .then(res => res.json().then(repoData => {

        prCount = repoData.length

        hiddenPRs = window.GitHubNotify.settings.get('hiddenPRs');
        if (hiddenPRs !== undefined && hiddenPRs.length > 0) {
          hiddenPRs = JSON.parse(hiddenPRs);
        }


        reducedPRs = _(repoData).filter(function(prs) {
          return !_(hiddenPRs).contains(prs.id);
        }, 0);


        currentRepo = window.GitHubNotify.lookup(repositories, url)

        window.GitHubNotify.store('repos', currentRepo, reducedPRs)

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

        let comments_url = [];
        repoData.forEach(prData => {
          comments_url.push(prData.comments_url);
        }); //PR forEach

        Promise.all(comments_url.map(subGrabContent))
          .then(() => console.log(`subGrabContent done`))




//    return {count: prCount, prCount: 11, interval: 60, lastModifed: 'today'};

      }));


    let comments_Data = [];
    let subGrabContent = tempUrl => window.GitHubNotify.request(tempUrl)
      .then(res => res.json().then(commentsData => {

        comments_Data = comments_Data.concat(commentsData);

        window.GitHubNotify.settings.set('comments', JSON.stringify(comments_Data));

      }));
      

    let repositories = JSON.parse(window.GitHubNotify.settings.get('repositories'));

    repositories.forEach(repo => {
      const url = `${window.GitHubNotify.getApiUrl(repo)}`;
      urls.push(url);
    }); //PR forEach

    Promise.all(urls.map(grabContent))
      .then(() => console.log(`grabContent done`))



  }; //gitHubNotifCount




  window.GitHubNotify.lookup = (array, string) => {
    let passBack
    array.some(function(value) {
      if (string.indexOf(value) >= 0) {
        passBack = value
      };
    });

    return passBack;
  };



  window.GitHubNotify.store = (key, repo, data) => {
    var repos, jsonText;
    repos = window.GitHubNotify.settings.get(key) || {};
    if (repos.length > 0) {
      repos = JSON.parse(repos);
    }
    repos[repo] = data;

    jsonText = JSON.stringify(repos);
    window.GitHubNotify.settings.set(key, jsonText);
  };


})();
