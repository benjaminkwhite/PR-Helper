var GithubMon,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

//    alert('11111');
GithubMon = (function() {
  GithubMon.prototype.repositoryTemplate = null;

  GithubMon.prototype.pullRequestTemplate = null;

  GithubMon.prototype.repositoryJSON = null;

  GithubMon.prototype.repositories = [];

  GithubMon.prototype.hiddenPRs = [];


//    alert('22222');

  function GithubMon(url) {

//    alert('33333');

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

//    alert('44444');
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
//    alert('55555');
//    alert(localStorage.getItem('repositories'));
    return this.repositories = JSON.parse(localStorage.getItem('repositories')) || [];
  };

  GithubMon.prototype.fetchPullRequests = function() {
//    alert('66666');
    this.hiddenPRs = JSON.parse(localStorage.getItem('hiddenPRs')) || [];
    return this.repositoryJSON = JSON.parse(localStorage.getItem('repos'));
  };

  GithubMon.prototype.populateRepoList = function() {
    var html = "not yet";
//    alert('77778');
    if (this.repositories.length > 0) {
      $('.empty').hide();

console.log('7a');


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
console.log('7g');
      return $('#repositories').html(html.join(''));
    } else {
          alert('7e');
      $('#repositories').html('shit');
      return $('.empty').show();
    }
  };

  GithubMon.prototype.bindEvents = function() {
//    alert('88888');
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
    alert('99999');
    $('.add-repo .title').text(repository);
    $('.add-repo').show();
    return $('.add-repo .add').on('click', this.addCurrentRepo);
  };

  GithubMon.prototype.hidePrompt = function() {
//    alert('aaaaa');
    return $('.add-repo').hide();
  };

  GithubMon.prototype.addCurrentRepo = function() {
    alert('bbbbb');
    this.repositories.push(this.currentRepo);
    localStorage.setItem('repositories', JSON.stringify(this.repositories));
    this.triggerFetch();
    return this.hidePrompt();
  };

  GithubMon.prototype.hidePR = function(event) {

    alert('ccccc');
    var id;
    id = $(event.target).closest('li').data('id');
    this.hiddenPRs.push(id);
    localStorage.setItem('hiddenPRs', JSON.stringify(this.hiddenPRs));
    return this.render();
  };

  GithubMon.prototype.removeRepository = function(event) {

    alert('ddddd');

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

//    alert('eeee');
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
