console.log("BandCampSaver started");

BandCampSaver = (function(){

    var CONSTANTS = {
        ERRORS : {
            SELECT_DOM : "Error while apply selectors for page elements",
            UPDATE_DOM : "Error while update page elements",
            REQUEST: "Error while get sound page",
            DOWNLOAD: "Error while sound download"
        },
        SELECTORS: {
            ALBUM: "[itemtype='http://schema.org/MusicAlbum']",//.trackView or #trackInfo
            SOUND: "[itemtype='http://www.schema.org/MusicRecording']",//tr or .track_row_view
            SAVE_LNK: "bcs_save-lnk",
            TRACK_OBJECT: "TralbumData"
        },
        HTML: {
            SAVE_LNK_TEMPLATE: "<a class='{0}' data-page='{1}' href='javascript:void(0)'>download</a>"
        }
    };

    var settings = {
        url: window.location.origin,
        protocol: window.location.protocol
    };

    return {
        loading: false,
        init: function() {
            if (BandCampSaver.preparePage()){
                BandCampSaver.bindUIActions();
            };
        },
        preparePage: function(){
            var wrapper, sounds;
            try{
                wrapper = $(CONSTANTS.SELECTORS.ALBUM);
                sounds = $(wrapper).find(CONSTANTS.SELECTORS.SOUND);
            }catch(e){
                console.log(CONSTANTS.ERRORS.SELECT_DOM);
                return false;
            }
            try{
                $(sounds).each(function(){
                    var soundPage, soundTitle = $(this).find("td")[2];
                    $(soundTitle).find("a").each(function() {
                        soundPage = $(this).attr("href");
                        if (soundPage) return false;
                    });
                    var lnk = String.format(CONSTANTS.HTML.SAVE_LNK_TEMPLATE, CONSTANTS.SELECTORS.SAVE_LNK, soundPage);
                    $(soundTitle).children().append(lnk);
                });
            }catch(e){
                console.log(CONSTANTS.ERRORS.UPDATE_DOM);
                return false;
            }
            return true;
        },
        download: function(elem){
            //get sound page
            BandCampSaver.loading = true;
            $.get(settings.url + $(elem).data("page"), function(data) {
                try{
                    var index = data.indexOf(CONSTANTS.SELECTORS.TRACK_OBJECT);
                    if (index >= 0){
                        var tempData = '';
                        for(var i = index; data[i] != ';'; ++i){
                            tempData += data[i];
                        }
                        var evalData = eval(tempData);
                        var soundUrl = evalData.trackinfo[0].file["mp3-128"];
                        //for get sound properly
                        var trackId = Math.random().toString(36).substring(7);
                        $(elem).attr("href", soundUrl);
                        $(elem).attr('download','');
                        $(elem).attr("id", trackId);
                        document.getElementById(trackId).click();
                    }
                }catch(e){
                    console.log(CONSTANTS.ERRORS.DOWNLOAD);
                    BandCampSaver.loading = false;
                }
            }).fail(function() {
                console.log(CONSTANTS.ERRORS.REQUEST);
            }).always(function() {
                BandCampSaver.loading = false;
            });
        },
        bindUIActions: function() {
            $(document).on("click", "." + CONSTANTS.SELECTORS.SAVE_LNK, function(event) {
                if (!event.target.hasAttribute("download") && !BandCampSaver.loading){
                    BandCampSaver.download($(event.target));
                }
            });
        }
    }

})();

$(document).ready(function() {
    BandCampSaver.init();
});

String.format = function() {
      var s = arguments[0];
      for (var i = 0; i < arguments.length - 1; i++) {
          var reg = new RegExp("\\{" + i + "\\}", "gm");
          s = s.replace(reg, arguments[i + 1]);
      }
      return s;
};
