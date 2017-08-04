# botbuilder-translation
## Do not attempt to use this in production as we test. When ready we will move to version 1.

Translation middleware for the bot framework this enables developers to easily add translation to there bot. After Intialising your bot, you should register the translation library like so:

```
var translation = require('botbuilder-translation')
bot.library(translation.createLibrary(bot, process.env.MSTRANSLATORAPIKEY, process.env.TEXTANALYTICSKEY ));
```
