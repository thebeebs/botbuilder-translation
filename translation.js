var MsTranslator = require('mstranslator');
var request = require('request');
var builder = require('botbuilder');

var translation = (function () {

    var LOCALE_VAR = 'BotBuilder.Data.PreferredLocale';
var LANGUAGES = {
    'English': 'en',
    '中文': 'zh-CHT',
    'Italiano': 'it'
};

    var _textanalyticskey = "";
    var _translatorkey = "";
    var _lib = new builder.Library('languageLibrary');

    var _bot = null;

    _lib.dialog('change', [
        function (session, args, next) {
            builder.Prompts.choice(session, 'Please choose a language \n\n 請選擇一種語言 \n\n Scegli la tua lingua', Object.keys(LANGUAGES), builder.ListStyle.button);
        },
        function (session, results, next) {
            session.userData[LOCALE_VAR] = LANGUAGES[results.response.entity];
            session.preferredLocale(session.userData[LOCALE_VAR], err => {
                if (!err) {
                    // Locale files loaded
                    session.endDialog("Your preferred language is now %s.", results.response.entity);
                } else {
                    // Problem loading the selected locale
                    session.error(err);
                }
            })
        }
    ]);

    function createLibrary (bot, textanalyticskey, translatorkey) {
        if (!bot) {
            throw 'Please provide a bot object';
        }

        _textanalyticskey = textanalyticskey;
        _translatorkey = translatorkey;

        _bot = bot;

        // Middleware to detect Language
        _bot.use({
            botbuilder: function (session, next) {
                var options = {
                    method: 'POST',
                    url: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/languages?numberOfLanguagesToDetect=1',
                    body: { documents: [{ id: 'message', text: session.message.text }]},
                    json: true,
                    headers: {
                        'Ocp-Apim-Subscription-Key': _textanalyticskey
                    }
                };
                request(options, function (error, response, body) {
                    if (!error && body) {
                        if (body.documents && body.documents.length > 0) {
                            var languages = body.documents[0].detectedLanguages;
                            if (languages && languages.length > 0 && languages[0].iso6391Name !== '(Unknown)') {
                                session.preferredLocale(languages[0].iso6391Name);
                            }
                        }
                    }
                    next();
                });
            },
        });

        // Middle ware to convert to chinese
        _bot.use({
            botbuilder: function (session, next) {

                var _onSend = session.options.onSend;

                session.options.onSend = function (messages, done) {
                    promises = messages.map(function(message) {
                        if (session.preferredLocale().toLowerCase().startsWith('en')) {
                            return Promise.resolve(message.text);
                        } else {
                            return translatePromise(message.text, "en", session.preferredLocale());
                        }
                    });

                    Promise.all(promises).then(function(results) {
                        results.forEach(function(result, i) {
                            messages[i].text = result;
                        });
                        _onSend(messages, done);
                    });
                };

                if (session.preferredLocale().toLowerCase().startsWith('en')) {
                    next();
                    return;
                }

                var message = session &&
                    session.message &&
                    session.message.text &&
                    session.message.text.toLowerCase() || '';

                translation.translate(message, session.preferredLocale() ,"en", function(phrase) {
                    session.message.text = phrase;
                    next();
                });
            }
        });

        return _lib;
    }

    function getLanguage(phrase){ 
        return "en";
    }

    function translate(phrase, inputLang, outputLang, callback){ 
        inputLang = inputLang.replace('_', '-').toLowerCase();
        outputLang = outputLang.replace('_', '-').toLowerCase();

        // Skip trans if input and output match
        if (inputLang == outputLang) {
            return callback(phrase);
        }
        
        translateClient = new MsTranslator({
            api_key: _translatorkey
        }, true);
        var params = {
            text: phrase,
            from: inputLang,
            to: outputLang
        };
        translateClient.translate(params, (err, translation) => {
            console.log('translate from/to', phrase, translation);
			callback(translation);
        });
    }

    function translatePromise(phrase, inputLang, outputLang) {
        return new Promise(function(resolve, reject) {
            translate(phrase, inputLang, outputLang, function(translation) {
                resolve(translation);
            });
        });
    }

    function changeLocale (session, options) {
        // Start dialog in libraries namespace
        session.beginDialog('languageLibrary:change', options || {});
    }

    function ensureLocale (session) {
        session.preferredLocale(session.userData[LOCALE_VAR]);
        _bot.settings.localizerSettings.defaultLocale = session.preferredLocale();
    }

    function isLocaleSet (session) {
        return session.userData[LOCALE_VAR];
    }

    return {
        createLibrary: createLibrary,
        changeLocale: changeLocale,
        ensureLocale: ensureLocale,
        isLocaleSet: isLocaleSet,
        translate: translate
    };
})();



module.exports = translation;