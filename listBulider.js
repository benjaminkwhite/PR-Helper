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

    chrome.extension.sendMessage({ message: 'refresh' }, function(response) {
    });


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

          color = '#3D7ADD';
          if (pullLength > 7) {
            color = '#ff0000';
          }

          badging(pullLength.toString(), color, 'PR Helper');

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

(function() {
  function addButton() {
    loc = window.location.href;

    var doAddButton = function() {
      loc = window.location.href;
      var user_links = document.getElementById('user-links');
      var vcard_username = document.getElementsByClassName('vcard-username')[0].innerHTML;

      localStorage.setItem('teamMates', vcard_username);

      if (user_links) {
        button_embed = '<li class="header-nav-item dropdown js-menu-container"><a class="header-nav-link name tooltipped tooltipped-sw js-menu-target" href="#" aria-label="PR Helper" data-ga-click="Header, show menu, icon:avatar" aria-expanded="false"><svg aria-hidden="true" class="octicon octicon-git-pull-request" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path d="M11 11.28V5c-.03-.78-.34-1.47-.94-2.06C9.46 2.35 8.78 2.03 8 2H7V0L4 3l3 3V4h1c.27.02.48.11.69.31.21.2.3.42.31.69v6.28A1.993 1.993 0 0 0 10 15a1.993 1.993 0 0 0 1-3.72zm-1 2.92c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zM4 3c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v6.56A1.993 1.993 0 0 0 2 15a1.993 1.993 0 0 0 1-3.72V4.72c.59-.34 1-.98 1-1.72zm-.8 10c0 .66-.55 1.2-1.2 1.2-.65 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z"></path></svg><span class="dropdown-caret"></span></a><div class="dropdown-menu-content js-menu-content" aria-hidden="true" aria-expanded="false"><div class="dropdown-menu dropdown-menu-sw"><a class="dropdown-item" href="/new" data-ga-click="Header, create new repository">You</a><a class="dropdown-item" href="/new/import" data-ga-click="Header, import a repository">add</a><a class="dropdown-item" href="/organizations/new" data-ga-click="Header, create new organization">remove</a></div></div></li>';
        user_links.innerHTML = button_embed + user_links.innerHTML;
      }
    }

    if (/^https?\:\/\/github\.com\/.*/.test(loc)) {
      window.setTimeout(function() { doAddButton(); }, 1000);
    }
  }

  addButton();
})();
