import axios from 'axios';
import https from 'https';

const PAGE_SIZE = 90;
const HOST = 'https://skeb.jp';
const GET_USERS_PATH = '/api/users';

const httpsAgent = new https.Agent({ keepAlive: true });
const connection = axios.create({ httpsAgent });

async function getSkebbers(page) {
    const offset = page * PAGE_SIZE;
    const queryString = `?sort=date&offset=${offset}&limit=${PAGE_SIZE}`;
    const response = await connection.get(HOST + GET_USERS_PATH + queryString);
    return response.data;
}

async function getSkebber(name) {
    const pathParam = `/${name}`;
    const response = await connection.get(HOST + GET_USERS_PATH + pathParam);
    return response.data;
}

export {
    getSkebbers,
    getSkebber
}
