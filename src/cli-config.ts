export const usageOptions = [
    {
        header: 'Twitch Drop Grabber',
        content: [
            'Simulates Chrome to watch Twitch streams and automatically claim drops',
            'Uses the {underline Drops Enabled} tag to search for channels so make sure the game you choose is currently running drops!'
        ]
    },
    {
        header: 'Synopsis',
        content: [
            '$ npm start -- [-v] [-t 5000] [--game] valorant',
        ]
    },
    {
        header: 'Options',
        optionList: [
            {
                name: 'game',
                alias: 'g',
                type: String,
                description: 'The game to watch for drops for. Should be the ID of the game in the Twitch directory: {underline https://twitch.tv/directory/game/{green \<ID\>}}'
            },
            {
                name: 'timeout',
                alias: 't',
                typeLabel: '{underline ms}',
                description: 'How often to refresh the inventory page and check for channel live status. Do not set this to low, to give the browser some time to load the page correctly. Default: 5 minutes'
            },
            {
                name: 'verbose',
                alias: 'v',
                type: Boolean,
                description: 'Some more verbose logging if enabled',

            },
            {
                name: 'no-headless',
                type: Boolean,
                description: 'Shows the Chrome window when enabled',  
            },
            {
                name: 'help',
                alias: 'h',
                description: 'Print this guide',
                type: Boolean
            }
        ]
    }
];

export const cmdOptions = [
    { name: 'game', alias: 'g', type: String, defaultOption: true },
    { name: 'timeout', alias: 't', type: Number, defaultValue: 5000 * 60 },
    { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
    { name: 'help', alias: 'h', type: Boolean, defaultValue: false },
    { name: 'no-headless', type: Boolean, defaultValue: false }
];