const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');
const auth = require('./middleware/auth');
const { promisifiedReadFileSystem } = require('./db/read');
const { promisifiedWriteFileSystem } = require('./db/write');

const app = express();
dotenv.config();

app.use(express.json());

const PORT = process.env.ENVIRONMENT === "development" ? 3000 : process.env.PORT;

app.get('/', auth, async (_, res) => {
    try {
        const data = await promisifiedReadFileSystem('todos.json');
        res.status(200).send(data);
    } catch (e) {
        res.status(500).send(e);
    }
});

app.post('/todo', auth, async (req, res) => {
    try {
        const name = req.body.name;
        let existingTodos = [];

        try {
            existingTodos = await promisifiedReadFileSystem('todos.json');
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
        }], 'todos.json');
        res.status(201).send();
    } catch (e) {
        res.status(500).send({
            error: e.message
        });
    }
});

app.put(`/todo/:id/:newTodoName`, auth, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const name = req.params.newTodoName;

        const data = await promisifiedReadFileSystem('todos.json');

        let idx = -1;
        for (let i = 0; i < data.length; i++) {
            if (data[i].id === id) {
                idx = i;
                data[i].name = name;
                break;
            }
        }

        if (idx === -1) return res.status(404).send({ error: `Given ID ${id} is invalid` });

        await promisifiedWriteFileSystem(data, 'todos.json');
        res.status(204).send();
    } catch (e) {
        res.status(500).send(e);
    }
});

app.patch(`/todo/complete/:id`, auth, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const data = await promisifiedReadFileSystem('todos.json');

        let idx = -1;
        for (let i = 0; i < data.length; i++) {
            if (data[i].id === id) {
                idx = i;
                data[i].completed = true;
                break;
            }
        }

        if (idx === -1) return res.status(404).send({ error: `Given ID ${id} is invalid` });

        await promisifiedWriteFileSystem(data, 'todos.json');
        res.status(201).send();
    } catch (e) {
        res.status(500).send(e);
    }
});

app.delete(`/todo/:id`, auth, async (req, res) => {
    try {
        const id = Number(req.params.id);
        let data = await promisifiedReadFileSystem('todos.json');

        let idx = -1;
        for (let i = 0; i < data.length; i++) {
            if (data[i].id === id) {
                idx = i;
                break;
            }
        }

        if (idx === -1) return res.status(404).send({ error: `Given ID ${id} is invalid` });

        data = data.filter(todo => todo.id !== id);
        await promisifiedWriteFileSystem(data, 'todos.json');
        res.status(201).send();
    } catch (e) {
        res.status(500).send(e);
    }
});

app.post('/signUp', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const data = await promisifiedReadFileSystem('creds.json');
        const user = data.users.find(user => user.username);

        if (user) {
            res.status(400).send({
                error: "username already exists"
            });
        } else {
            data.users.push({
                username,
                password
            });
            await promisifiedWriteFileSystem(data, 'creds.json');
            res.status(200).send({
                message: "success"
            });
        }
    } catch (e) {
        res.status(500).send(e);
    }
});

app.post('/signIn', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const data = await promisifiedReadFileSystem('creds.json');
        const user = data.users.find(user => user.username);

        if (user) {
            const token = jwt.sign({
                username: user.username
            }, JWT_SECRET);

            res.status(200).send({
                token: token
            });
        } else {
            res.status(404).send({
                error: "username not found"
            });
        }
    } catch (e) {
        res.status(500).send(e);
    }
});

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});
