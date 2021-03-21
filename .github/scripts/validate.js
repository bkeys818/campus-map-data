"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const tv4_1 = require("tv4");
const core_1 = require("@actions/core");
const schema = JSON.parse(fs_1.readFileSync("./data.schema.json", { encoding: "utf-8" }));
const errors = [];
class FormatError extends Error {
    constructor(message) {
        super(message);
        this.name = "FormatErrors";
    }
}
fs_1.readdir("./data", (error, files) => {
    if (error) {
        error.message = "Couldn't read data directory." + error.message;
        errors.push(error);
        return;
    }
    Promise.all(files.map(file => validateFile(file)))
        .then(isValids => {
        for (const error of errors) {
            console.error(error.name + ': ' + error.message);
        }
        if (!isValids.every((isValid) => isValid)) {
            core_1.setFailed("");
        }
    });
});
function validateFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            try {
                let data = fs_1.readFileSync("./data/" + file, { encoding: "utf-8" });
                let json = JSON.parse(data);
                resolve(validateSchema(json) && checkCampusesNameProp(json));
            }
            catch (err) {
                if (err.code === 'ENOENT')
                    err.message = "Error! Couldn't read file: " + file + ". " + err.message;
                else if (err instanceof SyntaxError)
                    err.message = "Invalid JSON!" + "\nFile: " + file + "\nError: " + err.message;
                errors.push(err);
            }
        });
        function validateSchema(json) {
            let response = tv4_1.validateMultiple(json, schema, true);
            if (!response.valid) {
                const errMesssages = [];
                if (response.missing.length != 0)
                    errMesssages.push("Missing schemas: " + response.missing.join(", "));
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
                        errMesssages.push(errorStr(error) + '\n');
                    }
                }
                errors.push(new FormatError("Invlaid JSON format!\nFile: " + file + "\n" + errMesssages.join('\n')));
                return false;
            }
            else
                return true;
        }
        function checkCampusesNameProp(json) {
            let campuses = json["campuses"];
            if (campuses.length > 1) {
                if (campuses.every(campus => "name" in campus))
                    return true;
                else {
                    errors.push(new FormatError("Items in JSON's campuses array are misssing \"name\" property." + "\nFile: " + file));
                    return false;
                }
            }
            else
                return true;
        }
    });
}
