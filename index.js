import { getSkebbers, getSkebber } from './skeb.js';
import { ArgumentParser } from 'argparse';
import delay from 'delay';

const parser = new ArgumentParser();
parser.add_argument('-p', '--price', { nargs: 1, default: 1500, type: 'int' });
parser.add_argument('-n', '--pages', { nargs: 1, default: 5, type: 'int' });
parser.add_argument('-a', '--art', { action: 'store_true' });
parser.add_argument('-v', '--voice', { action: 'store_true' });
parser.add_argument('-t', '--text', { action: 'store_true' });
parser.add_argument('--no-nsfw', { action: 'store_true' });
const args = parser.parse_args();

const discoveredSkebbers = [];

console.log('Searching for:');
args['art'] ? console.log('    * Artists') : null;
args['voice'] ? console.log('    * Voice actors') : null;
args['text'] ? console.log('    * Writers') : null;
console.log(`Over ${args['pages']} pages`);
console.log(`And under ${args['price']} yen`);
console.log('=============================');

let i = 0;
while (i < args['pages']) {
    console.log(`* Retrieving page ${i+1} of artists *`)
    const skebbers = await getSkebbers(i);
    for (let skebberObj of skebbers) {
        const isActive = skebberObj['acceptable'];
        const matchesGenre =
            ( skebberObj['genre'] === 'art' && args['art'] ) ||
            ( skebberObj['genre'] === 'voice' && args['voice'] ) ||
            ( skebberObj['genre'] === 'novel' && args['text'] );
        const matchesNsfw =
            !skebberObj['nsfw_acceptable'] ||
            ( skebberObj['nsfw_acceptable'] && !args['no-nsfw'] );

        if (isActive && matchesGenre && matchesNsfw) {
            console.log(`* Retrieving ${skebberObj['screen_name']} *`);
            const profile = await getSkebber(skebberObj['screen_name']);
            if (profile['default_amount'] <= args['price']) {
                discoveredSkebbers.push(profile);
            }
            console.log('* Waiting 5 seconds to perform the next request *');
            await delay(5 * 1000);
        } else {
            console.log(`* Skipping ${skebberObj['screen_name']} *`);
        }
    }

    i++;
}

let urls = discoveredSkebbers.map(val => `https://skeb.jp/@${val['screen_name']}`);
urls.forEach((url) => {
    console.log(url);
});
