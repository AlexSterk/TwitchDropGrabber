import { Browser, Page } from "puppeteer";

require("dotenv").config();
import { usageOptions, cmdOptions } from "./cli-config";

const puppeteer = require("puppeteer");
const cmdArgs = require("command-line-args");
const cmdUsage = require("command-line-usage");
const fs = require("fs").promises;

const usage = cmdUsage(usageOptions);
const args = cmdArgs(cmdOptions);

const { game, timeout, verbose, help, proxy, file } = args;
const headless = !args["no-headless"];

if (help || !(game || file)) {
  console.log(usage);
  process.exit(0);
}

if (!process.env.TWITCH_CHROME_EXECUTABLE) {
  throw new Error("TWITCH_CHROME_EXECUTABLE not set");
}
if (!process.env.TWITCH_AUTH_TOKEN) {
  throw new Error("TWITCH_AUTH_TOKEN not set");
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
  info("Navigating to Twitch");
  await page.goto("https://twitch.tv", {
    waitUntil: ["networkidle2", "domcontentloaded"],
  });
  info("Configuring streaming settings");
  await page.evaluate(() => {
    localStorage.setItem("mature", "true");
    localStorage.setItem("video-muted", '{"default":true}');
    localStorage.setItem("volume", "0.0");
    localStorage.setItem("video-quality", '{"default":"160p30"}');
  });
  info("Signing in using auth-token");
  await page.setCookie({
    name: "auth-token",
    value: process.env.TWITCH_AUTH_TOKEN,
  });
}

let buffering = 0;
let prevDuration = -1;

async function findRandomChannel(page: Page) {
    await page.goto(directoryUrl, {
        waitUntil: ['networkidle2', 'domcontentloaded']
    });
    const aHandle = await page.waitForSelector('a[data-a-target="preview-card-image-link"]', {timeout: 0});
    const channel = await page.evaluate(a => a.getAttribute('href'), aHandle);
    info(`Channel found: navigating to ${channel}`);
    await page.goto(`https://twitch.tv${channel}`, {
        waitUntil: ['networkidle2', 'domcontentloaded']
    });
}

let list: string[];

async function readList() {
  info(`Parsing list of channels: ${file}`);
  const read = await fs.readFile(file, { encoding: "utf-8" });
  list = read.split(/\r?\n/).filter((s: string) => s.length !== 0);
  info(`${list.length} channels found: ${list.join(", ")}`);
}

async function streamingGame(page: Page) {
  const gameLink = await page.waitForSelector(
    'a[data-a-target="stream-game-link"]',
    { timeout: 0 }
  );
  const href = await page.evaluate((a) => a.getAttribute("href"), gameLink);
  const streamingGame = href.toLowerCase().endsWith(`/${game.toLowerCase()}`);
  return streamingGame;
}

async function findChannelFromList(page: Page): Promise<boolean> {
  if (!list) await readList();
  for (let channel of list) {
    vinfo(`Trying ${channel}`);
    await page.goto(`https://twitch.tv/${channel}`, {
      waitUntil: ["networkidle2", "domcontentloaded"],
    });
    const live = !(await isLive(page)).notLive;
    vinfo(`Channel live: ${live}`);
    if (!live) vinfo("Channel offline, trying next channel");
    else {
      if (game) {
        const _streamingGame = await streamingGame(page);
        vinfo(`Channel streaming the given game: ${_streamingGame}`);
        if (!_streamingGame) continue;
      }
      info("Online channel found!");
      return true;
    }
  }
  info("No channels online! Trying again after the timeout");
  return false;
}

let browser: Browser;
let mainPage: Page;
let backupPage: Page;

async function findOnlineChannel(page: Page) {
  buffering = 0;
  prevDuration = -1;
  info("Finding online channel...");
  if (file && page === mainPage) {
    const found = await findChannelFromList(page);
    if (game && !found) {
      if (!backupPage) {
        info("Finding backup stream.");
        backupPage = await browser.newPage();
        await backupPage.setViewport({ width: 1280, height: 720 });
        await findRandomChannel(backupPage);
      } else {
        vinfo("Checking backup stream");
        await checkLiveStatus(backupPage);
      }
    } else if (found && backupPage) {
      info("Closing backup stream.");
      await backupPage.close();
      await page.bringToFront();
    }
  } else await findRandomChannel(page);
}

const INVENTORY_URL = "https://www.twitch.tv/drops/inventory";

async function checkInventory(inventory: Page) {
  await inventory.goto(INVENTORY_URL, {
    waitUntil: ["networkidle2", "domcontentloaded"],
  });
  const claimButtons = await inventory.$$(
    'button[data-test-selector="DropsCampaignInProgressRewardPresentation-claim-button"]'
  );
  vinfo(
    `${claimButtons.length} claim buttons found${
      claimButtons.length > 0 ? "!" : "."
    }`
  );

  if (claimButtons.length > 0) {
    info(
      `${claimButtons.length} drops found! Please head to ${INVENTORY_URL} to claim them!`
    );
  }
  // for (const claimButton of claimButtons) {
  //   info("Reward found! Claiming!");
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   await claimButton.click();
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  // }
}

async function isLive(channelPage: Page) {
  await channelPage.bringToFront();
  const status = await channelPage.$$eval("a[status]", (li) =>
    li.pop()?.getAttribute("status")
  );
  const videoDuration = await channelPage.$$eval(
    "video",
    (videos) => (videos.pop() as HTMLVideoElement)?.currentTime
  );
  const raid = channelPage.url().includes("?referrer=raid");
  const _streamingGame = game ? await streamingGame(channelPage) : true;
  vinfo(`Current url: ${channelPage.url()}`);
  vinfo(`Channel status: ${status}`);
  vinfo(`Video duration: ${videoDuration}`);
  vinfo(`Streaming game: ${_streamingGame}`);
  const notLive = status !== "live" || videoDuration === 0;
  return { videoDuration, notLive, raid, streamingGame: _streamingGame };
}

async function checkLiveStatus(channelPage: Page) {
  const { videoDuration, notLive, raid, streamingGame } = await isLive(
    channelPage
  );
  if (notLive || raid) {
    info("Channel offline");
    await findOnlineChannel(channelPage);
    return;
  } else if (!streamingGame) {
    info("Channel not streaming game");
    await findOnlineChannel(channelPage);
    return;
  }
  if (videoDuration === prevDuration) {
    warn(
      "Stream buffering or offline. If this persists a new channel will be found next cycle"
    );
    if (++buffering > 1) {
      info("Channel offline or stream still buffering");
      await findOnlineChannel(channelPage);
      return;
    }
  } else {
    buffering = 0;
  }
  prevDuration = videoDuration;
}

async function runTimer(page: Page, inventory: Page) {
  vinfo("Timer function called");
  await checkInventory(inventory);
  await checkLiveStatus(page);
  setTimeout(runTimer, timeout, page, inventory);
}

async function run() {
  info("Starting application");
  browser = await puppeteer.launch({
    executablePath: process.env.TWITCH_CHROME_EXECUTABLE,
    headless: headless,
    args: proxy ? [`--proxy-server=${proxy}`] : [],
  });
  mainPage = (await browser.pages())[0];
  await mainPage.setViewport({ width: 1280, height: 720 });
  await initTwitch(mainPage);

  const inventory = await browser.newPage();
  await inventory.setViewport({ width: 1280, height: 720 });
  await mainPage.bringToFront();

  await findOnlineChannel(mainPage);
  setTimeout(runTimer, timeout, mainPage, inventory);
}

run().then(() => {
  // Nothing
});
