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
        try {
            let data = readFileSync("./data/"+file, { encoding: "utf-8" })
            let json = JSON.parse(data)
            let response = validateMultiple(json, schema, true);
            if (!response.valid) {
                if (response.missing.length != 0)
                    console.error("Missing schemas: "+response.missing.join(", "))
                if (response.errors) {
                    for (const error of response.errors) {
                        function errorStr(error: tv4.ValidationError): string {
                            var result = `Validation Error [${error.code}]: ${error.message}`
                            if (error.schemaPath) result += `\n\tSchema path: ${error.schemaPath}`
                            if (error.dataPath) result += `\n\tData path: ${error.dataPath}`
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
        } catch(err) {
            if (err.code === 'ENOENT')
                console.error("Error! Couldn't read file: "+file)
            if (err instanceof SyntaxError)
                console.error("Incorect (basic) JSON format!"+"\nFile: "+file+"\nError: "+err.message)
            else 
                console.error(err)
        }
    })).then(valid => {
        if (!valid.every((isValid) => isValid )) {
            setFailed("")
        }
    })
});