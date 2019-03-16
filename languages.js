var languages = [];
var commandNames = {
    help: [],
    register: [],
    transfer: [],
    addvalue: [],
    addadmin: [],
    removeadmin: [],
    getvalue: [],
    getactualvalue: [],
    users: [],
    changename: []
};
function addLanguage(rq)
{
    languages.push(rq.language);
    for(let i in rq.commands)
    {
        let cmdName = rq.commands[i];
        commandNames[i].push(...cmdName);
    }
}
addLanguage(require("./lang/enUS.js"));
addLanguage(require("./lang/zhCN.js"));

module.exports = {
    languages: languages,
    commandNames: commandNames
};