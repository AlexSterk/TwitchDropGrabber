# Twitch Drop Grabber

Node.js application that watches Twitch streams and collects [Drops](https://help.twitch.tv/s/article/mission-based-drops?language=en_US). 
When the stream it's watching goes offline, it finds a new one. Great for running in the background: **Set and forget**.

----

## How to install/use

0. Ensure you have a working installations of Node.js, npm and Google Chrome
1. Clone the project
2. Run `npm install`
3. Run `npm run build` to compile the typescript files
4. Set up the [environment variables](#environment-variables)
5. Start the project with `npm start -- <GAME>` where the game is your game of choice that currently has active drop campaigns.
Replace `<GAME>` with the ID of the game in the Twitch directory. (e.g. ht<span>tps://</span>twitch.tv/directory/game/**fortnite**)
   
More options are available, you can see these using `npm start -- --help`
   
## Environment Variables

Two environment variables need to be set for this project. You can set these in whatever way you like. 
I prefer to use a `.env` file, see [.env.example](/.env.example) for an example.

The first variable you need to set are `TWITCH_AUTH_TOKEN`, which you can find by signing in to Twitch in your browser, and finding the auth-token cookie. 
Do NOT share this with others. This project will only run on your machine, and your auth token will therefore never leave your machine.

The second variable is `TWITCH_CHROME_EXECUTABLE`, which should point to your Chrome installation. 
Make sure this points to the actual application/executable file, and not just the install directory.
If this path contains spaces, you can wrap it in quote symbols (e.g. "path goes here").
A good way to find this path is to open Chrome, browse to `chrome://version/` and look under `Executable Path`

## Disclaimer

I really just made this tiny project for my benefit and don't intend to actively maintain/make changes to it. 
It works for me and suits my needs. 
I have no concrete plans to add new features or improvements, however you are free to open pull requests or issues, and I might look at them in my free time.

I might also have some improvements in other branches that I haven't fully tested for myself yet. So you can always try a more 'experimental' branch if something isn't working.

There are some things that would be nice to have though. 
I might add these myself in the future, but if you feel like it's a fun waste of time, be my guest:
* A better recovery for slow networks/networks failures
* A better way of checking if streams are playing.
* A way to detect channels you are watching going offline and hosting another channel
* A way to check the channel that is being watched did not switch to a different game
* An option to configure how many rewards you expect to claim (so the app can terminate once that is reached)
* ~~Watch a list of certain streamers instead of searching for a channel~~ ✅

Feel free to suggest more.

----

This concludes what I've wanted to say. Maybe I forgot something, I don't know. Let me know by opening an issue. 

I hope this project helps you :)
