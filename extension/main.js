(function() {
  'use strict';

  function render(text, color, title) {
    chrome.browserAction.setBadgeText({ text });
    chrome.browserAction.setBadgeBackgroundColor({ color });
    chrome.browserAction.setTitle({ title });
  }

  function getNotificationReasonText(reason) {
    const reasons = {
      subscribed: 'You are watching the repository',
      manual: 'You are subscribed to this thread',
      author: 'You created this thread',
      comment: 'New comment',
      mention: 'You were mentioned',
      team_mention: 'Your team was mentioned',
      state_change: 'Thread status changed',
      assign: 'You were assigned to the issue',
      default: ''
    };
    /* eslint-enable camelcase */
    return reasons[reason] || reasons.default;
  }

  function showDesktopNotifications(notifications, lastModifed) {
    const lastModifedTime = new Date(lastModifed).getTime();

    notifications.filter(notification => {
      return new Date(notification.updated_at).getTime() > lastModifedTime;
    }).forEach(notification => {
      const notificationId = `github-notifier-${notification.id}`;
      chrome.notifications.create(notificationId, {
        title: notification.subject.title,
        iconUrl: 'icon-notif-128.png',
        type: 'basic',
        message: notification.repository.full_name,
        contextMessage: getNotificationReasonText(notification.reason)
      });

      //			window.GitHubNotify.settings.set(notificationId, notification.subject.url);
    });
  }

  function checkDesktopNotifications(lastModifed) {
    const query = window.GitHubNotify.buildQuery({ perPage: 100 });
    const url = `${window.GitHubNotify.getNotificationsUrl()}?${query.join('&')}`;

    window.GitHubNotify.request(url).then(res => res.json()).then(notifications => {
      showDesktopNotifications(notifications, lastModifed);
    });
  }


  function handleLastModified(date) {
    let lastModifed = window.GitHubNotify.settings.get('lastModifed');
    const emptyLastModified = String(lastModifed) === 'null' || String(lastModifed) === 'undefined';
    lastModifed = emptyLastModified ? new Date(0) : lastModifed;

    if (date !== lastModifed) {
      window.GitHubNotify.settings.set('lastModifed', date);
      if (GitHubNotify.settings.get('showDesktopNotif') === true) {
        checkDesktopNotifications(lastModifed);
      }
    }
  }

  function handleInterval(interval) {
    let period = 1;
    let intervalSetting = parseInt(window.GitHubNotify.settings.get('interval'), 10);

    if (typeof intervalSetting !== 'number') {
      intervalSetting = 60;
    }

    if (interval !== null && interval !== intervalSetting) {
      window.GitHubNotify.settings.set('interval', interval);
      period = Math.ceil(interval / 60);
    }

    return period;
  }

  function handleError(error) {
    let symbol = '?';
    let text;

    switch (error.message) {
      case 'missing token':
        text = 'Missing access token, please create one and enter it in Options';
        symbol = 'X';
        break;
      case 'server error':
        text = 'You have to be connected to the internet';
        break;
      case 'data format error':
      case 'parse error':
        text = 'Unable to find count';
        break;
      default:
        text = 'Unknown error';
        break;
    }

    render(symbol, [166, 41, 41, 255], text);
    scheduleAlarm(1);
  }

  function handleCount(count) {
    if (count === 0) {
      return '';
    } else if (count > 9999) {
      return '∞';
    }
    return String(count);
  }

  function scheduleAlarm(period) {
    chrome.alarms.create({ when: Date.now() + 2000 + (period * 60 * 1000) });
  }


  function update() {

   var repositories = JSON.parse(window.GitHubNotify.settings.get('repositories'));


window.gitHubNotifCount(repositories).then(response => {
      	console.log(response)

        var totalPR = 0, count = 0, pending = 0
        repositories.forEach(repo => {
            count = count + response[(repo).replace(/[-/]/g, "")]
            pending = pending + response[(repo).replace(/[-/]/g, "")+'Pending']
            totalPR = (totalPR + (count - pending))
        }); //PR forEach

         const interval = response.interval;
         const lastModifed = response.lastModifed;
         const period = handleInterval(interval);

         scheduleAlarm(period);
         handleLastModified(lastModifed);

    	render(handleCount(totalPR), [65, 131, 196, 255], 'Notifier for GitHub');
    }).catch(handleError);
  }

  function openTab(url, tab) {
    window.GitHubNotify.queryPermission('tabs').then(granted => {
      if (granted) {
        const currentWindow = true;
        chrome.tabs.query({ currentWindow, url }, tabs => {
          if (tabs.length > 0) {
            const highlighted = true;
            chrome.tabs.update(tabs[0].id, { highlighted, url });
          } else if (tab && tab.url === 'chrome://newtab/') {
            chrome.tabs.update(null, { url });
          } else {
            chrome.tabs.create({ url });
          }
        });
      } else {
        chrome.tabs.create({ url });
      }
    });
  }

  chrome.alarms.create({ when: Date.now() + 2000 });
  chrome.alarms.onAlarm.addListener(update);
  chrome.runtime.onMessage.addListener(update);

  // launch options page on first run
  chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
      chrome.runtime.openOptionsPage();
    }
  });

  chrome.browserAction.onClicked.addListener(tab => {
    const tabUrl = window.GitHubNotify.getTabUrl();

    // request optional permissions the 1rst time
    if (window.GitHubNotify.settings.get('tabs_permission') === undefined) {
      window.GitHubNotify.requestPermission('tabs').then(granted => {
        window.GitHubNotify.settings.set('tabs_permission', granted);
        openTab(tabUrl, tab);
      });
    } else {
      openTab(tabUrl, tab);
    }
  });






    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {

        var message = request.message
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
          myId = localStorage.getItem('myId') || {};
          if (myId.length > 0) {
            myId = myId.split(",");
            found = _(myId).contains(message[1]);
            sendResponse({ lookup: found });
          } else {
            sendResponse({ lookup: 'none' });
          };
        }

        if (message[0] === "setMe") {
          localStorage.setItem('myId', message[1]);
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

      }
    );





  update();








})();
