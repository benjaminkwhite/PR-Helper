// Saves options to localStorage.
function save_options() {
  var githubHostField = document.querySelector("#github-host");
  localStorage.setItem('githubHost', githubHostField.value);

  var githubApiHostField = document.querySelector("#github-apihost");
  localStorage.setItem('githubApiHost', githubApiHostField.value);

  var accessTokenField = document.querySelector("#access-token");
  localStorage.setItem('accessToken', accessTokenField.value);

  var refreshRate = document.querySelector("#refresh-rate");
  localStorage.setItem('refreshRate', refreshRate.value);

  var teamMates = document.querySelector("#team-mates");
  localStorage.setItem('teamMates', teamMates.value);

  // var hiddenPRs = document.querySelector("#hidden-PRs");
  // localStorage.setItem('hiddenPRs', hiddenPRs.value);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  var githubHost = localStorage.getItem('githubHost');
  var githubHostField = document.querySelector("#github-host");
  githubHostField.value = githubHost;


  var gh_linkField = document.querySelector("#gh_link");
  if (githubHost === "") {
    githubHost = "https://github.com";
  }
  gh_linkField.href = githubHost + "/settings/tokens/new?scopes=notifications&description=PR Helper Chrome extension"

  var githubApiHost = localStorage.getItem('githubApiHost');
  var githubApiHostField = document.querySelector("#github-apihost");
  githubApiHostField.value = githubApiHost;

  var accessToken = localStorage.getItem('accessToken');
  var accessTokenField = document.querySelector("#access-token");
  accessTokenField.value = accessToken;

  var refreshRate = localStorage.getItem('refreshRate');
  var refreshRateField = document.querySelector("#refresh-rate");
  refreshRateField.value = refreshRate;

  var teamMates = localStorage.getItem('teamMates');
  var teamMatesField = document.querySelector("#team-mates");
  teamMatesField.value = teamMates;

  // var hiddenPRs = localStorage.getItem('hiddenPRs');
  // var hiddenPRsField = document.querySelector("#hidden-PRs");
  // hiddenPRsField.value = hiddenPRs;
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('.save').addEventListener('click', save_options);
