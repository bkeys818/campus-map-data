import { readFileSync, readdir } from "fs";
import { validateMultiple } from "tv4";
import { setFailed } from "@actions/core"

const schema = JSON.parse(readFileSync("./data.schema.json", { encoding: "utf-8" }))

readdir("./data", (error, files) => {
    if (error) {
        console.error(error);
        return;
    }
    Promise.all(files.map(function(file){
        let json = JSON.parse(readFileSync("./data/"+file, { encoding: "utf-8" }))
        let response = validateMultiple(json, schema, true);
        if (!response.valid) {
            if (response.missing)
                console.error("Missing schemas: "+response.missing.join(", "))
            if (response.errors) {
                for (const error of response.errors) {
                    function errorStr(error: tv4.ValidationError): string {
                        var result = `Validation Error [${error.code}]: ${error.message}`
                        if (error.schemaPath) result += `\nSchema path: ${error.schemaPath}`
                        if (error.dataPath) result += `\nData path: ${error.dataPath}`
                        if (error.subErrors) error.subErrors.forEach(error => {
                            result += '\n'+errorStr(error)
                        });
                        return result
                    }
                    console.error(errorStr(error)+'\n')
                }
            }
            return false
        } else return true
    })).then(valid => {
        if (!valid.every((isValid) => isValid )) {
            setFailed("")
        }
    })
});