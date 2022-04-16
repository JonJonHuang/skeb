import { getSkebbers, getSkebber } from './skeb.js';
import { ArgumentParser } from 'argparse';
import chalk from 'chalk';
import child from 'child_process';
import delay from 'delay';

const parser = new ArgumentParser();
parser.add_argument('-l', '--lower-bound', { nargs: 1, default: 1000, type: 'int' });
parser.add_argument('-u', '--upper-bound', { nargs: 1, default: 2000, type: 'int' });
parser.add_argument('-n', '--pages', { nargs: 1, default: 5, type: 'int' });
parser.add_argument('-o', '--page-offset', { nargs: 1, default: 0, type: 'int' });
parser.add_argument('-a', '--art', { action: 'store_true' });
parser.add_argument('-v', '--voice', { action: 'store_true' });
parser.add_argument('-t', '--text', { action: 'store_true' });
parser.add_argument('-c', '--console', { action: 'store_true' });
parser.add_argument('--no-nsfw', { action: 'store_true' });
const args = parser.parse_args();

const discoveredSkebbers = [];

async function processPage(i) {
    try {
        console.log(chalk.magentaBright(`* Retrieving page ${i+1} of artists`));
        const skebbers = await getSkebbers(i + args['page_offset']);
        for (let skebberObj of skebbers) {
            const isActive = skebberObj['acceptable'];
            const matchesGenre =
                ( skebberObj['genre'] === 'art' && args['art'] ) ||
                ( skebberObj['genre'] === 'voice' && args['voice'] ) ||
                ( skebberObj['genre'] === 'novel' && args['text'] );
            const matchesNsfw =
                !skebberObj['nsfw_acceptable'] ||
                ( skebberObj['nsfw_acceptable'] && !args['no_nsfw'] );
    
            if (isActive && matchesGenre && matchesNsfw) {
                await processSkebber(skebberObj['screen_name']);
            } else {
                console.log(chalk.grey(`* Skipping ${skebberObj['screen_name']}`));
            }
        }
    } catch (e) {
        console.log(chalk.redBright(`- ERROR: Failed to retrieve page ${i+1} of skebbers, skipping page`));
    }
}

async function processSkebber(screenName) {
    try {
        console.log(chalk.blueBright(`* Retrieving ${screenName}`));
        const profile = await getSkebber(screenName);
        if (profile['default_amount'] >= args['lower_bound'] && profile['default_amount'] <= args['upper_bound']) {
            discoveredSkebbers.push(profile);
        }
        await delay(2 * 1000);
    } catch (e) {
        console.log(chalk.redBright(`- ERROR: There was an error getting ${screenName}'s data`));
    }
}

async function main() {
    console.log(chalk.greenBright('Searching for:'));
    args['art'] ? console.log('    * Artists') : null;
    args['voice'] ? console.log('    * Voice actors') : null;
    args['text'] ? console.log('    * Writers') : null;
    console.log(`Over ${args['pages']} pages`);
    console.log(`And between ${args['lower_bound']} and ${args['upper_bound']} yen`);
    console.log('=============================');
    
    let i = 0;
    while (i < args['pages']) {
        await processPage(i);
        i++;
    }
    
    console.log(chalk.greenBright(`\nMatched ${discoveredSkebbers.length} Skebbers${discoveredSkebbers.length ? "!" : "."}`));
    if(!args['console']) console.log(chalk.green("\nOpening skeb profiles in browser:"));

    const start = process.platform == 'win32' ? 'start' : 'open';
    discoveredSkebbers.forEach((skebber) => {
        let url = `https://skeb.jp/@${skebber['screen_name']}`;
        console.log(url);
        if(!args['console'] && discoveredSkebbers.length <= 25) {
            child.exec(`${start} ${url}`);
        }
    });
}

await main();
