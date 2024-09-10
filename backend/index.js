const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');
const { auth } = require('./middleware/auth');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const client = new PrismaClient();

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());

const PORT = process.env.ENVIRONMENT === "development" ? 4000 : process.env.PORT;

app.get('/', auth, async (req, res) => {
    const username = req.body.username;
    try {
        const data = await client.user.findFirst({
            where: {
                username: {
                    equals: username
                },
            },
            include: {
                todos: true
            }
        });
        res.status(200).send(data.todos);
    } catch (e) {
        res.status(500).send({
            message: e
        });
    }
});

app.post('/todo', auth, async (req, res) => {
    try {
        const name = req.body.name; // todo name
        const userId = parseInt(req.body.userId);
        const username = req.body.username;
        const todo = await client.todo.findFirst({
            where: {
                name: name,
                user: {
                    username: {
                        equals: username
                    }
                }
            }
        });

        if (todo) throw new Error("Todo name already exists");

        const newTodo = await client.todo.create({
            data: {
                name: name,
                userId: userId,
                completed: false
            }
        });
        res.status(201).send({
            id: newTodo.id
        });
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
        const username = req.body.username;

        const data = await client.todo.findFirst({
            where: {
                id: {
                    equals: id
                },
                user: {
                    username: {
                        equals: username
                    }
                }
            }
        });

        if (!data) return res.status(404).send({ error: `${username} with Todo ID ${id} not found` });

        await client.todo.update({
            where: {
                id: id   
            },
            data: {
                name: name
            }
        });
        res.status(204).send();
    } catch (e) {
        res.status(500).send(e);
    }
});

app.delete(`/todo/:id`, auth, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const username = req.body.username;
        const data = await client.todo.findFirst({
            where: {
                id: {
                    equals: id
                },
                user: {
                    username: {
                        equals: username
                    }
                }
            }
        });

        if (!data) return res.status(404).send({ error: `${username} with Todo ID ${id} not found` });
        
        await client.todo.delete({
            where: {
                id: id
            }
        });
        res.status(201).send();
    } catch (e) {
        res.status(500).send(e);
    }
});

app.post('/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const user = await client.user.findFirst({
            where: {
                username: username
            }
        });

        if (user) {
            res.status(400).send({
                error: "username already exists"
            });
        } else {
            await client.user.create({
                data: {
                    username: username,
                    password: password
                }
            });
            res.status(200).send({
                message: "success"
            });
        }
    } catch (e) {
        res.status(500).send(e);
    }
});

app.post('/signin', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const user = await client.user.findFirst({
            where: {
                username: username,
                password: password
            }
        });
        if (user) {
            const token = jwt.sign({
                username: user.username
            }, JWT_SECRET);

            res.status(200).send({
                token: token,
                username
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
