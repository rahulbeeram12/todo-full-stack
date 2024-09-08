const jwt = require("jsonwebtoken");
const { promisifiedReadFileSystem } = require("../db/read");
export const JWT_SECRET = 'JS_SECRET';

const auth = async (req, res, next) => {
    const token = req.headers.authorization;

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                res.status(401).send({
                    message: 'Unauthorized'
                });
            } else {
                req.body.username = decoded
                next();
            }
        })
    } else {
        res.status(404).send({
            message: "token not found"
        })
    }
}

export default auth;