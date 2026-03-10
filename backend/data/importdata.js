const fs = require("fs")
const GD = require("gd.js");

const gd = new GD();

async function getDemonList(amount) {
    let res = await fetch("https://pointercrate.com/api/v2/demons/listed?limit=" + amount)
    let data = await res.json()
    return data
}

async function getLevel(id) {
    let level = await gd.levels.get(id)
    return level
}


let finalData = []

async function transform() {
    let demons = await getDemonList(100)
    for(let i=0; i<demons.length; i++){
        let data = await getLevel(demons[i]["level_id"])
        let transformed = {"id": demons[i]["level_id"], "name": demons[i]["name"],"position": demons[i]["position"], "creator": demons[i]["publisher"]["name"], "verifier": demons[i]["verifier"]["name"], "thumbnail": demons[i]["thumbnail"], "downloads": data["stats"]["downloads"], "length": data["stats"]["length"]["raw"]}
        finalData.push(transformed)

    fs.writeFile("finaldata.json", JSON.stringify(finalData, null, 2), (err) => {
    if (err){
        console.log("error writing file")
    }
    else{
        console.log("writing successful")
    }
})
}
    
}

transform()

