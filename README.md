# botbuilder-translation
## This NPM package is currently not working.
Translation middleware for the bot framework this enables developers to easily add translation to there bot. After Intialising your bot, you should register the translation library like so:

```
var translation = require('botbuilder-translation')
bot.library(translation.createLibrary(bot, process.env.MSTRANSLATORAPIKEY, process.env.TEXTANALYTICSKEY ));
```
