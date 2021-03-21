import { readFileSync, readdir } from "fs";
import { validateMultiple } from "tv4";
import { setFailed } from "@actions/core"

const schema = JSON.parse(readFileSync("./data.schema.json", { encoding: "utf-8" }))

const errors: (Error | FormatError | SyntaxError)[] = []
class FormatError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "FormatErrors"
    }
}

readdir("./data", (error, files) => {
    if (error) {
        error.message = "Couldn't read data directory." + error.message
        errors.push(error)
        return
    }
    Promise.all(files.map(file => validateFile(file)))
        .then(isValids => {
        for (const error of errors) {
            console.error(error.name+': '+error.message)
        }
        if (!isValids.every((isValid) => isValid )) {
            setFailed("")
        }
    })
});

async function validateFile(file: string): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            let data = readFileSync("./data/"+file, { encoding: "utf-8" })
            let json = JSON.parse(data)
            resolve(validateSchema(json) && checkCampusesNameProp(json))
        } catch(err) {
            if (err.code === 'ENOENT')
                err.message = "Error! Couldn't read file: "+file+". "+err.message
            else if (err instanceof SyntaxError)
                err.message = "Invalid JSON!"+"\nFile: "+file+"\nError: "+err.message
            errors.push(err)
        }
    })

    function validateSchema(json: any): boolean {
        let response = validateMultiple(json, schema, true);
        if (!response.valid) {
            const errMesssages = []
            if (response.missing.length != 0)
                errMesssages.push("Missing schemas: "+response.missing.join(", "))
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
                    errMesssages.push(errorStr(error)+'\n')
                }
            }
            errors.push(new FormatError("Invlaid JSON format!\nFile: "+file+"\n"+errMesssages.join('\n')))
            return false
        } else return true
    }
    function checkCampusesNameProp(json: any): boolean {
        type Campus = { name: string, region: object, places: object[] }
        let campuses = json["campuses"] as [Campus]
        if (campuses.length > 1) {
            if (campuses.every(campus => "name" in campus)) return true
            else {
                errors.push(new FormatError("Items in JSON's campuses array are misssing \"name\" property."+"\nFile: "+file))
                return false
            }
        } else return true
    }
}