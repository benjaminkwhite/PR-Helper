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
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {

        message = request.message
        message = message.split(",");

        if (message[0] === "who"){ 
          teamMates = localStorage.getItem('teamMates') || {};
          teamMates = teamMates.split(",");

          found = _(teamMates).contains(message[1]);
          sendResponse({farewell: found});

console.log(message[1]); 
console.log(teamMates); 
console.log(found); 
          
        }
      }
    );
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
