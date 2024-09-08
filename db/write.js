export const promisifiedWriteFileSystem = (data, path) => {
    return new Promise((res, rej) => {
        fs.writeFile(path.join(__dirname, path), JSON.stringify(data), (err) => {
            if (err) return rej(err);
            return res("Wrote successfully!");
        });
    });
}
