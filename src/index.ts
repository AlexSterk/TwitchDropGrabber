import {Page} from "puppeteer";

require('dotenv').config();
import {usageOptions, cmdOptions} from "./cli-config";
const puppeteer = require("puppeteer");
const cmdArgs = require('command-line-args');
const cmdUsage = require('command-line-usage');

const usage = cmdUsage(usageOptions);
const args = cmdArgs(cmdOptions);

const { game, timeout, verbose, help } = args
const headless = !args['no-headless'];

if (help || !game) {
    console.log(usage);
    process.exit(0);
}

if (!process.env.TWITCH_CHROME_EXECUTABLE) {
    throw new Error('TWITCH_CHROME_EXECUTABLE not set')
}
if (!process.env.TWITCH_AUTH_TOKEN) {
    throw new Error('TWITCH_AUTH_TOKEN not set')
} 

const directoryUrl = `https://www.twitch.tv/directory/game/${game}?tl=c2542d6d-cd10-4532-919b-3d19f30a768b`;

function formatLog(msg: string) {
    return `[${new Date().toUTCString()}] ${msg}`;
}

function info(msg: string) {
    console.info(formatLog(msg));
}

function vinfo(msg: string) {
    if (!verbose) return;
    console.debug(`[VERBOSE] ${formatLog(msg)}`);
}

function warn(msg: string) {
    console.warn(`[WARNING] ${formatLog(msg)}`);
}

async function initTwitch(page: Page) {
    info('Navigating to Twitch');
    await page.goto('https://twitch.tv', {
        waitUntil: ['networkidle2', 'domcontentloaded']
    });
    info('Configuring streaming settings');
    await page.evaluate(() => {
        localStorage.setItem('mature', 'true');
        localStorage.setItem('video-muted', '{"default":true}');
        localStorage.setItem('volume', '0.0');
        localStorage.setItem('video-quality', '{"default":"160p30"}');
    });
    info('Signing in using auth-token')
    await page.setCookie(
        {
            name: 'auth-token',
            value: process.env.TWITCH_AUTH_TOKEN
        }
    );
}

let buffering = 0;
let prevDuration = -1;

async function findCOnlineChannel(page: Page) {
    buffering = 0;
    prevDuration = -1;
    info('Finding online channel...');
    await page.goto(directoryUrl, {
        waitUntil: ['networkidle2', 'domcontentloaded']
    });
    const aHandle = await page.waitForSelector('a[data-a-target="preview-card-image-link"]', {timeout: 0});
    const channel = await page.evaluate(a => a.getAttribute('href'), aHandle);
    info('Channel found: navigating');
    await page.goto(`https://twitch.tv${channel}`, {
        waitUntil: ['networkidle2', 'domcontentloaded']
    });
}

async function checkInventory(inventory: Page) {
    await inventory.goto('https://twitch.tv/inventory', {
        waitUntil: ['networkidle2', 'domcontentloaded']
    });
    const claimButton = (await inventory.$('button[data-test-selector="DropsCampaignInProgressRewardPresentation-claim-button"]'));
    vinfo(`Claim button found: ${!!claimButton}`);
    if (claimButton) {
        info('Reward found! Claiming!')
        await new Promise(resolve => setTimeout(resolve, 1000));
        await claimButton.click();
    }
}

async function checkLiveStatus(mainPage: Page) {
    const status = await mainPage.$$eval('a[status]', li => li.pop()?.getAttribute('status'));
    const videoDuration = await mainPage.$$eval('video', videos => (videos.pop() as HTMLVideoElement)?.currentTime);
    vinfo(`Channel status: ${status}`);
    vinfo(`Video duration: ${videoDuration}`);
    if (status !== 'tw-channel-status-indicator--live' || videoDuration === 0) {
        info('Channel no longer live')
        await findCOnlineChannel(mainPage);
        return;
    }
    if (videoDuration === prevDuration) {
        warn('Stream buffering or offline. If this persists a new channel will be found next cycle');
        if (++buffering > 1) {
            info('Channel offline or stream still buffering');
            await findCOnlineChannel(mainPage);
            return;
        }
    } else {
        buffering = 0;
    }
    prevDuration = videoDuration;
}

async function runTimer(mainPage: Page, inventory: Page) {
    vinfo('Timer function called')
    await checkInventory(inventory);
    await checkLiveStatus(mainPage);
    setTimeout(runTimer, timeout, mainPage, inventory);
}

async function run() {
    info('Starting application');
    const browser = await puppeteer.launch({
        executablePath: process.env.TWITCH_CHROME_EXECUTABLE,
        headless: headless
    });
    const mainPage = (await browser.pages())[0];
    await mainPage.setViewport({ width: 1280, height: 720 })
    await initTwitch(mainPage);
    
    const inventory = await browser.newPage();
    await inventory.setViewport({ width: 1280, height: 720 })
    await mainPage.bringToFront();
    
    await findCOnlineChannel(mainPage);
    vinfo('Initial navigation complete')
    setTimeout(runTimer, timeout, mainPage, inventory);
}

run().then(() => {
    // Nothing
});