const FS = require("fs");
const PATH = require("path");

const Discord = require("discord.js");
const cleanup = require("node-cleanup");
const Bank = require("./bank.js");
const lang = require("./languages.js");

const commandTrigger = "$";
const userPageSize = 12;
const bankpath = PATH.join(__dirname, "bank.json");
const helppath = PATH.join(__dirname, "help.txt");
const permissionLevels = {
    god: 4, admin: 3, member: 1, unregistered: 0
};
var helptext = FS.readFileSync(helppath, "utf8");
var nameClosenessThreshold = 4;

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
    addCommand("help", permissionLevels.unregistered, function (msg, parts) {
        if(parts.length != 1)
        {
            msg.channel.send("command \"help\" takes no arguments");
            return;
        }
        msg.channel.send(helptext);
    });
    addCommand("register", permissionLevels.unregistered, function(msg, parts) {
        if(parts.length != 1)
        {
            msg.channel.send("command \"register\" takes no arguments");
            return;
        }
        var acc = bank.register(msg.author);
        if(acc == null)
        {
            msg.channel.send("you have already been registered (__" + msg.author.username + "__)");
            return;
        }
        msg.channel.send("you have been registered (__" + acc.name + "__)");
        saveBank();
    });
    addCommand("transfer", permissionLevels.member, function(msg, parts) {
        if(parts.length != 3)
        {
            msg.channel.send("command \"transfer\" takes [amount: float] [recipient: string]")
            return;
        }
        var amount = parseFloat(parts[1]);
        if(isNaN(amount))
        {
            msg.channel.send("bad amount");
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
                msg.channel.send("failed to find an account under your name. (__" + msg.author.username + "__)");
            }
            msg.channel.send("transaction failed or something; im not sure what happened. yell at forrest if you can");
            return;
        }
        console.log(trans[0].toString());
        if(trans[0].perform())
        {
            msg.channel.send("successfully transferred value to " + recipient.name);
        }
        else
        {
            msg.channel.send("failed to transfer");
        }
        saveBank();
    });
    addCommand("addvalue", permissionLevels.admin, function(msg, parts) {
        if(!bank.isAdmin(msg.author.id))
        {
            msg.channel.send("no");
            return;
        }
        if(parts.length != 3)
        {
            msg.channel.send("command \"addvalue\" takes [amount: int] [recipient: string]");
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
            msg.channel.send("bad amount");
            return;
        }
        account.value += amount;
        msg.channel.send("added " + amount + " to account (" + account.name + ")");
        saveBank();
    });
    addCommand("addadmin", permissionLevels.god, function(msg, parts) {
        if(!bank.isAdmin(msg.author.id))
        {
            msg.channel.send("no");
            return;
        }
        if(parts.length != 2)
        {
            msg.channel.send("command \"addadmin\" takes [recipient: string]");
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
            msg.channel.send(acc.name + " is already admin");
            return;
        }
        bank.admins.push(id);
        msg.channel.send("added \"" + acc.name + "\" to admin list");
    });
    addCommand("removeadmin", permissionLevels.god, function(msg, parts) {
        if(msg.author.id != "198652932802084864") //just for me :)
        {
            msg.channel.send("no");
            return;
        }
        if(parts.length != 2)
        {
            msg.channel.send("command \"removeadmin\" takes [recipient: string]");
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
            msg.channel.send(acc.name + " is not admin");
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
            msg.channel.send("something went wrong in getting rid of the admin " + acc.name);
        }
        else
        {
            msg.channel.send("removed admin " + acc.name);
        }
    });
    addCommand("getvalue", permissionLevels.member, function(msg, parts) {
        if(parts.length != 1)
        {
            msg.channel.send("command \"getvalue\" takes no arguments");
            return;
        }
        let account = bank.getAccountFromId(msg.author.id);
        if(account == null)
        {
            msg.channel.send("failed to find an account under your name, " + msg.author.username);
            return;
        }
        msg.channel.send("you have " + formatValue(account.value) + " (__" + account.name + "__)");
    });
    addCommand("getactualvalue", permissionLevels.member, function(msg, parts) {
        if(parts.length != 1)
        {
            msg.channel.send("command \"getactualvalue\" takes no arguments");
            return;
        }
        var account = bank.getAccount(msg.author.id);
        if(account == null)
        {
            msg.channel.send("failed to find an account under your name. (__" + msg.author.username + "__)");
            return;
        }
        msg.channel.send("you have " + account.value + "cP (__" + account.name + "__)");
    });
    addCommand("users", permissionLevels.unregistered, function(msg, parts) {
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
                msg.channel.send("there was a problem parsing your number (__" + username + "__)");
                return;
            }
            num -= 1;
            if(num < 0)
            {
                msg.channel.send("thats not a thing (__" + username + "__)");
                return;
            }
        }
        else
        {
            msg.channel.send("command \"users\" takes [page: int (>0)]");
            return;
        }
        var formatUser = function(acc, num)
        {
            var str = "[" + (num + 1) + "] " + formatValue(acc.value) + " - " + acc.name;
            if(acc.name == "void")
            {
                str += " (if you put value here, that value will be deleted)";
            }
            return str;
        };
        var from = num * userPageSize;
        var to = from + userPageSize;
        var str = "showing users from number " + (from + 1) + " to number " + to + "\n```\n";
        for(var i = from; i < to && i < bank.accounts.length; i++)
        {
            str += formatUser(bank.accounts[i], i) + "\n";
        }
        str += "```";
        msg.channel.send(str);
    });
    addCommand("changename", permissionLevels.member, function(msg, parts) {
        if(parts.length == 2)
        {
            let acc = bank.getAccount(msg.author.id);
            let beforename = acc.name;
            let aftername = parts[1];
            aftername = bank.setName(acc, aftername);
            msg.channel.send("changed your account name from \"" + beforename + "\" to \"" + aftername + "\"");
            saveBank();
        }
        else
        {
            msg.channel.send("command \"changename\" takes [newname: string]");
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
                if(command.name == name)
                {
                    let senderPermission = getPermissionLevel(msg.author.id);
                    logMessage += ", " + senderPermission;
                    if(command.permission <= senderPermission)
                    {
                        command.action(msg, parts);
                    }
                    else
                    {
                        let sendText = "insufficient permissions, ";
                        switch(senderPermission)
                        {
                            case permissionLevels.god:
                                sendText += "wut";
                                break;
                            case permissionLevels.admin:
                                sendText += "you're an admin";
                                break;
                            case permissionLevels.member:
                                sendText += "you're a member";
                                break;
                            case permissionLevels.unregistered:
                                sendText += "you're unregistered";
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
