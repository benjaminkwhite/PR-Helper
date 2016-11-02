/*jshint esversion: 6 */

(() => {
  'use strict';

  window.listBuilder = (() => {
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



  function badging(text, color, title) {
    chrome.browserAction.setBadgeText({ text });
    chrome.browserAction.setBadgeBackgroundColor({ color });
    chrome.browserAction.setTitle({ title });
  }

  const accessToken = window.listBuilder.settings.get('oauthToken');
  const repositoryTemplate = $('#repository-row').html();
  const pullRequestTemplate = $('#pull-request-row').html();

  console.log(repositoryTemplate);

  let githubHost = localStorage.getItem('githubHost') ? localStorage.getItem('githubHost') : 'https://github.com';

  var selectedTab, repositories, hiddenPRs, myId, teamMates, repositoryJSON, issue_url, filteredComments, filterBody, color, filtered, face;


  window.listBuilder.render = () => {
    chrome.extension.sendMessage({ message: 'refresh' }, function(response) {});

    repositories = JSON.parse(window.listBuilder.settings.get('repositories')) || [];

    hiddenPRs = JSON.parse(localStorage.getItem('hiddenPRs')) || [];
    myId = localStorage.getItem('myId') || [];
    teamMates = localStorage.getItem('teamMates') || [];
    repositoryJSON = JSON.parse(localStorage.getItem('repos'));


    window.listBuilder.populateRepoList();
    window.listBuilder.bindEvents();


  };


  window.listBuilder.populateRepoList = () => {
    var html = "";
    if (repositories.length > 0) {
      $('.empty').hide();
      html = _(repositoryJSON).map((function(_this) {
        return function(pullRequests, repo) {
          var pullRequestsHTML;

          pullRequests = _(pullRequests).filter(function(pr) {
            return !_(hiddenPRs).contains(pr.id);
          });

          if (teamMates.length > 0) {
            filtered = teamMates.split(",");

            if (myId.length > 0) {
              myId = myId.split(",");
              filtered = filtered.concat(myId);
            }

            pullRequests = _(pullRequests).filter(function(pr) {
              return _(filtered).contains(pr.user.login);
            });
          }

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
            };

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

              issue_url = pr.issue_url;


              filtered = _(commentsRequests).filter(function(prc) {
                return _([prc.issue_url]).contains(issue_url);
              });


              var check = ["%uD83D%uDC4D", "%3Apackage%3A", "%3A+1%3A", "%3Awhite_check_mark%3A", "%u2705", "%3Afacepunch%3A", "%3Arepeat%3A", "%uD83D%uDD01"];
              var thumbIcon, checkIcon, repeatIcon, message, iconString;

              thumbIcon = 0;
              checkIcon = 0;
              repeatIcon = 0;
              iconString = "";

              _(filtered).map(function(prc) {
                message = escape(prc.body);

                _(check).map(function(icon) {
                  if (message.indexOf(icon) > -1 && icon == "%uD83D%uDC4D" || message.indexOf(icon) > -1 && icon == "%3A+1%3A") {
                    thumbIcon++;
                    if (thumbIcon < 3) {
                      iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44d.png" alt="" class="icon"/>';
                    }
                  }
                  if (message.indexOf(icon) > -1 && icon == "%3Afacepunch%3A") {
                    checkIcon++;
                    if (checkIcon < 2) {
                      iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/2705.png" alt="" class="icon"/>';
                    }
                  }
                  if (message.indexOf(icon) > -1 && icon == "%3Awhite_check_mark%3A" || message.indexOf(icon) > -1 && icon == "%u2705") {
                    checkIcon++;
                    if (checkIcon < 2) {
                      iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/2705.png" alt="" class="icon"/>';
                    }
                  }
                  if (message.indexOf(icon) > -1 && icon == "%3Apackage%3A") {
                    iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f4e6.png" alt="" class="icon"/>';
                  }
                  if (message.indexOf(icon) > -1 && icon == "%3Arepeat%3A" || message.indexOf(icon) > -1 && icon == "%uD83D%uDD01") {
                    repeatIcon++;
                    thumbIcon = 0;
                    checkIcon = 0;
                    if (checkIcon < 2) {
                      iconString = iconString + '<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f501.png" alt="" class="icon"/>';
                    }
                  }
                });
              });

              var age = (moment(new Date()).diff(moment.utc(pr.created_at), 'hours'));
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


  window.listBuilder.bindEvents = () => {
    $('.hide').on('click', window.listBuilder.hidePR);
    return $('.remove').on('click', window.listBuilder.removeRepository);
  };

  window.listBuilder.promptAddRepo = () => {
    var match, regex, regexExpression;

    regexExpression = "^" + this.githubHost + "\\/([\\w-\\.]+\\/[\\w-\\.]+)";
    regex = new RegExp(regexExpression);
    if (match === selectedTab.match(regex)) {
      let currentRepo = match[1];
      if (!_(repositories).contains(currentRepo)) {
        return window.listBuilder.showPrompt(currentRepo);
      }
    } else {
      return window.listBuilder.hidePrompt();
    }
  };

  window.listBuilder.showPrompt = repository => {
    $('.add-repo .title').text(repository);
    $('.add-repo').show();
    return $('.add-repo .add').on('click', this.addCurrentRepo);
  };

  window.listBuilder.hidePrompt = function() {
    return $('.add-repo').hide();
  };

  window.listBuilder.addCurrentRepo = () => {
    repositories.push(currentRepo);
    localStorage.setItem('repositories', JSON.stringify(repositories));
    return window.listBuilder.hidePrompt();
  };

  window.listBuilder.hidePR = event => {
    var id;
    id = $(event.target).closest('li').data('id');
    hiddenPRs.push(id);
    localStorage.setItem('hiddenPRs', JSON.stringify(hiddenPRs));
    return window.listBuilder.render();
  };

  window.listBuilder.removeRepository = event => {
    var repo;
    repo = $(event.target).closest('li').data('id');
    repositories = _(repositories).without(repo);
    localStorage.setItem('repositories', JSON.stringify(repositories));
    repositoryJSON = JSON.parse(localStorage.getItem('repos'));
    delete repositoryJSON[repo];
    localStorage.setItem('repos', JSON.stringify(repositoryJSON));
    window.listBuilder.promptAddRepo();
  };

  window.listBuilder.renderHelpView = () => {
    $('.welcome').show();
    return $('#options').on('click', (function(_this) {
      return function() {
        var optionsUrl = "chrome://extensions/?options=" + chrome.runtime.id;
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



  chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
    window.listBuilder.getSelectedTab(tabs[0].url);
  });

  window.listBuilder.getSelectedTab = url => {
    selectedTab = url;

    window.listBuilder.promptAddRepo();
  };


  if (accessToken) {
    window.listBuilder.render();
  } else {
    window.listBuilder.renderHelpView();
  }


})();
