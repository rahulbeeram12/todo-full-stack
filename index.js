const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');

const app = express();
dotenv.config();

app.use(express.json())

const PORT = process.env.ENVIRONMENT === "development" ? 3000 : process.env.PORT;

const promisifiedReadFileSystem = () => {
    return new Promise((res, rej) => {
        fs.readFile(path.join(__dirname, 'todos.json'), 'utf-8', (err, data) => {
            if (err) return rej(err);
            return res(JSON.parse(data));
        });
    });
}

const promisifiedWriteFileSystem = (data) => {
    return new Promise((res, rej) => {
        fs.writeFile(path.join(__dirname, 'todos.json'), JSON.stringify(data), (err) => {
            if (err) return rej(err);
            return res("Wrote successfully!");
        });
    });
}

app.get('/', async (_, res) => {
    try {
        const data = await promisifiedReadFileSystem();
        res.status(200).send(data);
    } catch (e) {
        res.status(500).send(e);
    }
});

app.post('/todo', async (req, res) => {
    try {
        const name = req.body.name;
        let existingTodos = [];

        try {
            existingTodos = await promisifiedReadFileSystem();
        } catch (e) {
            if (e.code !== 'ENOENT') throw new Error(e);
        }

        let idx = -1;
        for (let i = 0; i < existingTodos.length; i++) {
            if (existingTodos[i].name === name) {
                idx = i;
                break;
            }
        }

        if (idx !== -1) throw new Error("Todo name already exists");

        await promisifiedWriteFileSystem([...existingTodos, {
            id: Math.floor(Math.random() * 100000000) + 1,
            name: name,
            completed: false
        }]);
        res.status(201).send();
    } catch (e) {
        res.status(500).send({
            error: e.message
        });
    }
});

app.put(`/todo/:id/:newTodoName`, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const name = req.params.newTodoName;

        const data = await promisifiedReadFileSystem();

        let idx = -1;
        for (let i = 0; i < data.length; i++) {
            if (data[i].id === id) {
                idx = i;
                data[i].name = name;
                break;
            }
        }

        if (idx === -1) return res.status(404).send({ error: `Given ID ${id} is invalid` });

        await promisifiedWriteFileSystem(data);
        res.status(204).send();
    } catch (e) {
        res.status(500).send(e);
    }
});

app.patch(`/todo/complete/:id`, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const data = await promisifiedReadFileSystem();

        let idx = -1;
        for (let i = 0; i < data.length; i++) {
            if (data[i].id === id) {
                idx = i;
                data[i].completed = true;
                break;
            }
        }

        if (idx === -1) return res.status(404).send({ error: `Given ID ${id} is invalid` });

        await promisifiedWriteFileSystem(data);
        res.status(201).send();
    } catch (e) {
        res.status(500).send(e);
    }
});

app.delete(`/todo/:id`, async (req, res) => {
    try {
        const id = Number(req.params.id);
        let data = await promisifiedReadFileSystem();

        let idx = -1;
        for (let i = 0; i < data.length; i++) {
            if (data[i].id === id) {
                idx = i;
                break;
            }
        }

        if (idx === -1) return res.status(404).send({ error: `Given ID ${id} is invalid` });

        data = data.filter(todo => todo.id !== id);
        await promisifiedWriteFileSystem(data);
        res.status(201).send();
    } catch (e) {
        res.status(500).send(e);
    }
});

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});
