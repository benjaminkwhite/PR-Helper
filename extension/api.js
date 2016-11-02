/*jshint esversion: 6 */

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




  window.gitHubNotifCount = (repositories) => {

    let urls = [];
    var obj = {};
    var currentRepo, hiddenPRs, reducedPRs, teamMates, myId, list;

    hiddenPRs = window.GitHubNotify.settings.get('hiddenPRs');
    if (hiddenPRs !== undefined && hiddenPRs.length > 0) {
      hiddenPRs = JSON.parse(hiddenPRs);
    }

    teamMates = localStorage.getItem('teamMates') || {};
    myId = localStorage.getItem('myId') || {};

    const grabContent = url => window.GitHubNotify.request(url)
      .then(res => res.json().then(repoData => {


        currentRepo = window.GitHubNotify.lookup(repositories, url);

        reducedPRs = _(repoData).filter(function(prs) {
          return !_(hiddenPRs).contains(prs.id);
        }, 0);


        if (teamMates.length > 0) {

          myId = myId.split(",");
          teamMates = teamMates.split(",");
          list = teamMates.concat(myId);

          reducedPRs = _(reducedPRs).filter(function(pr) {
            return _(list).contains(pr.user.login);
          });
        }

        obj[(currentRepo).replace(/[-/]/g, "")] = reducedPRs.length;

        window.GitHubNotify.store('repos', currentRepo, reducedPRs);


        let comments_url = [];
        repoData.forEach(prData => {
          comments_url.push(prData.comments_url);
        }); //PR forEach

        let comments_Data = [];
        let loopcount = 0;
        var subGrabContent = tempUrl => window.GitHubNotify.request(tempUrl).then(res => res.json().then(commentsData => {

            comments_Data = comments_Data.concat(commentsData);

            window.GitHubNotify.settings.set('comments', JSON.stringify(comments_Data));

            var mySubArray = _.uniq(window.GitHubNotify.filterBody(commentsData), function(value) {
              loopcount++;
            });

            obj[(currentRepo + 'Pending').replace(/[-/]/g, "")] = loopcount;

          }));

        return Promise.all(comments_url.map(subGrabContent)).then(response => {
          return obj;
        });

      }));



    repositories.forEach(repo => {
      const query = window.GitHubNotify.buildQuery({ perPage: 100 });
      const url = `${window.GitHubNotify.getApiUrl(repo)}?${query.join('&')}`;
      urls.push(url);
    }); //PR forEach

    return Promise.all(urls.map(grabContent)).then(response => {
      return obj;
    });

  }; //gitHubNotifCount




  window.GitHubNotify.filterBody = function(array) {
    return _.filter(array, function(pr) {
      if (escape(pr.body).indexOf("%3Awhite_check_mark%3A") > -1 || escape(pr.body).indexOf("%3Afacepunch%3A") > -1 || escape(pr.body).indexOf("%u2705") > -1) {
        return true;
      }
    });
  };


  window.GitHubNotify.lookup = (array, string) => {
    let passBack;
    array.some(function(value) {
      if (string.indexOf(value) >= 0) {
        passBack = value;
      }
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
