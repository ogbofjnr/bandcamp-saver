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
            REQUEST: "Error while request sound page",
            PROCESS: "Error while process sound page"
        },
        SELECTORS: {
            ALBUM: ".trackView",//#trackInfo
            SOUNDS: "[itemtype='http://www.schema.org/MusicRecording']",//.track_row_view
            SOUND: "table:nth-child(1) tr:nth-child(1) td:nth-child(2) a",
            PAGE_HEAD: ".inline_player",
            DOWNLOAD_LNK: "\"mp3-128\"",
            SAVE_LNK: "bcs_save-lnk",
            SAVE_BTN: "bcs_save-btn"
        },
        HTML: {
            SAVE_LNK_TEMPLATE: "<a class='bcs_save-lnk' data-page='{0}' href='javascript:void(0)'>download track</a>",
            SAVE_BTN_TEMPLATE: "<h4 class='bcs_save-wrapper'><a class='bcs_save-btn' href='javascript:void(0)'>Download track</a></h4>"
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
                sounds = $(CONSTANTS.SELECTORS.ALBUM + " " + CONSTANTS.SELECTORS.SOUNDS);
            }catch(e){
                console.log(new Date().toISOString() + " | Bandcamp Saver | " + CONSTANTS.ERRORS.SELECT_DOM);
                return false;
            }
            try{
                $(sounds).each(function(){
                    var soundPage, soundInfo = $(this).find("td")[2];
                    $(soundInfo).find("a").each(function() {
                        soundPage = $(this).attr("href");
                        if (soundPage) return false;
                    });
                    var lnk = String.format(CONSTANTS.HTML.SAVE_LNK_TEMPLATE, soundPage);
                    $(soundInfo).children().append(lnk);
                });
                $(CONSTANTS.SELECTORS.PAGE_HEAD).after(CONSTANTS.HTML.SAVE_BTN_TEMPLATE);
            }catch(e){
                console.log(new Date().toISOString() + " | Bandcamp Saver | " + CONSTANTS.ERRORS.UPDATE_DOM);
                return false;
            }
            return true;
        },
        download: function(elem, forcibly){
            //get sound page
            BandcampSaver.loading = true;
            $.get(settings.url + $(elem).data("page"), function(data) {
                try{
                    var index = data.indexOf(CONSTANTS.SELECTORS.DOWNLOAD_LNK);
                    if (index >= 0){
                        var tempData = '';
                        for(var i = index; data[i] != '}'; ++i){
                            tempData += data[i];
                        }
                        var downloadLnk = eval(tempData.split(':')[1]);
                        //prepare for downloading
                        var trackId = Math.random().toString(36).substring(7);
                        $(elem).attr("id", trackId);
                        $(elem).attr("download", "");
                        $(elem).attr("href", downloadLnk);
                        //downloading is here
                        document.getElementById(trackId).click();
                        //clear
                        if (forcibly){
                            setTimeout(function() {
                                $(elem).removeAttr("id")
                                $(elem).removeAttr("download");
                                $(elem).attr("href", "javascript:void(0)");
                                BandcampSaver.loading = false;
                            }, 300);
                        }else{
                            BandcampSaver.loading = false;
                        }
                    }
                }catch(e){
                    console.log(new Date().toISOString() + " | Bandcamp Saver | " + CONSTANTS.ERRORS.PROCESS);
                    BandcampSaver.loading = false;
                }
            }).fail(function(e) {
                console.log(new Date().toISOString() + " | Bandcamp Saver | " + CONSTANTS.ERRORS.REQUEST);
                BandcampSaver.loading = false;
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
                    var sound = $(CONSTANTS.SELECTORS.ALBUM + " " + CONSTANTS.SELECTORS.SOUND);
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
