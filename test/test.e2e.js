import { browser } from '@wdio/globals';
import path from 'path';
import { exec } from 'child_process';
import { networkInterfaces } from 'os';

function runAppleScript(script) {
    return new Promise((resolve, reject) => {
        // console.log(process.resourcesPath);
        // console.log(process.env);
        exec(
            "osascript " +  script,
            (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stdout.trim());
                }
            }
        );
    });
}
const fetchIp = () => {
    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    return "ws://" + results['en0'] + ":5050";
}

describe('Electron Testing', () => {

    it('should check that skipping changes tracks', async () => {
        const windows = await browser.getWindowHandles();
        for (const handle of windows) {
            await browser.switchWindow(handle);
            const currentTitle = await browser.getTitle();
            if (currentTitle === "Spotify listener") break;
        }
        const song = await $('#song-title');
        await song.waitForExist({ timeout: 5000 });
        const songtitle = await song.getText();
        console.log("Old:", songtitle);
        const skip = await $('#skip-forward');
        skip.click();
        await browser.waitUntil(async () => {
            const s = await song.getText();
            console.log("new:", JSON.stringify(s));
            console.log("Not Equals:", s !== songtitle);
            console.log("Equals:", s === songtitle);
            console.log("Evaluate:", (s) !== null && s !== songtitle);
            return (s) !== null && s !== songtitle;
        }, {
            timeout: 5000,
            timeoutMsg: 'expected text to be different after 5s'
        })
        var newsong = await song.getText();
        console.log("New Song:", newsong);
        expect(songtitle != newsong);
    });
    it('should test for play/pause', async () => {
        const windows = await browser.getWindowHandles();
        for (const handle of windows) {
            await browser.switchWindow(handle);
            const currentTitle = await browser.getTitle();
            if (currentTitle === "Spotify listener") {
                break;
            }
        }
        await runAppleScript("compiledFunctions/pause.scpt");
        const pp = await $('#pause-play');
        pp.click();
        await browser.waitUntil(async () => {
            return (await runAppleScript("compiledFunctions/state.scpt")) === "playing"
        }, {
            timeout: 5000,
            timeoutMsg: 'expected track to play after 5s'
        })
        pp.click();
        await browser.waitUntil(async () => {
            return (await runAppleScript("compiledFunctions/state.scpt")) === "paused"
        }, {
            timeout: 5000,
            timeoutMsg: 'expected track to pause after 5s'
        })
    });

    it('should check that Playful connect shows the right QR', async () => {
        await browser.pause(2000);

        const windows = await browser.getWindowHandles();

        for (const handle of windows) {
            await browser.switchWindow(handle);
            const currentTitle = await browser.getTitle();
            if (currentTitle === "Playful Connect") break;
        }

        const qr = await $('#qrcode');
        await qr.waitForExist({ timeout: 5000 });
        const qrcode = await qr.getAttribute('title')
        console.log("QR:", qrcode);

        const ip = fetchIp();

        console.log("Actual:", ip);

        expect(qrcode === ip);
    });
})
