# ManaSoup Streaming Overlay

This is a streaming-overlay and twitch-bot for ManaSoup and its great community.

### Setup
Open you Terminal and move to the directory you want this project to be in. Then clone this repo by entering:
```
git clone https://github.com/jason-rietzke/ManaSoupStreamOverlay.git
```
After this you move into the *ManaSoupStreamingOverlay* directory and enter 
```
npm instal
npm run config
```
Now open the new .env file and enter the ``Channel_Name`` you want the bot to listen to, your ``Client_Name`` and your ``OAuth``Token (you can generate the OAuth token [here](https://twitchapps.com/tmi/))

---

### Hot to use it
After you entered all your information, you can move on and run the bot by entering:
```
npm start
```
As long as the bot is running you have to keep the terminal open!

To use the overlay in your OBS you have to create a new BrowserSource, scale it fullscreen and 2515x1415 and enter ``http://localhost:8080/`` as the URL.