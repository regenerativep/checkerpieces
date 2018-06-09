const FS = require("fs");
const PATH = require("path");

const Discord = require("discord.js");
const Cleanup = require("node-cleanup");
const Bank = require("./bank.js");

const commandTrigger = "$";
const tokenpath = PATH.join(__dirname, "token.txt");
const bankpath = PATH.join(__dirname, "bank.json");

var getToken = function(cb)
{
    FS.readFile(tokenpath, "utf8", function(err, data)
    {
        if(err)
        {
            console.log(err);
            return;
        }
        var token = data;
        cb(token);
    });
};

var bank = new Bank.Bank();
try
{
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
            return; //no
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
        var parts = message.split(" ");
        switch(parts[0].toLowerCase())
        {
            case "register": {
                if(parts.length != 1)
                {
                    msg.channel.send("command \"register\" takes no arguments");
                    break;
                }
                var acc = bank.register(username);
                if(acc == null)
                {
                    msg.channel.send("you have already been registered (" + username + ")");
                    break;
                }
                msg.channel.send("you have been registered (" + acc.owner + ")");
                saveBank();
                break;
            }
            case "transfer": {
                if(parts.length != 3)
                {
                    msg.channel.send("command \"transfer\" takes [amount: int] [recipient: string]")
                    break;
                }
                var amount = parseFloat(parts[1]);
                var recipient = parts[2];
                var trans = bank.transfer(username, recipient, amount);
                if(trans == null)
                {
                    msg.channel.send("failed to find an account under your name. (" + username + ")");
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
                    msg.channel.send("failed to find an account under your name. (" + username + ")");
                    break;
                }
                msg.channel.send("you have " + account.value + " checker pieces. (" + account.owner + ")");
                break;
            }
        }
    }
});
getToken(function(token)
{
    client.login(token);
});