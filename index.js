const FS = require("fs");
const PATH = require("path");

const Discord = require("discord.js");
const cleanup = require("node-cleanup");
const Bank = require("./bank.js");
const lang = require("./languages.js");

const commandTrigger = "$";
const userPageSize = 12;
const bankpath = PATH.join(__dirname, "bank.json");
const permissionLevels = {
    god: 4, admin: 3, member: 1, unregistered: 0
};
var nameClosenessThreshold = 4;
var defaultLanguage = "en-US";

var getToken = function(cb)
{
    console.log("getting token");
    var token = process.env.DISCORD_TOKEN;
    cb(token);
};
var commandList = [], bank, client;
function main()
{
    bank = new Bank.Bank();
    try
    {
        console.log("loading bank");
        bank.load(JSON.parse(FS.readFileSync(bankpath)));
    }
    catch(e)
    {
        console.log("failed to load bank");
    }
    bank.on("save", function() { saveBank(false); } );
    addCommand(lang.commandNames.help, permissionLevels.unregistered, function (msg, parts, language, name) {
        if(parts.length != 1)
        {
            msg.channel.send(language.noargs.replace("...name...", name));
            return;
        }
        msg.channel.send(language.help);
    });
    addCommand(lang.commandNames.register, permissionLevels.unregistered, function(msg, parts, language, name) {
        if(parts.length != 1)
        {
            msg.channel.send(language.noargs.replace("...name...", name));
            return;
        }
        var acc = bank.register(msg.author);
        if(acc == null)
        {
            msg.channel.send(language.alreadyregistered + " (__" + msg.author.username + "__)");
            return;
        }
        msg.channel.send(language.justregistered + " (__" + acc.name + "__)");
        saveBank();
    });
    addCommand(lang.commandNames.transfer, permissionLevels.member, function(msg, parts, language, name) {
        if(parts.length != 3)
        {
            msg.channel.send(language.transferargs);
            return;
        }
        var amount = parseFloat(parts[1]);
        if(isNaN(amount))
        {
            msg.channel.send(language.badamount);
            return;
        }
        var recipient = bank.getAccountFromName(parts[2]);
        if(recipient == null)
        {
            failedToFindAccountFromName(parts[2], function(text) { msg.channel.send(text); });
            return;
        }
        var trans = bank.transfer(msg.author.id, recipient.clientid, amount);
        if(trans[0] == null)
        {
            if(trans[1] == 1)
            {
                msg.channel.send(language.failedtofindyouraccount + " (__" + msg.author.username + "__)");
            }
            msg.channel.send(language.transactionuserfailed);
            return;
        }
        console.log(trans[0].toString());
        if(trans[0].perform())
        {
            msg.channel.send(language.transactionsuccess.replace("...recipient...", recipient.name));
        }
        else
        {
            msg.channel.send(language.transactionfailed);
        }
        saveBank();
    });
    addCommand(lang.commandNames.addvalue, permissionLevels.admin, function(msg, parts, language, name) {
        if(parts.length != 3)
        {
            msg.channel.send(language.transferargs.replace("...name...", name));
            return;
        }
        var account = bank.getAccountFromName(parts[2]);
        if(account == null)
        {
            failedToFindAccountFromName(parts[2], function(text) { msg.channel.send(text); });
            return;
        }
        var amount = parseFloat(parts[1]);
        if(isNaN(amount))
        {
            msg.channel.send(language.badamount);
            return;
        }
        account.value += amount;
        msg.channel.send(language.addedvalue.replace("...amount...", amount).replace("...account...", account.name));
        saveBank();
    });
    addCommand(lang.commandNames.addadmin, permissionLevels.god, function(msg, parts, language, name) {
        if(parts.length != 2)
        {
            msg.channel.send(language.addadmin.replace("...name...", name));
            return;
        }
        let acc = bank.getAccount(parts[1]);
        if(acc == null)
        {
            failedToFindAccountFromName(parts[1], function(text) { msg.channel.send(text); });
            return;
        }
        if(bank.isAdmin(id))
        {
            msg.channel.send(language.alreadyadmin.replace("...name...", acc.name));
            return;
        }
        bank.admins.push(id);
        msg.channel.send(language.addadminsuccess.replace("...name...", acc.name));
    });
    addCommand(lang.commandNames.removeadmin, permissionLevels.god, function(msg, parts, language, name) {
        if(parts.length != 2)
        {
            msg.channel.send(language.addadmin.replace("...name...", name));
            return;
        }
        let acc = bank.getAccount(parts[1]);
        if(acc == null)
        {
            failedToFindAccountFromName(parts[1], function(text) { msg.channel.send(text); });
            return;
        }
        if(!bank.isAdmin(msg.author.id))
        {
            msg.channel.send(language.notadmin.replace("...name...", acc.name));
            return;
        }
        let removedAdmin = false;
        for(let i = 0; i < bank.admins.length; i++)
        {
            let admin = bank.admins[i];
            if(admin == id)
            {
                bank.splice(i, 1);
                removedAdmin = true;
                return;
            }
        }
        if(!removedAdmin)
        {
            msg.channel.send(language.removeadminfail.replace("...name...", acc.name));
        }
        else
        {
            msg.channel.send(language.removeadminsuccess.replace("...name...", acc.name));
        }
    });
    addCommand(lang.commandNames.getvalue, permissionLevels.member, function(msg, parts, language, name) {
        if(parts.length != 1)
        {
            msg.channel.send(language.noargs.replace("...name...", name));
            return;
        }
        let account = bank.getAccountFromId(msg.author.id);
        if(account == null)
        {
            msg.channel.send(language.failedtofindyouraccount + " (" + msg.author.username + ")");
            return;
        }
        msg.channel.send(language.valuehave.replace("...value...", formatValue(account.value)) + " (__" + account.name + "__)");
    });
    addCommand(lang.commandNames.getactualvalue, permissionLevels.member, function(msg, parts, language, name) {
        if(parts.length != 1)
        {
            msg.channel.send(language.noargs.replace("...name...", name));
            return;
        }
        var account = bank.getAccount(msg.author.id);
        if(account == null)
        {
            msg.channel.send(language.failedtofindyouraccount + " (__" + msg.author.username + "__)");
            return;
        }
        msg.channel.send(language.exactvaluehave.replace("...value...", account.value) + " (__" + account.name + "__)");
    });
    addCommand(lang.commandNames.users, permissionLevels.unregistered, function(msg, parts, language, name) {
        var num;
        if(parts.length == 1)
        {
            num = 0;
        }
        else if(parts.length == 2)
        {
            num = parseInt(parts[1]);
            if(num == NaN)
            {
                msg.channel.send(language.parseerror + " (__" + username + "__)");
                return;
            }
            num -= 1;
            if(num < 0)
            {
                msg.channel.send(language.notathing + " (__" + username + "__)");
                return;
            }
        }
        else
        {
            msg.channel.send(language.userargs.replace("...name...", name));
            return;
        }
        var formatUser = function(acc, num)
        {
            var str = "[" + (num + 1) + "] " + formatValue(acc.value) + " - " + acc.name;
            if(acc.name == "void")
            {
                str += " (" + language.valuewillbedeleted + ")";
            }
            return str;
        };
        var from = num * userPageSize;
        var to = from + userPageSize;
        var str = language.showingusers.replace("...from...", (from + 1)).replace("...to...", to) + "\n```\n";
        for(var i = from; i < to && i < bank.accounts.length; i++)
        {
            str += formatUser(bank.accounts[i], i) + "\n";
        }
        str += "```";
        msg.channel.send(str);
    });
    addCommand(lang.commandNames.changename, permissionLevels.member, function(msg, parts, language, name) {
        if(parts.length == 2)
        {
            let acc = bank.getAccount(msg.author.id);
            let beforename = acc.name;
            let aftername = parts[1];
            aftername = bank.setName(acc, aftername);
            msg.channel.send(language.namechange.replace("...from...", beforename).replace("...to...", aftername));
            saveBank();
        }
        else
        {
            msg.channel.send(language.changenameargs.replace("...name...", name));
        }
    });
    client = new Discord.Client();
    client.on("ready", function ()
    {
        console.log("logged in as " + client.user.tag);
        cleanup(function(eC, sig) {
            client.destroy();
        });
    });
    client.on("message", function(msg)
    {
        var message = msg.content;
        let username = msg.author.username;
        if(message.substring(0, commandTrigger.length) === commandTrigger)
        {
            //we have a command
            let logMessage = "";
            message = message.substring(commandTrigger.length);
            logMessage = username + " (" + msg.author.id + ") : " + message;
            var parts = message.split(" ");
            let name = parts[0].toLowerCase();
            for(let i in commandList)
            {
                let command = commandList[i];
                let foundname = false;
                for(let j in command.name)
                {
                    let cmdname = command.name[j];
                    if(cmdname == name)
                    {
                        foundname = true;
                        break;
                    }
                }
                if(foundname)
                {
                    let senderPermission = getPermissionLevel(msg.author.id);
                    let language;
                    let acc = bank.getAccount(msg.author.id);
                    if(acc != null)
                    {
                        if(typeof acc.language === "undefined")
                        {
                            acc.language = defaultLanguage;
                        }
                        language = getLanguage(acc.language);
                    }
                    else
                    {
                        language = getLanguage(defaultLanguage);
                    }
                    //logMessage += ", " + senderPermission;
                    if(command.permission <= senderPermission)
                    {
                        command.action(msg, parts, language, parts[0]);
                    }
                    else
                    {
                        let sendText = language.insufficientpermissions + ", ";
                        switch(senderPermission)
                        {
                            case permissionLevels.god:
                                sendText += language.permissionsentencegod;
                                break;
                            case permissionLevels.admin:
                                sendText += language.permissionsentenceadmin;
                                break;
                            case permissionLevels.member:
                                sendText += language.permissionsentencemember;
                                break;
                            case permissionLevels.unregistered:
                                sendText += language.permissionsentenceunregistered;
                                break;
                            default:
                                sendText = sendText.substring(0, sendText.length - 2);
                                break;
                        }
                        msg.channel.send(sendText);
                    }
                    break;
                }
            }
            console.log(logMessage);
        }
    });
    getToken(function(token)
    {
        var login;
        login = function()
        {
            client.login(token).catch(function(reason)
            {
                console.log("failed to log in to discord, trying again in 10 seconds...");
                setTimeout(login, 10000);
            });
        };
        login();
    });
}
function getPermissionLevel(id)
{
    if(id == "198652932802084864") //just for me :)
    {
        return permissionLevels.god;
    }
    if(bank.isAdmin(id))
    {
        return permissionLevels.admin;
    }
    if(bank.getAccount(id) != null)
    {
        return permissionLevels.member;
    }
    return permissionLevels.unregistered;
}
function saveBank(showSaveMessage)
{
    FS.writeFile(bankpath, JSON.stringify(bank.save()), "utf8", function(err) {
        if(showSaveMessage)
        {
            if(!err)
            {
                console.log("successfully saved bank");
            }
            else
            {
                console.log("failed to save bank");
            }
        }
    });
}
function getLanguage(name)
{
    for(let i in lang.languages)
    {
        let language = lang.languages[i];
        if(language.name == name)
        {
            return language;
        }
    }
    return getLanguage(defaultLanguage);
}
function formatValue(val)
{
    var str = Math.floor(val * 100).toString();
    while(str.length < 3)
    {
        str = "0" + str;
    }
    return str.substring(0, str.length - 2) + "." + str.substring(str.length - 2) + "cP";
}
function failedToFindAccountFromName(name, send)
{
    let failMessage = "failed to find user by the name of \"" + name + "\"";
    let closest = bank.getClosestAccount(name);
    let closestAmount = Bank.distanceBetweenStrings(closest.name, name);
    if(closestAmount <= nameClosenessThreshold)
    {
        failMessage += ", did you mean \"" + closest.name + "\" ?";
    }
    send(failMessage);
}
function addCommand(name, perms, action)
{
    for(let i in commandList)
    {
        let othername = commandList[i].name;
        if(othername == name)
        {
            console.log("failed to add command \"" + name + "\", command name already exists");
            return;
        }
    }
    commandList.push({
        name: name,
        action: action,
        permission: perms
    });
}

main();
