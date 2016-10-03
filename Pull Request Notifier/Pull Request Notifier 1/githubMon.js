var GithubMon,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    console.log('11111');
GithubMon = (function() {
  GithubMon.prototype.repositoryTemplate = null;

  GithubMon.prototype.pullRequestTemplate = null;

  GithubMon.prototype.repositoryJSON = null;

  GithubMon.prototype.repositories = [];

  GithubMon.prototype.hiddenPRs = [];


    console.log('22222');

  function GithubMon(url) {

    console.log('33333');

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
    this.port = chrome.extension.connect({
      name: 'connection'
    });
    this.port.onMessage.addListener((function(_this) {
      return function(msg) {
        if (msg.success) {
          return _this.render();
        } else {
          debugger;
        }
      };
    })(this));
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

    console.log('44444');
    var manifest;
    manifest = chrome.runtime.getManifest();
    return $('.version').text(manifest.version);
  };

  GithubMon.prototype.render = function() {
    this.fetchRepositories();
    this.fetchPullRequests();
    this.populateRepoList();
    return this.bindEvents();
  };

  GithubMon.prototype.fetchRepositories = function() {

    console.log('55555');
    return this.repositories = JSON.parse(localStorage.getItem('repositories')) || [];
  };

  GithubMon.prototype.fetchPullRequests = function() {

    console.log('66666');
    this.hiddenPRs = JSON.parse(localStorage.getItem('hiddenPRs')) || [];
    return this.repositoryJSON = JSON.parse(localStorage.getItem('repos'));
  };

  GithubMon.prototype.populateRepoList = function() {
    var html;
    console.log('77777');
    if (this.repositories.length > 0) {
      $('.empty').hide();
      html = _(this.repositoryJSON).map((function(_this) {
        return function(pullRequests, repo) {
          var pullRequestsHTML;
          pullRequests = _(pullRequests).filter(function(pr) {
            return !_(_this.hiddenPRs).contains(pr.id);
          });
          if (pullRequests.length > 0) {
            pullRequestsHTML = _(pullRequests).map(function(pr) {
              return _.template(_this.pullRequestTemplate, {
                id: pr.id,
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
      $('#repositories').html('');
      return $('.empty').show();
    }
  };

  GithubMon.prototype.bindEvents = function() {

    console.log('88888');
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
    console.log('99999');
    $('.add-repo .title').text(repository);
    $('.add-repo').show();
    return $('.add-repo .add').on('click', this.addCurrentRepo);
  };

  GithubMon.prototype.hidePrompt = function() {
    console.log('aaaaa');
    return $('.add-repo').hide();
  };

  GithubMon.prototype.addCurrentRepo = function() {
    console.log('bbbbb');
    this.repositories.push(this.currentRepo);
    localStorage.setItem('repositories', JSON.stringify(this.repositories));
    this.triggerFetch();
    return this.hidePrompt();
  };

  GithubMon.prototype.hidePR = function(event) {

    console.log('ccccc');
    var id;
    id = $(event.target).closest('li').data('id');
    this.hiddenPRs.push(id);
    localStorage.setItem('hiddenPRs', JSON.stringify(this.hiddenPRs));
    return this.render();
  };

  GithubMon.prototype.removeRepository = function(event) {

    console.log('ddddd');

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

    console.log('eeee');
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
    return this.port.postMessage({
      refresh: true
    });
  };

  return GithubMon;

})();

$(function() {
  // return chrome.tabs.getSelected(null, function(tab) {
  //   var mon;
  //   return mon = new GithubMon(tab.url);
  // });
});
