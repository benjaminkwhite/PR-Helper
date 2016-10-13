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

  function badging(text, color, title) {
    chrome.browserAction.setBadgeText({ text });
    chrome.browserAction.setBadgeBackgroundColor({ color });
    chrome.browserAction.setTitle({ title });
  }

  function Fetcher() {

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {

        message = request.message
        message = message.split(",");

        if (message[0] === "getUrl") {
          url = localStorage.getItem('githubHost') || {};
          sendResponse({ lookup: url });
        }

        if (message[0] === "who") {
          teamMates = localStorage.getItem('teamMates') || {};
          if (teamMates.length > 0) {
            teamMates = teamMates.split(",");
            found = _(teamMates).contains(message[1]);
            sendResponse({ lookup: found });
          } else {
            sendResponse({ lookup: 'none' });
          };
        }

        if (message[0] === "isMe") {
          me = localStorage.getItem('me') || {};
          if (me.length > 0) {
            me = me.split(",");
            found = _(me).contains(message[1]);
            sendResponse({ lookup: found });
          } else {
            sendResponse({ lookup: 'none' });
          };
        }

        if (message[0] === "setMe") {
          localStorage.setItem('me', message[1]);
          sendResponse({ lookup: 'done' });
        }

        if (message[0] === "setTeamMates") {
          teamMates = localStorage.getItem('teamMates') || {};

          if (teamMates.length > 0) {
            teamMates = [teamMates];
            teamMates.push(message[1]);
          } else {
            teamMates = message[1]
          };

          localStorage.setItem('teamMates', teamMates);

          sendResponse({ lookup: 'done' });
        }

        if (message[0] === "removeTeamMates") {
          teamMates = localStorage.getItem('teamMates') || {};
          teamMates = teamMates.split(",");

          var filtered;
          filtered = _(teamMates).filter(function(pr) {
            return !_([message[1]]).contains(pr);

          });
          localStorage.setItem('teamMates', filtered);
          sendResponse({ lookup: 'done' });
        }

        if (message[0] === "refresh") {
          this.fetch;
          sendResponse({ lookup: 'ok' });
        }

      }
    );
  }

  Fetcher.prototype.fetch = function(port) {
    console.log('fetch');
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
        repos = localStorage.getItem('repos') || {};
        if (repos.length > 0) {
          repos = JSON.parse(repos);
        };

        hiddenPRs = localStorage.getItem('hiddenPRs') || [];
        if (hiddenPRs.length > 0) {
          hiddenPRs = JSON.parse(hiddenPRs);
        };
        
        totalPR = _(repos).reduce(function(prev, prs) {
          var filtered;
          filtered = _(prs).filter(function(pr) {
            return !_(hiddenPRs).contains(pr.id);
          });
          return prev + filtered.length;
        }, 0);

        if (totalPR > 0) {

          color = '#3D7ADD';
          if (totalPR > 7) {
            color = '#ff0000';
          }

          badging(totalPR.toString(), color, 'PR Helper');

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

interval = 10000;

setInterval(function() {
  return fetcher.fetch();
}, interval);
