export const usageOptions = [
  {
    header: "Twitch Drop Grabber",
    content: [
      "Simulates Chrome to watch Twitch streams and automatically claim drops",
      "Uses the {underline Drops Enabled} tag to search for channels so make sure the game you choose is currently running drops!",
      "",
      "You can watch a game, a list of specified channels, or specified channels that watch the assigned game",
    ],
  },
  {
    header: "Synopsis",
    content: [
      '$ npm start -- [-v] [-t 60000] [--no-headless] [-p "localhost:1234"] [-g] valorant',
      '$ npm start -- [-v] [-t 60000] [--no-headless] [-p "localhost:1234"] [-g] valorant [-f channels.txt]',
      '$ npm start -- [-v] [-t 60000] [--no-headless] [-p "localhost:1234"] -f channels.txt',
    ],
  },
  {
    header: "Options",
    optionList: [
      {
        name: "game",
        alias: "g",
        type: String,
        description:
          "The game to watch for drops for. Should be the ID of the game in the Twitch directory: {underline https://twitch.tv/directory/game/{green <ID>}}",
      },
      {
        name: "timeout",
        alias: "t",
        typeLabel: "{underline ms}",
        description:
          "How often to refresh the inventory page and check for channel live status. Do not set this too low, to give the browser some time to load the page correctly. Default: 5 minutes",
      },
      {
        name: "verbose",
        alias: "v",
        type: Boolean,
        description: "Some more verbose logging if enabled",
      },
      {
        name: "no-headless",
        type: Boolean,
        description: "Shows the Chrome window when enabled",
      },
      {
        name: "proxy",
        alias: "p",
        description: "Proxy server to use (optional)",
        typeLabel: "<{underline server/ip}>:<{underline port}>",
      },
      {
        name: "file",
        alias: "f",
        type: String,
        description:
          "Path to a file of Twitch usernames, separated by newlines. When using this, only these channels will be watched (if any of them is online). If no channel is online, and -g is set, a random channel is watched in the background.",
      },
      {
        name: "help",
        alias: "h",
        description: "Print this guide",
        type: Boolean,
      },
    ],
  },
];

export const cmdOptions = [
  { name: "game", alias: "g", type: String, defaultOption: true },
  { name: "timeout", alias: "t", type: Number, defaultValue: 5000 * 60 },
  { name: "verbose", alias: "v", type: Boolean, defaultValue: false },
  { name: "help", alias: "h", type: Boolean, defaultValue: false },
  { name: "no-headless", type: Boolean, defaultValue: false },
  { name: "proxy", type: String, alias: "p" },
  { name: "file", alias: "f", type: String },
];
