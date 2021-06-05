import { getSkebbers, getSkebber } from './skeb.js';
import { ArgumentParser } from 'argparse';
import delay from 'delay';

const parser = new ArgumentParser();
parser.add_argument('-p', '--price', { nargs: 1, default: 1500, type: 'int' });
parser.add_argument('-n', '--pages', { nargs: 1, default: 5, type: 'int' });
parser.add_argument('-o', '--page-offset', { nargs: 1, default: 0, type: 'int' });
parser.add_argument('-a', '--art', { action: 'store_true' });
parser.add_argument('-v', '--voice', { action: 'store_true' });
parser.add_argument('-t', '--text', { action: 'store_true' });
parser.add_argument('--no-nsfw', { action: 'store_true' });
const args = parser.parse_args();

const discoveredSkebbers = [];

async function processPage(i) {
    try {
        console.log(`* Retrieving page ${i+1} of artists`)
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
                console.log(`* Skipping ${skebberObj['screen_name']}`);
            }
        }
    } catch (e) {
        console.log(`- ERROR: Failed to retrieve page ${i+1} of skebbers, skipping page`);
    }
}

async function processSkebber(screenName) {
    try {
        console.log(`* Retrieving ${screenName}`);
        const profile = await getSkebber(screenName);
        if (profile['default_amount'] <= args['price']) {
            discoveredSkebbers.push(profile);
        }
        console.log('* Waiting 2 seconds to perform the next request');
        await delay(2 * 1000);
    } catch (e) {
        console.log(`- ERROR: There was an error getting ${screenName}'s data`)
    }
}

async function main() {
    console.log('Searching for:');
    args['art'] ? console.log('    * Artists') : null;
    args['voice'] ? console.log('    * Voice actors') : null;
    args['text'] ? console.log('    * Writers') : null;
    console.log(`Over ${args['pages']} pages`);
    console.log(`And under ${args['price']} yen`);
    console.log('=============================');
    
    let i = 0;
    while (i < args['pages']) {
        await processPage(i);
        i++;
    }
    
    let urls = discoveredSkebbers.map(val => `https://skeb.jp/@${val['screen_name']}`);
    urls.forEach((url) => {
        console.log(url);
    });
}

await main();
