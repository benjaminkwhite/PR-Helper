var GithubMon,
  bind = function(fn, me) {
    return function() {
      return fn.apply(me, arguments);
    };
  };

GithubMon = (function() {
  GithubMon.prototype.repositoryTemplate = null;

  GithubMon.prototype.pullRequestTemplate = null;

  GithubMon.prototype.repositoryJSON = null;

  GithubMon.prototype.repositories = [];

  GithubMon.prototype.hiddenPRs = [];


  function GithubMon(url) {
    this.removeRepository = bind(this.removeRepository, this);
    this.hidePR = bind(this.hidePR, this);
    this.addCurrentRepo = bind(this.addCurrentRepo, this);
    this.bindEvents = bind(this.bindEvents, this);
    this.fetchPullRequests = bind(this.fetchPullRequests, this);
    this.fetchRepositories = bind(this.fetchRepositories, this);
    this.url = url.replace(/[\?#].*/, '');
    _.templateSettings = {
      interpolate: /\{\{(.+?)\}\}/g
    };
    this.repositoryTemplate = $('#repository-row').html();
    this.pullRequestTemplate = $('#pull-request-row').html();
    //    this.port = chrome.extension.connect({
    //      name: 'connection'
    //    });
    //    this.port.onMessage.addListener((function(_this) {
    //      return function(msg) {
    //        if (msg.success) {
    //          return _this.render();
    //        } else {
    //          debugger;
    //        }
    //      };
    //    })(this));
    this.renderVersion();
    this.accessToken = localStorage.getItem('accessToken');
    this.githubHost = localStorage.getItem('githubHost') ? localStorage.getItem('githubHost') : 'https://github.com';
    if (this.accessToken) {
      this.render();
      this.triggerFetch();
    } else {
      this.renderHelpView();
    }
    this.promptAddRepo();
    this;
  }

  GithubMon.prototype.renderVersion = function() {
    //    var manifest;
    //    manifest = chrome.runtime.getManifest();
    //    return $('.version').text(manifest.version);
  };

  GithubMon.prototype.render = function() {
    this.fetchRepositories();
    this.fetchPullRequests();
    this.populateRepoList();
    return this.bindEvents();
  };

  GithubMon.prototype.fetchRepositories = function() {
    return this.repositories = JSON.parse(localStorage.getItem('repositories')) || [];
  };

  GithubMon.prototype.fetchPullRequests = function() {
    this.hiddenPRs = JSON.parse(localStorage.getItem('hiddenPRs')) || [];
    return this.repositoryJSON = JSON.parse(localStorage.getItem('repos'));
  };

  GithubMon.prototype.populateRepoList = function() {
    var html = "not yet";
    if (this.repositories.length > 0) {
      $('.empty').hide();

      //        var hiddenPRs, repos, totalPR;
      //        repos = JSON.parse(localStorage.getItem('repos')) || {};
      //        hiddenPRs = JSON.parse(localStorage.getItem('hiddenPRs')) || [];
      //        totalPR = _(repos).reduce(function(prev, prs) {
      //          var filtered;
      //          filtered = _(prs).filter(function(pr) {
      //            return !_(hiddenPRs).contains(pr.id);
      //          });
      //          return filtered.length;
      //        }, 0);
      //        console.log(totalPR)

      html = _(this.repositoryJSON).map((function(_this) {
        return function(pullRequests, repo) {
          var pullRequestsHTML;
          pullRequests = _(pullRequests).filter(function(pr) {
            return !_(_this.hiddenPRs).contains(pr.id);
          });

          if (pullRequests.length > 0) {
            pullRequestsHTML = _(pullRequests).map(function(pr) {
id = pr.id

//commentsRequests = JSON.parse(localStorage.getItem('comments'));
//commentsHTML = _(commentsRequests).map(function(pr) {
//console.log(pr.title);
//});
              return _.template(_this.pullRequestTemplate, {
                id: id,
                title: pr.title,
                html_url: pr.html_url,
                user: pr.user.login,
                user_avatar: pr.user.avatar_url,
                user_url: pr.user.html_url,
                git_host: _this.githubHost,
                created_at: moment.utc(pr.created_at).fromNow()
              });
            });
          } else {
            pullRequestsHTML = ["<li><p>No PR's</p></li>"];
          }
          return _.template(_this.repositoryTemplate, {
            name: repo,
            git_host: _this.githubHost,
            pullRequests: pullRequestsHTML.join('')
          });
        };
      })(this));

      return $('#repositories').html(html.join(''));
    } else {
      $('#repositories').html('shit');
      return $('.empty').show();
    }
  };

  GithubMon.prototype.bindEvents = function() {
    $('.hide').on('click', this.hidePR);
    return $('.remove').on('click', this.removeRepository);
  };

  GithubMon.prototype.promptAddRepo = function() {
    var match, regex, regexExpression;
    regexExpression = "^" + this.githubHost + "\\/([\\w-\\.]+\\/[\\w-\\.]+)";
    regex = new RegExp(regexExpression);
    if (match = this.url.match(regex)) {
      this.currentRepo = match[1];
      if (!_(this.repositories).contains(this.currentRepo)) {
        return this.showPrompt(this.currentRepo);
      }
    } else {
      return this.hidePrompt();
    }
  };

  GithubMon.prototype.showPrompt = function(repository) {
    $('.add-repo .title').text(repository);
    $('.add-repo').show();
    return $('.add-repo .add').on('click', this.addCurrentRepo);
  };

  GithubMon.prototype.hidePrompt = function() {
    return $('.add-repo').hide();
  };

  GithubMon.prototype.addCurrentRepo = function() {
    this.repositories.push(this.currentRepo);
    localStorage.setItem('repositories', JSON.stringify(this.repositories));
    this.triggerFetch();
    return this.hidePrompt();
  };

  GithubMon.prototype.hidePR = function(event) {
    var id;
    id = $(event.target).closest('li').data('id');
    this.hiddenPRs.push(id);
    localStorage.setItem('hiddenPRs', JSON.stringify(this.hiddenPRs));
    return this.render();
  };

  GithubMon.prototype.removeRepository = function(event) {
    var repo;
    repo = $(event.target).closest('li').data('id');
    this.repositories = _(this.repositories).without(repo);
    localStorage.setItem('repositories', JSON.stringify(this.repositories));
    this.repositoryJSON = JSON.parse(localStorage.getItem('repos'));
    delete this.repositoryJSON[repo];
    localStorage.setItem('repos', JSON.stringify(this.repositoryJSON));
    this.promptAddRepo();
    return this.triggerFetch();
  };

  GithubMon.prototype.renderHelpView = function() {
    $('.welcome').show();
    return $('.save-token').on('click', (function(_this) {
      return function() {
        var at, gah, gh;
        if (at = $('#access-token').val()) {
          localStorage.setItem('accessToken', at);
          if (gh = $('#github-host').val()) {
            localStorage.setItem('githubHost', gh);
          }
          if (gah = $('#github-apihost').val()) {
            localStorage.setItem('githubApiHost', gah);
          }
          $('.welcome').hide();
          return _this.triggerFetch();
        }
      };
    })(this));
  };

  GithubMon.prototype.triggerFetch = function() {
    //    return this.port.postMessage({
    //      refresh: true
    //    });
  };

  return GithubMon;

})();

$(function() {
  var mon;
  return mon = new GithubMon('https://github.com/benjaminkwhite/PR-Helper');
});









var Fetcher, fetcher, interval;

$.ajaxSetup({
  crossDomain: true,
  dataType: 'json'
});

Fetcher = (function() {
  Fetcher.prototype.totalPR = 0;

  Fetcher.prototype.accessToken = null;

  Fetcher.prototype.repositories = [];

  Fetcher.prototype.port = null;

  var msg;

  function Fetcher() {
    //    this.port = chrome.extension.connect({
    //      name: 'connection'
    //    });
    //    chrome.extension.onConnect.addListener((function(_this) {
    //      return function(port) {
    //        return port.onMessage.addListener(function(msg) {
    //          console.log(msg);
    //          if (msg.refresh != null) {
    //            return _this.fetch(port);
    //          }
    //        });
    //      };
    //    })(this));
  }

  Fetcher.prototype.fetch = function(port) {
    var dfds, dfds2;
    if (port == null) {
      port = null;
    }
    this.totalPR = 0;
    this.accessToken = localStorage.getItem('accessToken');
    this.apihost = 'https://api.github.com';
    this.repositories = JSON.parse(localStorage.getItem('repositories'));

    dfds = [];
    _(this.repositories).each((function(_this) {
      return function(repo) {
        return dfds.push($.ajax({
          type: 'get',
          url: _this.apihost + ("/repos/" + repo + "/pulls?access_token=" + _this.accessToken),
          success: function(data) {
            return _this.store(repo, data);
          },
          error: function() {
            debugger;
          }
        }));
      };
    })(this));
    return $.when.apply($, dfds).done((function(_this) {
      var self = _this
      return function() {
        var hiddenPRs, repos, totalPR;
        repos = JSON.parse(localStorage.getItem('repos')) || {};
        hiddenPRs = JSON.parse(localStorage.getItem('hiddenPRs')) || [];
        totalPR = _(repos).reduce(function(prev, prs) {
          var filtered;
          filtered = _(prs).filter(function(pr) {
            return !_(hiddenPRs).contains(pr.id);
          });
          return prev + filtered.length;
        }, 0);
        if (totalPR > 0) {
          comments = _(repos).reduce(function(prev, prs) {

            commentsData = _(prs).map(function(pr) {
              return {
                id: pr.id,
                url: pr.comments_url
              };

            });


            dfds2 = [];

            var temp = [];
            var test = [];

var shit;
            _(commentsData).each((function(self) {
              return function(commentsData) {
                return dfds2.push($.ajax({
                  type: 'get',
                  url: commentsData.url + "?access_token=" + _this.accessToken,
                  success: function(data) {


 test = $.extend( test, data );

                    return localStorage.setItem('comments', JSON.stringify(test))
                  },
                  error: function() {
                    debugger;
                  }
                }));
              };
            })(this));
          }, 0);
          //          chrome.browserAction.setBadgeText({
          //            text: "" + totalPR
          //          });
        } else {
          //          chrome.browserAction.setBadgeText({
          //            text: ''
          //          });
        }
        if (port) {
          return port.postMessage({
            success: true
          });
        }
      };
    })(this));
  };

  Fetcher.prototype.store = function(repo, data) {
    var repos, jsonText;
    repos = JSON.parse(localStorage.getItem('repos')) || {};
    repos[repo] = data;

    jsonText = JSON.stringify(repos);
    return localStorage.setItem('repos', jsonText);
  };

  return Fetcher;

})();

fetcher = new Fetcher;

fetcher.fetch();

interval = (localStorage.getItem('refreshRate') * 60000) || 300000;

//localStorage.clear();

setInterval(function() {
  return fetcher.fetch();
}, interval);

