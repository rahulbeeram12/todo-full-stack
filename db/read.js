export const promisifiedReadFileSystem = (path) => {
    return new Promise((res, rej) => {
        fs.readFile(path.join(__dirname, path), 'utf-8', (err, data) => {
            if (err) return rej(err);
            return res(JSON.parse(data));
        });
    });
}
