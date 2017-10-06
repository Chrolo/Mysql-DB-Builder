const fs = require('fs');
const path = require('path');

function jsonFileLoader(filePath){
    const FILEPATH = path.resolve(process.cwd(), filePath);
    if(fs.existsSync(FILEPATH)){
        const fileContent = require(FILEPATH);
        try{
            return JSON.parse(JSON.stringify(fileContent));
        } catch (err) {
            console.error(`[JsonFileLoader] File '${FILEPATH}' could not be parsed.`, err);
            return null;
        }
    } else {
        console.error(`[JsonFileLoader] File '${FILEPATH}' could not be found.`);
        return null;
    }
}

module.exports= jsonFileLoader;
