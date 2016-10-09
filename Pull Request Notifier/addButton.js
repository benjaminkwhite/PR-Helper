(function () {
    function addButton(sec){
        loc = window.location.href;
        
        var doAddButton = function() {
            loc = window.location.href;
            var youtube2mp3path ='http://youtubeconverter.me/?youtubeURL='+encodeURIComponent(loc)+'&quality=320&submit=OK'; 
            var div_embed = document.getElementById('user-links');
            var vcard_username = document.getElementsByClassName('vcard-username')[0].innerHTML


console.log('go go go')
localStorage.setItem('teamMates', vcard_username);

            if (div_embed) {
                button_embed = '<li class="header-nav-item"><button type="button" class="btn btn-block">Add as PR friend</button></li>';
                div_embed.innerHTML = button_embed+div_embed.innerHTML;
            }
        }
        
        if (/^https?\:\/\/github\.com\/.*/.test(loc)) {
           console.log('go go go')

            window.setTimeout(function() { doAddButton(); }, sec * 1000);
        }
    }
    
    function hrefHandler(){
        this.oldhref = window.location.href;
        this.Check;

        var that = this;
        var detect = function(){
            loc = window.location.href;
            if (that.oldhref != loc){
                that.oldhref = loc;
                
                addButton(1);
            }
        };

        this.Check = setInterval(function(){ detect() }, 1000);
    }

    var hrefDetection = new hrefHandler();
    
    addButton(0);
})();
