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

  function badging(text, color, title) {
    chrome.browserAction.setBadgeText({ text });
    chrome.browserAction.setBadgeBackgroundColor({ color });
    chrome.browserAction.setTitle({ title });
  }

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
    this.accessToken = localStorage.getItem('accessToken');
    this.githubHost = localStorage.getItem('githubHost') ? localStorage.getItem('githubHost') : 'https://github.com';
    if (this.accessToken) {
      this.render();
    } else {
      this.renderHelpView();
    }
    this.promptAddRepo();
    this;
  }

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
    this.teamMates = localStorage.getItem('teamMates');
    return this.repositoryJSON = JSON.parse(localStorage.getItem('repos'));
  };

  GithubMon.prototype.populateRepoList = function() {
    var html = "";
    if (this.repositories.length > 0) {
      $('.empty').hide();
      html = _(this.repositoryJSON).map((function(_this) {
        return function(pullRequests, repo) {
          var pullRequestsHTML;

          pullRequests = _(pullRequests).filter(function(pr) {
            return !_(_this.hiddenPRs).contains(pr.id);
          });

          if (_this.teamMates.length > 0) {
            teamMates = _this.teamMates.split(",");

            pullRequests = _(pullRequests).filter(function(pr) {
              return _(teamMates).contains(pr.user.login);
            });
          };

          if (pullRequests.length > 0) {

            pullLength = pullRequests.length
            $('.version').text(pullLength);

            switch (true) {
              case (pullLength > 7):
                text = '#ff0000';
                break;
              default:
                text = '#3D7ADD';
                break;
            }

            badging(pullLength.toString(), text, 'PR Helper');
            pullRequestsHTML = _(pullRequests).map(function(pr) {

              issue_url = pr.issue_url

              commentsRequests = JSON.parse(localStorage.getItem('comments'));

              filtered = _(commentsRequests).filter(function(prc) {
                return _([prc.issue_url]).contains(issue_url);
              });

              thumb = _(filtered).filter(function(prc) {
                fff = prc.body;
                return fff.indexOf(":+1:") > -1;
              });

              check = _(filtered).filter(function(prc) {
                fff = prc.body;
                return fff.indexOf(":white_check_mark:") > -1;
              });

              return _.template(_this.pullRequestTemplate, {
                id: pr.id,
                title: pr.title,
                html_url: pr.html_url,
                user: pr.user.login,
                user_avatar: pr.user.avatar_url,
                user_url: pr.user.html_url,
                git_host: _this.githubHost,
                thumb: thumb.length,
                check: check.length,
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
        }
      };
    })(this));
  };

  return GithubMon;

})();

$(function() {
  return chrome.tabs.getSelected(null, function(tab) {
    var mon;
    return mon = new GithubMon(tab.url);
  }); //  var mon;
  //  return mon = new GithubMon('https://github.corp.achievers.com/BE/PFA/pulls');

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

  function Fetcher() {
    
  }

  Fetcher.prototype.fetch = function(port) {
    var dfds, dfds2;
    if (port == null) {
      port = null;
    }
    this.totalPR = 0;
    this.accessToken = localStorage.getItem('accessToken');
    this.apihost = localStorage.getItem('githubApiHost') ? localStorage.getItem('githubApiHost') : 'https://api.github.com';
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
            var dfds2Comments = [];

            _(commentsData).each((function(self) {
              return function(commentsData) {
                return dfds2.push($.ajax({
                  type: 'get',
                  url: commentsData.url + "?access_token=" + _this.accessToken,
                  success: function(data) {

                    dfds2Comments = dfds2Comments.concat(data);
                    return localStorage.setItem('comments', JSON.stringify(dfds2Comments))
                  },
                  error: function() {
                    debugger;
                  }
                }));
              };
            })(this));
          }, 0);

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

setInterval(function() {
  return fetcher.fetch();
}, interval);
