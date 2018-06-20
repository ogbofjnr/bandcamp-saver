BandcampSaver = (() => {

    String.format = function() {
          let s = arguments[0];
          for (let i = 0; i < arguments.length - 1; i++) {
              const reg = new RegExp('\\{' + i + '\\}', 'gm');
              s = s.replace(reg, arguments[i + 1]);
          }
          return s;
    };

    const CONSTANTS = {
        ERRORS : {
            SELECT_DOM : 'Error while apply selectors for page elements',
            UPDATE_DOM : 'Error while update page elements',
            REQUEST: 'Error while request sound page',
            PROCESS: 'Error while process sound page'
        },
        SELECTORS: {
            ALBUM: '.trackView', // #trackInfo
            SOUNDS: '[itemtype="http://www.schema.org/MusicRecording"]', // .track_row_view
            SOUND: 'table:nth-child(1) tr:nth-child(1) td:nth-child(2) a',
            SOUND_NAME: '#name-section',
            PAGE_HEAD: '.inline_player',
            DOWNLOAD_LNK: '"mp3-128"',
            SAVE_LNK: 'bcs_save-lnk',
            SAVE_BTN: 'bcs_save-btn'
        },
        HTML: {
            SAVE_LNK_TEMPLATE: `<a class='bcs_save-lnk' data-page='{0}' data-name='{1}' href='javascript:void(0)'>download track</a>`,
            SAVE_BTN_TEMPLATE: `<h4 class='bcs_save-wrapper'><a class='bcs_save-btn' href='javascript:void(0)'>Download track</a></h4>`
        },
        NO_NAME: '_'
    };

    const settings = {
        url: window.location.origin
    };

    return {
        loading: false,

        init: () => {
            if (BandcampSaver.preparePage()) {
                BandcampSaver.bindUIActions();
            }
        },

        preparePage: () => {
            let sounds;

            try {
                sounds = $(`${CONSTANTS.SELECTORS.ALBUM} ${CONSTANTS.SELECTORS.SOUNDS}`);
            } catch(e) {
                console.error(`${new Date().toISOString()} | Bandcamp Saver | ${CONSTANTS.ERRORS.SELECT_DOM}`);
                return false;
            }

            try {
                $(sounds).each((i, sound) => {
                    const soundInfo = $(sound).find('td')[2];

                    let soundPage = '';
                    let soundName = CONSTANTS.NO_NAME;

                    $(soundInfo).find('a').each((i, a) => {
                        soundPage = $(a).attr('href');
                        if (soundPage) return false;
                    });
                    try {
                        soundName = soundInfo.children[0].children[0].innerText;
                    } catch(e) {}

                    const lnk = String.format(CONSTANTS.HTML.SAVE_LNK_TEMPLATE, soundPage, soundName);
                    $(soundInfo).children().append(lnk);
                });
                $(CONSTANTS.SELECTORS.PAGE_HEAD).after(CONSTANTS.HTML.SAVE_BTN_TEMPLATE);

            } catch(e) {
                console.error(`${new Date().toISOString()} | Bandcamp Saver | ${CONSTANTS.ERRORS.UPDATE_DOM}`);
                return false;
            }

            return true;
        },
        download: (elem) => {
            //get sound page

            BandcampSaver.loading = true;

            $.get(settings.url + $(elem).data('page'), data => {

                try {
                    const index = data.indexOf(CONSTANTS.SELECTORS.DOWNLOAD_LNK);

                    if (index >= 0) {
                        let tempData = '';
                        for (let i = index; data[i] !== '}'; ++i) {
                            if (data[i] !== `'` && data[i] !== `"`) {
                                tempData += data[i];
                            }
                        }

                        const fromPosition = tempData.indexOf(':') + 1;
                        const url = tempData.substring(fromPosition);
                        const filename = $(elem).data('name');
                        const secret = 'ldibchichoihomejekglfdochkboepai';

                        chrome.runtime.sendMessage(CONSTANTS.APP_ID, { url, filename, secret }, { includeTlsChannelId: true }, (res) => {
                            if (res.error) {
                                console.error(`Error occurred due ${res.filename}.mp3 download!`);
                            } else {
                                console.log(`${res.filename} was downloaded!`);
                            }
                            BandcampSaver.loading = false;
                        });
                    }
                } catch(e) {
                    console.error(`${new Date().toISOString()} | Bandcamp Saver | ${CONSTANTS.ERRORS.REQUEST}`);
                    BandcampSaver.loading = false;
                }

            }).fail(e => {
                console.error(`${new Date().toISOString()} | Bandcamp Saver | ${CONSTANTS.ERRORS.REQUEST}`);
                BandcampSaver.loading = false;
            });
        },
        bindUIActions: () => {
            $(document).on('click', `.${CONSTANTS.SELECTORS.SAVE_LNK}`, (event) => {
                if (!BandcampSaver.loading) {
                    BandcampSaver.download($(event.target));
                }
            });
            $(document).on('click', `.${CONSTANTS.SELECTORS.SAVE_BTN}`, (event) => {
                if (!BandcampSaver.loading){
                    const sound = $(`${CONSTANTS.SELECTORS.ALBUM} ${CONSTANTS.SELECTORS.SOUND}`);
                    const page = sound.attr('href');

                    let name = CONSTANTS.NO_NAME;
                    if (sound.text()) {
                        name = sound.text()
                    } else {
                        const nameElement = $(CONSTANTS.SELECTORS.SOUND_NAME);
                        try {
                            const _name = nameElement.children()[0].innerText;
                            if (_name) name = _name;
                        } catch(e) {}
                    }

                    $(event.target).data('name', name);
                    $(event.target).data('page', page);

                    BandcampSaver.download($(event.target));
                }
            });
        }
    }

})();

$(document).ready(() => {
    BandcampSaver.init();
});
