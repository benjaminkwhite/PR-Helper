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
  GithubMon.prototype.myId = [];
  GithubMon.prototype.teamMates = [];

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
    chrome.extension.sendMessage({ message: 'refresh' }, function(response) {});
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
    this.myId = localStorage.getItem('myId') || [];
    this.teamMates = localStorage.getItem('teamMates') || [];
    return this.repositoryJSON = JSON.parse(localStorage.getItem('repos'));
  };

  GithubMon.prototype.populateRepoList = function() {
    var html = "";

console.log(this.repositories.length)
    if (this.repositories.length > 0) {
      $('.empty').hide();

console.log(this.repositoryJSON)
      html = _(this.repositoryJSON).map((function(_this) {
        return function(pullRequests, repo) {
          var pullRequestsHTML;

          pullRequests = _(pullRequests).filter(function(pr) {
            return !_(_this.hiddenPRs).contains(pr.id);
          });
console.log(pullRequests)

          if (_this.teamMates.length > 0) {
            filtered = _this.teamMates.split(",");

            if (_this.myId.length > 0) {
              myId = _this.myId.split(",");
              filtered = filtered.concat(myId);
            };

            pullRequests = _(pullRequests).filter(function(pr) {
              return _(filtered).contains(pr.user.login);
            });
          };

console.log(pullRequests.length)
          if (pullRequests.length > 0) {

            var commentsRequests = JSON.parse(localStorage.getItem('comments'));


            issue_url = _.pluck(pullRequests, 'issue_url');

            filteredComments = _(commentsRequests).filter(function(pr) {
              return _(issue_url).contains(pr.issue_url);
            });

            filterBody = function(array) {
              return _.filter(array, function(pr) {
                if (escape(pr.body).indexOf("%3Awhite_check_mark%3A") > -1 || escape(pr.body).indexOf("%3Afacepunch%3A") > -1 || escape(pr.body).indexOf("%u2705") > -1) {
                  return true;
                }
              });
            }

            var mySubArray = _.uniq(filterBody(filteredComments), function(value) {
              return value.issue_url;
            });


            var pending = mySubArray.length;



            $('.version').html('Active <strong>' + (pullRequests.length - pending) + '</strong><br>Pending <strong>' + pending + '</strong>');

            color = '#3D7ADD';
            if ((pullRequests.length - pending) > 7) {
              color = '#ff0000';
            }

            badging((pullRequests.length - pending).toString(), color, 'PR Helper');

            pullRequestsHTML = _(pullRequests).map(function(pr) {

              issue_url = pr.issue_url


              filtered = _(commentsRequests).filter(function(prc) {
                return _([prc.issue_url]).contains(issue_url);
              });


              var check = ["%uD83D%uDC4D", "%3Apackage%3A", "%3A+1%3A", "%3Awhite_check_mark%3A", "%u2705", "%3Afacepunch%3A", "%3Arepeat%3A", "%uD83D%uDD01"]
              var thumbIcon, checkIcon, repeatIcon, message, iconString

              thumbIcon = 0
              checkIcon = 0
              repeatIcon = 0
              iconString = ""

              _(filtered).map(function(prc) {
                message = escape(prc.body)

                _(check).map(function(icon) {
                  if (message.indexOf(icon) > -1 && icon == "%uD83D%uDC4D" || message.indexOf(icon) > -1 && icon == "%3A+1%3A") {
                    thumbIcon++
                    if (thumbIcon < 3) {
                      iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44d.png" alt="" class="icon"/>'
                    }
                  }
                  if (message.indexOf(icon) > -1 && icon == "%3Afacepunch%3A") {
                    checkIcon++
                    if (checkIcon < 2) {
                      iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/2705.png" alt="" class="icon"/>'
                    }
                  }
                  if (message.indexOf(icon) > -1 && icon == "%3Awhite_check_mark%3A" || message.indexOf(icon) > -1 && icon == "%u2705") {
                    checkIcon++
                    if (checkIcon < 2) {
                      iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/2705.png" alt="" class="icon"/>'
                    }
                  }
                  if (message.indexOf(icon) > -1 && icon == "%3Apackage%3A") {
                    iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f4e6.png" alt="" class="icon"/>'
                  }
                  if (message.indexOf(icon) > -1 && icon == "%3Arepeat%3A" || message.indexOf(icon) > -1 && icon == "%uD83D%uDD01") {
                    repeatIcon++
                    thumbIcon = 0
                    checkIcon = 0
                    if (checkIcon < 2) {
                      iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f501.png" alt="" class="icon"/>'
                    }
                  }
                });
              });

              var age = (moment(new Date()).diff(moment.utc(pr.created_at), 'hours'))
              switch (true) {
                case (age <= 20):
                  face = '<img src="https://assets.github.corp.achievers.com/images/icons/emoji/unicode/1f476.png" alt="" class="icon_small"/>';
                  break;
                case (age <= 34):
                  face = '<img src="https://assets.github.corp.achievers.com/images/icons/emoji/unicode/1f466.png" alt="" class="icon_small"/>';
                  break;
                case (age <= 59):
                  face = '<img src="https://assets.github.corp.achievers.com/images/icons/emoji/unicode/1f468.png" alt="" class="icon_small"/>';
                  break;
                default:
                  face = '<img src="https://assets.github.corp.achievers.com/images/icons/emoji/unicode/1f474.png" alt="" class="icon_small"/>';
                  break;
              }

console.log(pr.id)
console.log(_this.pullRequestTemplate)
              return _.template(_this.pullRequestTemplate, {
                id: pr.id,
                title: pr.title,
                html_url: pr.html_url,
                user: pr.user.login,
                user_avatar: pr.user.avatar_url,
                user_url: pr.user.html_url,
                git_host: _this.githubHost,
                iconString: iconString,
                age: face,
                created_at: moment.utc(pr.created_at).fromNow()
              });
            });
          } else {
            pullRequestsHTML = ["<li><p>No PR's</p></li>"];
          }
console.log(_this.repositoryTemplate)
          return _.template(_this.repositoryTemplate, {
            name: repo,
            git_host: _this.githubHost,
            pullRequests: pullRequestsHTML.join('')
          });
        };
      })(this));

console.log(html.join(''))

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
    return $('#options').on('click', (function(_this) {
      return function() {
        var optionsUrl = "chrome://extensions/?options=" + chrome.runtime.id
        chrome.tabs.query({ url: optionsUrl }, function(tabs) {
          if (tabs.length) {
            chrome.tabs.update(tabs[0].id, { active: true });
          } else {
            chrome.tabs.create({ url: optionsUrl });
          }
        });
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

});
