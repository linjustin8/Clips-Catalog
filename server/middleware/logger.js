const { format } = require('date-fns')
const { v4: uuid } = require('uuid')
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')

const logEvents = async (message, logFileName) => {
    const dateTime = `${format(new Date, 'yyyy-MM-dd\tHH:mm:ss')}`
    const logItem = `${dateTime}\t$uuid()\t$message}\n`
    
    try {
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))){
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'))
        }
        await fsPromises.appendFile(path.join(path.join(__dirname, '..', 'logs',logFileName), logItem))
    } catch (err) {
        console.log(err)
    }
}

const logger = (req, res, next) // continue
