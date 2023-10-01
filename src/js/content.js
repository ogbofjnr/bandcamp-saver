BandcampSaver = (() => {

    const format = function () {
        let s = arguments[0];
        for (let i = 0; i < arguments.length - 1; i++) {
            const reg = new RegExp('\\{' + i + '\\}', 'gm');
            s = s.replace(reg, arguments[i + 1]);
        }
        return s;
    };

    const CONSTANTS = {
        ERRORS: {
            SELECT_DOM: 'Error while apply selectors for page elements',
            UPDATE_DOM: 'Error while update page elements',
            REQUEST: 'Error while request sound page',
            PROCESS: 'Error while process sound page'
        },
        SELECTORS: {
            ALBUM: '.trackView', // #trackInfo
            SOUNDS: '[itemtype="http://www.schema.org/MusicRecording"]', // .track_row_view
            SOUND: 'table:nth-child(1) tr:nth-child(1) td:nth-child(2) a',
            SOUND_NAME: '#name-section',
            SOUND_DISABLED: '.play_status.disabled',
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
            const isBandcampPage = BandcampSaver.isBandcampPage();

            if (isBandcampPage) {
                const prepared = BandcampSaver.preparePage();

                if (prepared) {
                    BandcampSaver.bindUIActions();
                }
            }
        },

        isBandcampPage: () => {
            const metaElements = document.getElementsByTagName('meta');

            if (metaElements && metaElements.length) {
                const metaContents = [...document.getElementsByTagName('meta')].map(x => x.content || '');

                if (metaContents && metaContents.length) {
                    return metaContents.some(metaContent => {
                        const parsedMeta = metaContent.toLowerCase();
                        return parsedMeta.indexOf('bandcamp') >= 0;
                    });
                }
            }

            return false;
        },

        preparePage: () => {
            let sounds;

            try {
                sounds = $(`${CONSTANTS.SELECTORS.ALBUM} ${CONSTANTS.SELECTORS.SOUNDS}`);
            } catch (e) {
                console.error(`${new Date().toISOString()} | Bandcamp Saver | ${CONSTANTS.ERRORS.SELECT_DOM}`);
                return false;
            }

            try {
                $(sounds).each((i, sound) => {
                    const disabled = $(sound).find(CONSTANTS.SELECTORS.SOUND_DISABLED);
                    if (disabled.length) return true;

                    const soundInfo = $(sound).find('td')[2];

                    let soundPage = '';
                    let soundName = CONSTANTS.NO_NAME;

                    $(soundInfo).find('a').each((i, a) => {
                        soundPage = $(a).attr('href');
                        if (soundPage) return false;
                    });
                    try {
                        soundName = soundInfo.children[0].children[0].innerText;
                    } catch (e) { }

                    const lnk = format(CONSTANTS.HTML.SAVE_LNK_TEMPLATE, soundPage, soundName);
                    $(soundInfo).children().append(lnk);
                });

                $(CONSTANTS.SELECTORS.PAGE_HEAD).after(CONSTANTS.HTML.SAVE_BTN_TEMPLATE);

            } catch (e) {
                console.error(`${new Date().toISOString()} | Bandcamp Saver | ${CONSTANTS.ERRORS.UPDATE_DOM}`);
                return false;
            }

            return true;
        },
        download: (elem) => {

            console.log("download started")
            //get sound page

            BandcampSaver.loading = true;

            $.get(settings.url + $(elem).data('page'), data => {
                try {
                    // console.log(s.slice(s.indexOf("mp3-128"), index + 500))
                    const url = getFirstMatch(data, /mp3-128&quot;:&quot;((?:(?!&quot;).)+)/);
                    console.log('URL:', url);
                    var artist = getFirstMatch(data, /&quot;artist&quot;:&quot;((?:(?!&quot;).)+)/);
                    artist = decodeHtmlEntities(artist);
                    var track = getFirstMatch(data, /;title&quot;:&quot;((?:(?!&quot;).)+)/);
                    track = decodeHtmlEntities(track);
                    if (!track || track.includes('&') ||  track.includes(' - ')) {
                        const parts = track.split('-');
                        track=parts[1]
                        artist=parts[0]
                    }
                    console.log('Track:', track);
                    console.log('Artist:', artist);

                    label = getFirstMatch(data, /"recordLabel":{"@type":"MusicGroup","name":"([^"]+)"/);
                    if (!label) {
                        label = getFirstMatch(data, /;label_name&quot;:&quot;([^"]+)&quot/);
                    }
                    if (!label) {
                        label = getFirstMatch(data,/<meta\s+property="og:site_name"\s+content="([^"]+)"/);
                    }

                    label = label.replace(/\brecords\b/i, '').trim().toUpperCase();
                    console.log('Label:', label);

                    // console.log((i = data.indexOf('class="track_info"')) !== -1 ? data.slice(i + 18, i + 518) : 'Substring not found.');

                    const secret = 'ldibchichoihomejekglfdochkboepai';

                    var filename = artist.replace(/[\/]/g, '') + " - " + track.replace(/[\/]/g, '') + "[" + label.replace(/[\/]/g, '') + "]"
                    filename = decodeHtmlEntities(filename);
                    filename = filename.replace(/[^a-zA-Z0-9 \-.()_!@#$%^&+={}[\],;'~]/g, '_');
                    console.log('filename:', filename);

                    // let filename = $(elem).data('name');

                    chrome.runtime.sendMessage(
                        CONSTANTS.APP_ID,
                        { url, filename, secret },
                        { includeTlsChannelId: true },
                        () => { BandcampSaver.loading = false; }
                    );
                } catch (e) {
                    console.error(`${new Date().toISOString()} | Bandcamp Saver | ${e.message} `);
                    alert("An error occurred: " + e.message);
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
                if (!BandcampSaver.loading) {
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
                        } catch (e) { }
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


function getFirstMatch(data, regex) {
    const match = data.match(regex);
    return match && match[1] ? match[1] : null;
}

function decodeHtmlEntities(str) {
    var textArea = document.createElement('textarea');
    textArea.innerHTML = str;
    return textArea.value;
}
