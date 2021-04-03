declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TWITCH_AUTH_TOKEN: string,
            TWITCH_CHROME_EXECUTABLE: string
        }
    }
}

export {}