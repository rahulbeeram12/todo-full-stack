const main = document.querySelector(".main");
const todoHeader = document.querySelector(".todo-header");
const todosList = document.querySelector(".todos-list");

let todos = [];
let idx = 0;
let todoIdMap = {};

function showSignInPage() {
    document.getElementsByClassName("background-signup")[0].style.display = 'none';
    document.getElementsByClassName("background-signin")[0].style.display = '';
}

function showSignUpPage() {
    document.getElementsByClassName("background-signin")[0].style.display = 'none';
    document.getElementsByClassName("background-signup")[0].style.display = '';
}

async function signUp() {
    const username = document.getElementById("sign-up-username").value;
    const password = document.getElementById("sign-up-password").value;

    if (!username || !password) {
        alert('Username or Password must not be empty');
        return;
    }

    const response = await fetch('http://localhost:4000/signup', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        showSignInPage();
    } else {
        alert('something went wrong while signing up');
    }
}

async function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    document.getElementById("logout").style.display = 'none';
    document.getElementById("signin").style.display = '';
    document.getElementById("signup").style.display = '';
    document.getElementsByClassName("todos-list")[0].style.display = 'none';
    document.getElementsByClassName("background-todo")[0].style.display = 'none';
}

async function showTodos(username) {
    document.getElementsByClassName("background-signin")[0].style.display = 'none';
    document.getElementById("signin").style.display = 'none';
    document.getElementById("signup").style.display = 'none';
    document.getElementById("logout").style.display = '';
    document.getElementsByClassName("background-todo")[0].style.display = '';
    document.getElementsByClassName("todos-list")[0].style.display = '';
    document.getElementsByClassName("header-text-username")[0].innerHTML = username;

    const response = await fetch('http://localhost:4000/', {
        method: 'GET',
        headers: {
            Authorization: localStorage.getItem("token")
        }
    });

    if (response.ok) {
        const data = await response.json();
        data.forEach(todo => {
            const t = createTodo(todo.name);
            todoIdMap[todo.name] = todo.id;
            todos.push(t);
        });
        render();
        localStorage.setItem("userId", data[0].userId);
    } else {
        alert('something went wrong while loading todos');
    }
}

async function signIn() {
    const username = document.getElementById("sign-in-username").value;
    const password = document.getElementById("sign-in-password").value;

    if (!username || !password) {
        alert('Username or Password must not be empty');
        return;
    }

    const response = await fetch('http://localhost:4000/signin', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        alert('Signed In Successfully');
        showTodos(data.username);
    } else {
        alert('something went wrong while sigining in');
    }
}

function createTodo(todoText) {
    const todo = document.createElement("div");
    todo.classList.add("todo");

    const input = document.createElement("input");
    input.type = "text";
    input.setAttribute("class", "disabled");
    input.value = todoText;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Save";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("class", `number-${idx}`);
    idx += 1;

    todo.appendChild(input);
    todo.appendChild(editButton);
    todo.appendChild(deleteButton);

    deleteButton.addEventListener("click", () => {
        deleteTodo(Number(todo.lastChild.classList[0].split('-')[1]), todo.firstChild.value);
    });

    editButton.addEventListener("click", () => {
        const originalInputValue = todo.firstChild.value;
        // change input class to enabled and button text to save
        todo.firstChild.classList = [];
        todo.firstChild.setAttribute("class", "enabled");
        const edit = todo.children[1];
        todo.removeChild(edit);

        todo.insertBefore(saveButton, todo.children[1]);

        saveButton.addEventListener("click", async () => {
            const todoInput = todo.firstChild.value;
            if (!todoInput) {
                alert("Todo shouldn't be empty");
                return;
            }

            const todoId = todoIdMap[originalInputValue];
            const response = await fetch(`http://localhost:4000/todo/${todoId}/${todoInput}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: localStorage.getItem("token")
                }
            });
            if (response.ok) {
                todo.firstChild.classList = [];
                todo.firstChild.setAttribute("class", "disabled");
                const save = todo.children[1];
                todo.removeChild(save);
    
                todo.insertBefore(edit, todo.children[1]);
                delete todoIdMap[originalInputValue];
                todoIdMap[todoInput] = todoId;
                alert('edited successfully');
            } else {
                alert('something went wrong while editing todo');
            }
        });
        render();
    });

    return todo;
}

async function addTodo() {
    const todoInput = document.querySelector(".todoInput");
    if (!todoInput.value) {
        alert("Todo shouldn't be empty");
        return;
    }

    const response = await fetch('http://localhost:4000/todo', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            Authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({ name: todoInput.value, userId: parseFloat(localStorage.getItem("userId")) })
    });
    if (response.ok) {
        const data = await response.json();
        const todo = createTodo(todoInput.value);
        todoInput.value = "";

        todos.push(todo);
        todoIdMap[todoInput.value] = data.id;
        alert('added todo successfully');
        render();
    } else {
        alert('something went wrong while adding todo');
    }
}

async function deleteTodo(index, todoName) {
    const response = await fetch(`http://localhost:4000/todo/${todoIdMap[todoName]}`, {
        method: 'DELETE',
        headers: {
            Authorization: localStorage.getItem("token")
        }
    });
    if (response.ok) {
        todos = todos.filter((todo) => Number(todo.lastChild.classList[0].split('-')[1]) !== index);
        render();
        delete todoIdMap[todoName];
        alert('deleted todo successfully');
    } else {
        alert('something went wrong while deleting todo');
    }
}

function render() {
    todosList.replaceChildren(...todos);
}
