(function() {
  function addButton() {
    loc = window.location.href;




    if (/^https?\:\/\/github.*\/.*/.test(loc)) {
      sendMessage('getUrl');
    }

    function sendMessage(request) {
      chrome.extension.sendMessage({ message: request }, function(response) {

        request = request.split(",");
        var prStart = document.getElementById("prStart");
        var prRemove = document.getElementById("prRemove");
        var prAdd = document.getElementById("prAdd");

        if (request[0] === "getUrl" && response.lookup === loc.substring(0, loc.lastIndexOf("/"))) {
          window.setTimeout(function() { doAddButton(); }, 1000);
        }

        if (request[0] === "isMe" && response.lookup === false || request[0] === "isMe" && response.lookup == 'none') {
          prStart.classList.add("table-list-triage");
        } else if (request[0] === "isMe" && response.lookup == true) {
          prRemove.style.display = "none";
          prAdd.style.display = "none";
        }

        if (request[0] === "who" && response.lookup == false || request[0] === "who" && response.lookup == 'none') {
          prRemove.style.display = "none";
        } else if (request[0] === "who" && response.lookup == true) {
          prAdd.style.display = "none";
        }

        if (request[0] === "setMe" && response.lookup === 'done') {
          prStart.classList.remove("table-list-triage");
          prRemove.style.display = "none";
          prAdd.style.display = "none";
        }

        if (request[0] === "setTeamMates" && response.lookup === 'done') {
          prAdd.style.display = "none";
          prRemove.style.display = "block";
        }

        if (request[0] === "removeTeamMates" && response.lookup === 'done') {
          prAdd.style.display = "block";
          prRemove.style.display = "none";
        }


      });
    }

    var doAddButton = function() {
      var user_links = document.getElementById('user-links');
      var vcard_username = document.getElementsByClassName('vcard-username')[0].innerHTML;

      if (user_links) {
        button_embed = '<li class="header-nav-item dropdown js-menu-container">\
                <a class="header-nav-link name tooltipped tooltipped-sw js-menu-target" href="#" aria-label="PR Helper" data-ga-click="Header, show menu, icon:avatar" aria-expanded="false"><svg aria-hidden="true" class="octicon octicon-git-pull-request" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path d="M11 11.28V5c-.03-.78-.34-1.47-.94-2.06C9.46 2.35 8.78 2.03 8 2H7V0L4 3l3 3V4h1c.27.02.48.11.69.31.21.2.3.42.31.69v6.28A1.993 1.993 0 0 0 10 15a1.993 1.993 0 0 0 1-3.72zm-1 2.92c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zM4 3c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v6.56A1.993 1.993 0 0 0 2 15a1.993 1.993 0 0 0 1-3.72V4.72c.59-.34 1-.98 1-1.72zm-.8 10c0 .66-.55 1.2-1.2 1.2-.65 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z"></path></svg><span class="dropdown-caret"></span></a>\
                <div class="dropdown-menu-content js-menu-content" aria-hidden="true" aria-expanded="false">\
                <div class="dropdown-menu dropdown-menu-sw">\
                <span class="dropdown-item" id="prYou" data-ga-click="Header">This is me!<svg aria-hidden="true" class="octicon octicon-star" height="16" version="1.1" viewBox="0 0 14 16" width="14" id="prStart" style="color: red; float: right;"><path d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z"></path></svg></span>\
                <span class="dropdown-item" id="prAdd" data-ga-click="Header">Add teammate</span>\
                <span class="dropdown-item" id="prRemove" data-ga-click="Header">Remove teammate</span></div>\
                </div></li>';
        user_links.innerHTML = button_embed + user_links.innerHTML;

      }

      document.getElementById('prYou').addEventListener('click', function() {
        sendMessage('setMe,' + vcard_username);
      });

      document.getElementById('prAdd').addEventListener('click', function() {
        sendMessage('setTeamMates,' + vcard_username);
      });

      document.getElementById('prRemove').addEventListener('click', function() {
        sendMessage('removeTeamMates,' + vcard_username);
      });


      sendMessage('isMe,' + vcard_username);
      sendMessage('who,' + vcard_username);
    }

  }

  addButton();




})();
