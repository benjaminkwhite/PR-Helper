(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const githubHostField = document.getElementById('github-host');
    const githubApiHostField = document.getElementById('github-apihost');
    const accessTokenField = document.getElementById('access-token');
    const refreshRateField = document.getElementById('refresh-rate');
    const teamMatesField = document.getElementById('team-mates');
    const meField = document.getElementById('me');
//    const hiddenPRsField = document.getElementById('hiddenPRs');
    const gh_linkField = document.querySelector("#gh_link");

    const showDesktopNotif = document.getElementById('show_desktop_notif');

    function loadSettings() {
      githubHostField.value = localStorage.getItem('githubHost');
      gh_linkField.href = localStorage.getItem('githubHost') + "/settings/tokens/new?scopes=notifications&description=PR Helper Chrome extension"
      githubApiHostField.value = localStorage.getItem('githubApiHost');
      accessTokenField.value = localStorage.getItem('accessToken');
      refreshRateField.value = localStorage.getItem('refreshRate');
      teamMatesField.value = localStorage.getItem('teamMates');
      meField.value = localStorage.getItem('me');
//      hiddenPRsField.value = localStorage.getItem('hiddenPRs');
      showDesktopNotif.checked = localStorage.getItem('showDesktopNotif');
    }

    loadSettings();

    githubHostField.addEventListener('change', () => {

      if (githubHostField.value === "") {
        localStorage.setItem('githubHost', 'https://github.com');
      } else {
        localStorage.setItem('githubHost', githubHostField.value);
      }
    });

    githubApiHostField.addEventListener('change', () => {
      localStorage.setItem('githubApiHost', githubApiHostField.value);
    });

    accessTokenField.addEventListener('change', () => {
      localStorage.setItem('accessToken', accessTokenField.value);
    });

    refreshRateField.addEventListener('change', () => {
      localStorage.setItem('refreshRate', refreshRateField.value);
    });

    teamMatesField.addEventListener('change', () => {
      localStorage.setItem('teamMates', teamMatesField.value);
    });

    meField.addEventListener('change', () => {
      localStorage.setItem('me', meField.value);
    });

    // hiddenPRsField.addEventListener('change', () => {
    //   localStorage.setItem('hidden-PRs', hiddenPRsField.value);
    // });

    showDesktopNotif.addEventListener('change', () => {
      if (showDesktopNotif.checked) {
        window.GitHubNotify.requestPermission('notifications').then(granted => {
          if (granted) {
          } else {
            showDesktopNotif.checked = false;
          }
          localStorage.setItem('showDesktopNotif', granted);
        });
      } else {
        localStorage.setItem('showDesktopNotif', showDesktopNotif.checked);
      }
    });
  });
})();
