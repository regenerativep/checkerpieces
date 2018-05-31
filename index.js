const FS = require("fs");
const PATH = require("path");

const Discord = require("discord.js");


var getToken = function(cb)
{
    var tokenpath = PATH.join(__dirname, "token.txt");
    FS.readFile(tokenpath, {encoding: "utf-8"}, function(err, data)
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

var client = new Discord.Client();
client.on("ready", function ()
{
    console.log("logged in as " + client.user.tag + "!");
});
client.on("message", function(msg)
{
    if(msg.content === "ping")
    {
        msg.reply("pong");
    }
});
getToken(function(token)
{
    client.login(token);
});