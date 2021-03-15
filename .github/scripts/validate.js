"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const tv4_1 = require("tv4");
const core_1 = require("@actions/core");
const schema = JSON.parse(fs_1.readFileSync("data.schema.json", { encoding: "utf-8" }));
fs_1.readdir("./data", (error, files) => {
    if (error) {
        console.error(error);
        return;
    }
    Promise.all(files.map(function (file) {
        let json = JSON.parse(fs_1.readFileSync(file, { encoding: "utf-8" }));
        let response = tv4_1.validateMultiple(json, schema, true);
        if (!response.valid) {
            if (response.missing)
                console.error("Missing schemas: " + response.missing.join(", "));
            if (response.errors) {
                for (const error of response.errors) {
                    function errorStr(error) {
                        var result = `Validation Error [${error.code}]: ${error.message}`;
                        if (error.schemaPath)
                            result += `\nSchema path: ${error.schemaPath}`;
                        if (error.dataPath)
                            result += `\nData path: ${error.dataPath}`;
                        if (error.subErrors)
                            error.subErrors.forEach(error => {
                                result += '\n' + errorStr(error);
                            });
                        return result;
                    }
                    console.error(errorStr(error) + '\n');
                }
            }
            return false;
        }
        else
            return true;
    })).then(valid => {
        if (!valid.every((isValid) => isValid)) {
            core_1.setFailed("");
        }
    });
});