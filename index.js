const FS = require("fs");
const PATH = require("path");

const Discord = require("discord.js");
const Cleanup = require("node-cleanup");
const Bank = require("./bank.js");

const commandTrigger = "$";
const nameClosenessThreshold = 8;
const userPageSize = 12;
const tokenpath = PATH.join(__dirname, "token.txt");
const bankpath = PATH.join(__dirname, "bank.json");
const helppath = PATH.join(__dirname, "help.txt");
//const helptext = "https://github.com/regenerativep/checkerpieces for code\nyou get money by people giving you money and the universal basic income of 0.017cP per minute\n\ncommands:\n$register\nregisters you\n\n$addvalue\nno\n\n$getvalue\ngets the amount of checker pieces in your account\n\n$transfer [amount: float] [destination: string]\ntransfers the given amount from your account to the destination account";
var helptext = FS.readFileSync(helppath, "utf8");

var getToken = function(cb)
{
    /*
    FS.readFile(tokenpath, "utf8", function(err, data)
    {
        if(err)
        {
            console.log(err);
            return;
        }
        var token = data;
        cb(token);
    });*/
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
bank.on("save", function() { saveBank(false) } );
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
    if(msg.channel.type != "dm")
    {
        if(msg.channel.type != "text")
        {
            return; //if we get here, something likely went very wrong
        }
        else if(msg.channel.name != "bot")
        {
            return;
        }
    }
    var message = msg.content;
    var username = msg.author.tag;
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
                var acc = bank.register(username);
                if(acc == null)
                {
                    msg.channel.send("you have already been registered (__" + username + "__)");
                    break;
                }
                msg.channel.send("you have been registered (__" + acc.owner + "__)");
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
                var recipient = parts[2];
                var trans = bank.transfer(username, recipient, amount);
                if(trans[0] == null)
                {
                    if(trans[1] == 1)
                    {
                        msg.channel.send("failed to find an account under your name. (__" + username + "__)");
                    }
                    else if(trans[1] == 2)
                    {
                        var text = "failed to find an account under the recipient's name."
                        var closest = bank.getClosestAccount(recipient);
                        if(closest.name != "")
                        {
                            if(closest.value <= nameClosenessThreshold)
                            {
                                text += " did you mean **" + closest.name + "** ?";
                            }
                        }
                        msg.channel.send(text + " (__" + username + "__)");
                    }
                    break;
                }
                console.log(trans.toString());
                if(trans.perform())
                {
                    msg.channel.send("successfully transferred value");
                }
                else
                {
                    msg.channel.send("failed to transfer; likely insufficient value");
                }
                saveBank();
                break;
            }
            case "addvalue": {
                /*
                if(parts.length != 2)
                {
                    msg.channel.send("command \"addvalue\" takes [amount: int]");
                    break;
                }
                var account = bank.getAccount(username);
                if(account == null)
                {
                    msg.channel.send("failed to find an account under your name. (" + username + ")");
                    break;
                }
                var amount = parseFloat(parts[1]);
                account.value += amount;
                msg.channel.send("added " + amount + " to your account (" + account.owner + ")");
                saveBank();*/
                msg.channel.send("no");
                break;
            }
            case "getvalue": {
                if(parts.length != 1)
                {
                    msg.channel.send("command \"getvalue\" takes no arguments");
                    break;
                }
                var account = bank.getAccount(username);
                if(account == null)
                {
                    msg.channel.send("failed to find an account under your name. (__" + username + "__)");
                    break;
                }
                msg.channel.send("you have " + formatValue(account.value) + " (__" + account.owner + "__)");
                break;
            }
            case "getactualvalue": {
                if(parts.length != 1)
                {
                    msg.channel.send("command \"getactualvalue\" takes no arguments");
                    break;
                }
                var account = bank.getAccount(username);
                if(account == null)
                {
                    msg.channel.send("failed to find an account under your name. (__" + username + "__)");
                    break;
                }
                msg.channel.send("you have " + account.value + "cP (__" + account.owner + "__)");
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
                    var str = "[" + (num + 1) + "] " + formatValue(acc.value) + " - " + acc.owner;
                    if(acc.owner == "void")
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