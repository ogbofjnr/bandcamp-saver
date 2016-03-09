BandcampSaver = (function(){

    String.format = function() {
          var s = arguments[0];
          for (var i = 0; i < arguments.length - 1; i++) {
              var reg = new RegExp("\\{" + i + "\\}", "gm");
              s = s.replace(reg, arguments[i + 1]);
          }
          return s;
    };

    var CONSTANTS = {
        ERRORS : {
            SELECT_DOM : "Error while apply selectors for page elements",
            UPDATE_DOM : "Error while update page elements",
            REQUEST: "Error while get sound page",
            DOWNLOAD: "Error while sound download"
        },
        SELECTORS: {
            ALBUM: ".trackView",//[itemtype='http://schema.org/MusicAlbum'] or #trackInfo
            SOUNDS: "[itemtype='http://www.schema.org/MusicRecording']",//tr or .track_row_view
            SOUND: "table:nth-child(1) tr:nth-child(1) td:nth-child(2) a",
            SAVE_LNK: "bcs_save-lnk",
            SAVE_BTN: "bcs_save-btn",
            SOUND_OBJECT: "TralbumData"
        },
        HTML: {
            SAVE_LNK_TEMPLATE: "<a class='{0}' data-page='{1}' href='javascript:void(0)'>download</a>",
            SAVE_BTN_TEMPLATE: "<h4><a class='bcs_save-btn' href='javascript:void(0)'>Download Now</a></h4>"
        }
    };

    var settings = {
        url: window.location.origin
    };

    return {
        loading: false,
        init: function() {
            if (BandcampSaver.preparePage()){
                BandcampSaver.bindUIActions();
            };
        },
        preparePage: function(){
            var sounds;
            try{
                sounds = $($(CONSTANTS.SELECTORS.ALBUM)).find(CONSTANTS.SELECTORS.SOUNDS);
            }catch(e){
                console.log(CONSTANTS.ERRORS.SELECT_DOM);
                return false;
            }
            try{
                $(sounds).each(function(){
                    var soundPage, soundInfo = $(this).find("td")[2];
                    $(soundInfo).find("a").each(function() {
                        soundPage = $(this).attr("href");
                        if (soundPage) return false;
                    });
                    var lnk = String.format(CONSTANTS.HTML.SAVE_LNK_TEMPLATE, CONSTANTS.SELECTORS.SAVE_LNK, soundPage);
                    $(soundInfo).children().append(lnk);
                });
                $($(".buyItem").children("h4")[0]).after(CONSTANTS.HTML.SAVE_BTN_TEMPLATE);
            }catch(e){
                console.log(CONSTANTS.ERRORS.UPDATE_DOM);
                return false;
            }
            return true;
        },
        download: function(elem, forcibly){
            //get sound page
            BandcampSaver.loading = true;
            $.get(settings.url + $(elem).data("page"), function(data) {
                try{
                    var index = data.indexOf(CONSTANTS.SELECTORS.SOUND_OBJECT);
                    if (index >= 0){
                        var tempData = '';
                        for(var i = index; data[i] != ';'; ++i){
                            tempData += data[i];
                        }
                        var evalData = eval(tempData);
                        var soundUrl = evalData.trackinfo[0].file["mp3-128"];
                        //get sound properly
                        var trackId = Math.random().toString(36).substring(7);
                        $(elem).attr("id", trackId);
                        $(elem).attr("download", "");
                        $(elem).attr("href", soundUrl);
                        //downloading is here
                        document.getElementById(trackId).click();
                        //clear href data
                        if (forcibly){
                            $(elem).removeAttr("id")
                            $(elem).removeAttr("download");
                            $(elem).attr("href", "javascript:void(0)");
                        }
                    }
                }catch(e){
                    console.log(CONSTANTS.ERRORS.DOWNLOAD);
                    BandcampSaver.loading = false;
                }
            }).fail(function() {
                console.log(CONSTANTS.ERRORS.REQUEST);
            }).always(function() {
                setTimeout(function() {
                    BandcampSaver.loading = false;
                }, 150);
            });
        },
        bindUIActions: function() {
            $(document).on("click", "." + CONSTANTS.SELECTORS.SAVE_LNK, function(event) {
                if (!event.target.hasAttribute("download") && !BandcampSaver.loading){
                    BandcampSaver.download($(event.target));
                }
            });
            $(document).on("click", "." + CONSTANTS.SELECTORS.SAVE_BTN, function(event) {
                if (!BandcampSaver.loading){
                    var sound = $($(CONSTANTS.SELECTORS.ALBUM)).find(CONSTANTS.SELECTORS.SOUND);
                    $(event.target).data("page", sound.attr("href"));
                    BandcampSaver.download($(event.target), true);
                }
            });
        }
    }

})();

$(document).ready(function() {
    BandcampSaver.init();
});
