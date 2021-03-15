"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const tv4_1 = require("tv4");
const core_1 = require("@actions/core");
const schema = JSON.parse(fs_1.readFileSync("./data.schema.json", { encoding: "utf-8" }));
fs_1.readdir("./data", (error, files) => {
    if (error) {
        console.error(error);
        return;
    }
    Promise.all(files.map(function (file) {
        try {
            let data = fs_1.readFileSync("./data/" + file, { encoding: "utf-8" });
            let json = JSON.parse(data);
            let response = tv4_1.validateMultiple(json, schema, true);
            if (!response.valid) {
                if (response.missing.length != 0)
                    console.error("Missing schemas: " + response.missing.join(", "));
                if (response.errors) {
                    for (const error of response.errors) {
                        function errorStr(error) {
                            var result = `Validation Error [${error.code}]: ${error.message}`;
                            if (error.schemaPath)
                                result += `\n\tSchema path: ${error.schemaPath}`;
                            if (error.dataPath)
                                result += `\n\tData path: ${error.dataPath}`;
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
        }
        catch (err) {
            if (err.code === 'ENOENT')
                console.error("Error! Couldn't read file: " + file);
            if (err instanceof SyntaxError)
                console.error("Incorect (basic) JSON format!" + "\nFile: " + file + "\nError: " + err.message);
            else
                console.error(err);
        }
    })).then(valid => {
        if (!valid.every((isValid) => isValid)) {
            core_1.setFailed("");
        }
    });
});
