const FS = require("fs");
const PATH = require("path");

const Discord = require("discord.js");
const Cleanup = require("node-cleanup");
const Bank = require("./bank.js");

const commandTrigger = "$";
//const nameClosenessThreshold = 4;
const userPageSize = 12;
const bankpath = PATH.join(__dirname, "bank.json");
const helppath = PATH.join(__dirname, "help.txt");
var helptext = FS.readFileSync(helppath, "utf8");
var nameClosenessThreshold = 4;

var getToken = function(cb)
{
    console.log("getting token");
    var token = process.env.DISCORD_TOKEN;
    cb(token);
};

var bank = new Bank.Bank();
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

var client = new Discord.Client();
client.on("ready", function ()
{
    console.log("logged in as " + client.user.tag);
    Cleanup(function(eC, sig) {
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
        message = message.substring(commandTrigger.length);
        console.log(username + ": " + message);
        var parts = message.split(" ");
        switch(parts[0].toLowerCase())
        {
            case "help": {

                if(parts.length != 1)
                {
                    msg.channel.send("command \"help\" takes no arguments");
                    break;
                }
                msg.channel.send(helptext)
                break;
            }
            case "register": {
                if(parts.length != 1)
                {
                    msg.channel.send("command \"register\" takes no arguments");
                    break;
                }
                var acc = bank.register(msg.author);
                if(acc == null)
                {
                    msg.channel.send("you have already been registered (__" + username + "__)");
                    break;
                }
                msg.channel.send("you have been registered (__" + acc.name + "__)");
                saveBank();
                break;
            }
            case "transfer": {
                if(parts.length != 3)
                {
                    msg.channel.send("command \"transfer\" takes [amount: float] [recipient: string]")
                    break;
                }
                var amount = parseFloat(parts[1]);
                if(isNaN(amount))
                {
                    msg.channel.send("bad amount");
                    break;
                }
                var recipient = bank.getAccountFromName(parts[2]);
                if(recipient == null)
                {
                    failedToFindAccountFromName(parts[2], msg.channel.send);
                    break;
                }
                var trans = bank.transfer(msg.author.id, recipient.clientid, amount);
                if(trans[0] == null)
                {
                    if(trans[1] == 1)
                    {
                        msg.channel.send("failed to find an account under your name. (__" + username + "__)");
                    }
                    msg.channel.send("transaction failed or something; im not sure what happened. yell at forrest if you can");
                    break;
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
                break;
            }
            case "addvalue": {
                if(!bank.isAdmin(msg.author.id))
                {
                    msg.channel.send("no");
                    break;
                }
                if(parts.length != 3)
                {
                    msg.channel.send("command \"addvalue\" takes [amount: int] [recipient: string]");
                    break;
                }
                var account = bank.getAccountFromName(parts[2]);
                if(account == null)
                {
                    failedToFindAccountFromName(parts[2], msg.channel.send);
                    break;
                }
                var amount = parseFloat(parts[1]);
                if(isNaN(amount))
                {
                    msg.channel.send("bad amount");
                    break;
                }
                account.value += amount;
                msg.channel.send("added " + amount + " to account (" + account.name + ")");
                saveBank();
                break;
            }
            case "addadmin": {
                if(!bank.isAdmin(msg.author.id))
                {
                    msg.channel.send("no");
                    break;
                }
                if(parts.length != 2)
                {
                    msg.channel.send("command \"addadmin\" takes [recipient: string]");
                    break;
                }
                let acc = bank.getAccount(parts[1]);
                if(acc == null)
                {
                    failedToFindAccountFromName(parts[1], msg.channel.send);
                    break;
                }
                if(bank.isAdmin(id))
                {
                    msg.channel.send(acc.name + " is already admin");
                    break;
                }
                bank.admins.push(id);
                msg.channel.send("added \"" + acc.name + "\" to admin list");
                break;
            }
            case "removeadmin": {
                if(msg.author.id != "198652932802084864") //just for me :)
                {
                    msg.channel.send("no");
                    break;
                }
                if(parts.length != 2)
                {
                    msg.channel.send("command \"removeadmin\" takes [recipient: string]");
                    break;
                }
                let acc = bank.getAccount(parts[1]);
                if(acc == null)
                {
                    failedToFindAccountFromName(parts[1], msg.channel.send);
                    break;
                }
                if(!bank.isAdmin(id))
                {
                    msg.channel.send(acc.name + " is not admin");
                    break;
                }
                let removedAdmin = false;
                for(let i = 0; i < bank.admins.length; i++)
                {
                    let admin = bank.admins[i];
                    if(admin == id)
                    {
                        bank.splice(i, 1);
                        removedAdmin = true;
                        break;
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
                break;
            }
            case "getvalue": {
                if(parts.length != 1)
                {
                    msg.channel.send("command \"getvalue\" takes no arguments");
                    break;
                }
                let account = bank.getAccountFromId(msg.author.id);
                if(account == null)
                {
                    msg.channel.send("failed to find an account under your name, " + msg.author.username);
                    break;
                }
                msg.channel.send("you have " + formatValue(account.value) + " (__" + account.name + "__)");
                break;
            }
            case "getactualvalue": {
                if(parts.length != 1)
                {
                    msg.channel.send("command \"getactualvalue\" takes no arguments");
                    break;
                }
                var account = bank.getAccount(msg.author.id);
                if(account == null)
                {
                    msg.channel.send("failed to find an account under your name. (__" + username + "__)");
                    break;
                }
                msg.channel.send("you have " + account.value + "cP (__" + account.name + "__)");
                break;
            }
            case "users": {
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
                        break;
                    }
                    num -= 1;
                    if(num < 0)
                    {
                        msg.channel.send("thats not a thing (__" + username + "__)");
                        break;
                    }
                }
                else
                {
                    msg.channel.send("command \"users\" takes [page: int (>0)]");
                    break;
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
                break;
            }
            case "changename": {
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
                break;
            }
        }
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