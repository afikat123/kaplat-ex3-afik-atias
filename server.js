const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const prettier = require('prettier');
const pino = require('pino');
const pretty = require('pino-pretty');
const {Writable} = require('stream');
const fs = require('fs');
const requestsLogStream = fs.createWriteStream('./logs/requests.log');
const prettyRequestsStream = new Writable({
    write(chunk, encoding, callback) {
        const log = JSON.parse(chunk.toString());
        const level = log.level;
        let levelString;
        switch (level) {
            case 10: levelString = 'TRACE';
                break;
            case 20: levelString = 'DEBUG';
                break;
            case 30: levelString = 'INFO';
                break;
            case 40: levelString = 'WARN';
                break;
            case 50: levelString = 'ERROR';
                break;
            case 60: levelString = 'FATAL';
                break;
            default: levelString = 'USERLVL' + level;
        }
        const date = new Date(log.time);
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
        const time = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
        const msg = log.msg;
        const output = `${time} ${levelString}: ${msg} \n`;
        process.stdout.write(output);
        requestsLogStream.write(output);
        callback();
    }
});

let logLevel = 'info';
const requestLogger = pino({
    level: logLevel
}, prettyRequestsStream);


// let logLevel = 'info'
// const requestLogger = pino({
//     level: logLevel,
//     transport: {
//         targets: [
//             {
//                 target: 'pino-pretty',
//                 level: logLevel,
//                 options: {
//                     colorize: false,
//                     translateTime: 'dd-mm-yyyy hh:mm:ss.l',
//                     ignore: 'pid,hostname',
//                     destination: './logs/requests.log'
//                 }
//             }, {
//                 target: 'pino-pretty',
//                 level: logLevel,
//                 options: {
//                     colorize: true,
//                     translateTime: 'dd-mm-yyyy hh:mm:ss.l',
//                     ignore: 'pid,hostname'
//                 }
//             }
//         ]
//     }
// })

// const todoLogger = pino({
//     level: 'info',
//     transport: {
//         target: 'pino-pretty',
//         options: {
//             colorize: false,
//             translateTime: 'dd-mm-yyyy hh:mm:ss.l',
//             ignore: 'pid,hostname',
//             destination: './logs/todos.log',
//             level: 'info'

//         }
//     }
// })
const todoLogStream = fs.createWriteStream('./logs/todos.log');
const prettyTodoStream = new Writable({
    write(chunk, encoding, callback) {
        const log = JSON.parse(chunk.toString());
        const level = log.level;
        let levelString;
        switch (level) {
            case 10: levelString = 'TRACE';
                break;
            case 20: levelString = 'DEBUG';
                break;
            case 30: levelString = 'INFO';
                break;
            case 40: levelString = 'WARN';
                break;
            case 50: levelString = 'ERROR';
                break;
            case 60: levelString = 'FATAL';
                break;
            default: levelString = 'USERLVL' + level;
        }
        const date = new Date(log.time);
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
        const time = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
        const msg = log.msg;
        const output = `${time} ${levelString}: ${msg} \n`;
        todoLogStream.write(output);
        callback();
    }
});

const todoLogger = pino({
    level: 'info'
}, prettyTodoStream);


let globalRequestCounter = 1;
let id = 1;
const taskList = [];

class task {
    constructor(title, content, dueDate, status) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.status = status;
        this.dueDate = dueDate;

    }
}

function checkNewTaskDueDate(dueDate) {
    const time = new Date();
    const timeStamp = time.getTime();
    if (timeStamp > dueDate) {
        return false;
    } else {
        return true
    }
}

function checkNewTaskTitle(title) {
    for (let i = 0; i < taskList.length; i++) {
        if (title === taskList[i].title) {
            return false;
        }
    }
    return true;
}

function sortById(a, b) {
    return a.id - b.id;
}

function sortByDueDate(a, b) {
    if (a.dueDate >= b.dueDate) {
        return 1;
    } else {
        return -1;
    }
}

function sortByTitle(a, b) {
    return a.title.localeCompare(b.title);
}

app.use(bodyParser.json());

app.get(`/todo/health`, (req, res) => {
    let before = Date.now();
    res.status(200).send(`OK`);
    requestLogger.info(`Incoming request | #${
        globalRequestCounter
    } | resource: ${
        req.path
    } | HTTP Verb ${
        req.method
    } | request #${globalRequestCounter}`);
    requestLogger.debug(`request #${
        globalRequestCounter
    } duration: ${
        Date.now() - before
    }ms | request #${globalRequestCounter}`);
    globalRequestCounter++;
});

app.post(`/todo`, (req, res) => {
    let before = Date.now();
    let userParam = JSON.stringify(req.body);
    let taskTitle = JSON.parse(userParam).title;
    let taskContent = JSON.parse(userParam).content;
    let taskDueDate = JSON.parse(userParam).dueDate;
    let taskDueDateNumber = parseInt(taskDueDate, 10);
    requestLogger.info(`Incoming request | #${
        globalRequestCounter
    } | resource: ${
        req.path
    } | HTTP Verb ${
        req.method
    } | request #${globalRequestCounter}`);
    todoLogger.info(`Creating new TODO with Title [${taskTitle}] | request #${globalRequestCounter}`);

    // DEBUG
    {
        let taskDate = new Date(taskDueDateNumber);
        console.log(`ID: ${id} \nTitle: ${taskTitle} \nContent: ${taskContent} \nDue Date: ${
            taskDate.toLocaleDateString('il-IL')
        }`);
    }

    if (checkNewTaskTitle(taskTitle) == false) {
        res.status(409).send({errorMessage: `Error: TODO with the title [${taskTitle}] already exists in the system`});
        console.log(`Error: TODO with the title [${taskTitle}] already exists in the system\n`);
        todoLogger.error(`Error: TODO with the title [${taskTitle}] already exists in the system | request #${globalRequestCounter}`);
    } else if (checkNewTaskDueDate(taskDueDate) == false) {
        res.status(409).send({errorMessage: "Error: Can’t create new TODO that its due date is in the past"});
        todoLogger.error(`Error: Can’t create new TODO that its due date is in the past | request #${globalRequestCounter}`);
        console.log(`Error: Can’t create new TODO that its due date is in the past\n`);
    } else {
        taskList.push(new task(taskTitle, taskContent, taskDueDate, `PENDING`));
        console.log(`New TODO!\n`)
        id++;
        res.status(200).send({
            result: id - 1
        });
        todoLogger.debug(`Currently there are ${
            taskList.length - 1
        } TODOs in the system. New TODO will be assigned with id ${
            id - 1
        } | request #${globalRequestCounter}`);

    } requestLogger.debug(`request #${
        globalRequestCounter
    } duration: ${
        Date.now() - before
    }ms | request #${globalRequestCounter}`);
    globalRequestCounter++;
});

app.get(`/todo/size`, (req, res) => {
    let before = Date.now();
    requestLogger.info(`Incoming request | #${
        globalRequestCounter
    } | resource: ${
        req.path
    } | HTTP Verb ${
        req.method
    } | request #${globalRequestCounter}`);
    const reqStatus = req.query.status
    console.log(`Looking for the amount of ${
        reqStatus
    } TODO's:\n`)
    if (reqStatus === "PENDING" || reqStatus === "LATE" || reqStatus === "DONE") {
        let filteredList = taskList.filter(task => task.status === reqStatus);
        res.status(200).send({result: filteredList.length});
        console.log(`The amount of ${reqStatus} TODO's is: ${
            filteredList.length
        }\n`)
        todoLogger.info(`Total TODOs count for state ${reqStatus} is ${
            filteredList.length
        } | request #${globalRequestCounter}`);
    } else if (reqStatus === "ALL") {
        res.status(200).send({result: taskList.length});
        console.log(`The amount of ALL TODO's is ${
            taskList.length
        }`);
        todoLogger.info(`Total TODOs count for state ${reqStatus} is ${
            taskList.length
        } | request #${globalRequestCounter}`);
    } else {
        res.status(400).send();
    } requestLogger.debug(`request #${
        globalRequestCounter
    } duration: ${
        Date.now() - before
    }ms | request #${globalRequestCounter}`);
    globalRequestCounter++;


});

app.get(`/todo/content`, (req, res) => {
    let before = Date.now();
    requestLogger.info(`Incoming request | #${
        globalRequestCounter
    } | resource: ${
        req.path
    } | HTTP Verb ${
        req.method
    } | request #${globalRequestCounter}`);
    const reqStatus = req.query.status;
    let reqSortBy = req.query.sortBy;
    console.log(`Looking for the content of all ${reqStatus} TODO's sorted by ${reqSortBy}:\n`);
    if (reqStatus === "PENDING" || reqStatus === "LATE" || reqStatus === "DONE") {
        let orderedList = taskList.filter(task => task.status === reqStatus);
        if (reqSortBy === "DUE_DATE") {
            orderedList.sort(sortByDueDate);
        } else if (reqSortBy === "TITLE") {
            orderedList.sort(sortByTitle);
        } else {
            orderedList.sort(sortById);
            reqSortBy = "ID";
        }

        const formattedJson = prettier.format(JSON.stringify(orderedList), {
            parser: 'json',
            printWidth: 80,
            tabWidth: 2,
            useTabs: false,
            semi: true,
            singleQuote: true
        });
        res.status(200).send({result: JSON.parse(formattedJson)});
        console.log(`The TODO's with status ${reqStatus} are:\n`)
        orderedList.forEach((task) => {
            console.log(task)
        })
        todoLogger.info(`Extracting todos content. Filter: ${reqStatus} | Sorting by: ${reqSortBy} | request #${globalRequestCounter}`);
        todoLogger.debug(`There are a total of ${
            taskList.length
        } todos in the system. The result holds ${
            orderedList.length
        } todos | request #${globalRequestCounter}`);
    } else if (reqStatus === "ALL") {
        if (reqSortBy === "DUE_DATE") {
            taskList.sort(sortByDueDate);
        } else if (reqSortBy === "TITLE") {
            taskList.sort(sortByTitle);
        } else {
            taskList.sort(sortById);
        }
        const formattedJson = prettier.format(JSON.stringify(taskList), {
            parser: 'json',
            printWidth: 80,
            tabWidth: 2,
            useTabs: false,
            semi: true,
            singleQuote: true
        });
        res.status(200).send({result: JSON.parse(formattedJson)});
        console.log(`All the TODO's are:\n`);
        taskList.forEach((task) => {
            console.log(task);
        });
        todoLogger.info(`Extracting todos content. Filter: ${reqStatus} | Sorting by: ${reqSortBy} | request #${globalRequestCounter}`);
        todoLogger.debug(`There are a total of ${
            taskList.length
        } todos in the system. The result holds ${
            taskList.length
        } todos | request #${globalRequestCounter}`);
    } else {
        res.status(400).send();
    } requestLogger.debug(`request #${
        globalRequestCounter
    } duration: ${
        Date.now() - before
    }ms | request #${globalRequestCounter}`);
    globalRequestCounter++;
});

app.put('/todo', (req, res) => {
    let before = Date.now();
    requestLogger.info(`Incoming request | #${
        globalRequestCounter
    } | resource: ${
        req.path
    } | HTTP Verb ${
        req.method
    } | request #${globalRequestCounter}`);
    const reqId = parseInt(req.query.id, 10);
    const newStatus = req.query.status;
    todoLogger.info(`Update TODO id [${reqId}] state to ${newStatus} | request #${globalRequestCounter}`);
    console.log(newStatus, typeof(reqId));
    let found = false;
    if (newStatus !== 'PENDING' && newStatus !== 'LATE' && newStatus !== 'DONE') {
        res.status(400).send();
    } else {
        taskList.forEach((task) => {
            if (task.id === reqId && found === false) {
                const oldStatus = task.status;
                task.status = newStatus;
                found = true;
                res.status(200).send({result: oldStatus});
                todoLogger.debug(`Todo id [${
                    task.id
                }] state change: ${oldStatus} --> ${
                    task.status
                } | request #${globalRequestCounter}`);

            }
        })
        if (found === false) {
            res.status(404).send({errorMessage: `Error: no such TODO with id ${reqId}`});
            todoLogger.error(`Error: no such TODO with id ${reqId} | request #${globalRequestCounter}`);
        }
    } requestLogger.debug(`request #${
        globalRequestCounter
    } duration: ${
        Date.now() - before
    }ms | request #${globalRequestCounter}`);
    globalRequestCounter++;

});

app.delete('/todo', (req, res) => {
    let before = Date.now();
    requestLogger.info(`Incoming request | #${
        globalRequestCounter
    } | resource: ${
        req.path
    } | HTTP Verb ${
        req.method
    } | request #${globalRequestCounter}`);
    const idToDelete = parseInt(req.query.id, 10);
    const index = taskList.map(function (task) {
        return task.id
    }).indexOf(idToDelete);
    if (index > -1) {
        taskList.splice(index, 1);
        res.status(200).send({result: idToDelete});
        todoLogger.info(`Removing todo id ${idToDelete} | request #${globalRequestCounter}`);
        todoLogger.debug(`After removing todo id [${idToDelete}] there are ${
            taskList.length
        } TODOs in the system | request #${globalRequestCounter}`);
    } else {
        res.status(404).send({errorMessage: `Error: no such TODO with id ${idToDelete}`})
        todoLogger.error(`Error: no such TODO with id ${idToDelete} | request #${globalRequestCounter}`);
    } requestLogger.debug(`request #${
        globalRequestCounter
    } duration: ${
        Date.now() - before
    }ms | request #${globalRequestCounter}`);
    globalRequestCounter++;

})

app.get('/logs/level', (req, res) => {
    let before = Date.now();
    requestLogger.info(`Incoming request | #${globalRequestCounter} | resource: ${
        req.url
    } | HTTP Verb ${
        req.path
    } | request #${globalRequestCounter}`);
    let requestedLog = req.query["logger-name"];
    if (requestedLog === `todo-logger`) {
        let result = todoLogger.level;
        res.status(200).send(result.toString().toUpperCase());
    } else if (requestedLog === `request-logger`) {
        let result = requestLogger.level;
        res.status(200).send(result.toString().toUpperCase());
    } else {
        res.status(400).send("Error! Bad logger name");
    } requestLogger.debug(`request #${globalRequestCounter} duration: ${
        Date.now() - before
    }ms | request #${globalRequestCounter}`);
    globalRequestCounter++;
})

app.put('/logs/level', (req, res) => {
    let before = Date.now();
    requestLogger.info(`Incoming request | #${globalRequestCounter} | resource: ${
        req.path
    } | HTTP Verb ${
        req.method
    } | request #${globalRequestCounter}`);
    let requestedLog = req.query["logger-name"];
    let requestedLevel = req.query["logger-level"];
    if (requestedLevel !== 'ERROR' && requestedLevel !== 'INFO' && requestedLevel !== 'DEBUG') {
        res.status(400).send("Error! Bad level!");
    }
    if (requestedLog === 'request-logger') {
        logLevel = requestedLevel.toString().toLowerCase();
        requestLogger.level = logLevel;
        res.status(200).send(requestedLevel.toString().toUpperCase());
    } else if (requestedLog === 'todo-logger') {
        todoLogger.level = requestedLevel.toString().toLowerCase();
        res.status(200).send(requestedLevel.toString().toUpperCase());
    } else {
        res.status(400).send("Error! Bad logger name");
    } requestLogger.debug(`request #${
        globalRequestCounter
    } duration: ${
        Date.now() - before
    }ms | request #${globalRequestCounter}`);
    globalRequestCounter++;
})

const server = app.listen(9583, () => {
    console.log("Server is listening on port 9583.... \n");
})
