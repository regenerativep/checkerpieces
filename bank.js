"use strict";

const EventEmitter = require("events");

function accountToString(acc)
{
    return acc.name + " (" + acc.value + "cP)";
}
function createAccount(id)
{
    return {
        name: "",
        clientid: id,
        value: 0
    };
}
function create2DArray(w, h)
{
    var arr = [];
    for(var i = 0; i < w; i++)
    {
        var item = [];
        for(var j = 0; j < h; j++)
        {
            item.push(0);
        }
        arr.push(item);
    }
    return arr;
}
function distanceBetweenStrings(a, b) //https://www.dotnetperls.com/levenshtein //whoever wrote the example code is not a good programmer
{
    var n = a.length, m = b.length;
    var d = create2DArray(n + 1, m + 1);
    if(n == 0)
        return m;
    if(m == 0)
        return n;
    for(var i = 0; i <= n; i++)
    {
        d[i][0] = i;
    }
    for(var i = 0; i <= m; i++)
    {
        d[0][i] = i;
    }
    for(var i = 1; i <= n; i++)
    {
        for(var j = 1; j <= m; j++)
        {
            d[i][j] = 0;
        }
    }
    for(var i = 0; i < n; i++)
    {
        for(var j = 0; j < m; j++)
        {
            var val = Math.min(
                d[i][j + 1] + 1,
                d[i + 1][j] + 1,
                d[i][j] + ((a.charAt(j) == b.charAt(i)) ? 0 : 1)
            );
            d[i + 1][j + 1] = val;
        }
    }
    return d[n][m];
}
function getLastNumber(name)
{
    let num = "";
    while(name.length > 0)
    {
        let char = name[name.length - 1];
        if("0123456789".indexOf(char) < 0)
        {
            break;
        }
        num = char + num;
        name = name.substring(0, name.length - 1);
    }
    if(num == "")
    {
        num = "0";
    }
    return [name, num];
}
function isClientId(id)
{
    if(typeof id !== "string" || id.length != 18) //must be a string, 18 characters
    {
        return false;
    }
    let num = parseInt(id);
    return !isNaN(num) && stringIsNum(id); //must be a string containing a valid number
}
function stringIsNum(str)
{
    for(let i in str)
    {
        let char = str[i];
        if("0123456789".indexOf(char) < 0)
        {
            return false;
        }
    }
    return true;
}
class Transaction
{
    constructor(from, to, amount)
    {
        this.sender = from;
        this.sendee = to;
        this.amount = amount;
        this.completed = false;
    }
    perform()
    {
        if(this.sender.value < this.amount)
        {
            this.completed = true;
            return false; //transaction failed
        }
        this.sender.value -= this.amount;
        this.sendee.value += this.amount;
        this.completed = true;
        return true; //transaction successful
    }
    toString()
    {
        return "Transaction:\n   from: " + accountToString(this.sender) + "\n   to: " + accountToString(this.sendee) + "\n   amount: " + this.amount;
    }
}
class Bank extends EventEmitter
{
    constructor()
    {
        super();
        this.accounts = [];
        this.transactions = [];
        this.admins = [];
        var parent = this;
        setInterval(function() {
            parent.addToAllAccounts(0.017, parent);
        }, 60000);
    }
    addToAllAccounts(value, parent)
    {
        for(var i = 0; i < this.accounts.length; i++)
        {
            parent.accounts[i].value += value;
        }
        parent.getAccountFromName("void").value = 0;
        parent.emit("save");
    }
    load(obj)
    {
        let parts = ["accounts", "transactions", "admins"]
        for(let i in parts)
        {
            let part = parts[i];
            if(typeof obj[part] !== "undefined")
            {
                this[part] = obj[part];
            }
        }
    }
    register(user)
    {
        //make sure we don't already have an account for this person
        for(var i = 0; i < this.accounts.length; i++)
        {
            if(this.accounts[i].clientid === user.id)
            {
                return null; //there is already an account for this person
            }
        }
        var acc = createAccount(user.id);
        this.accounts.push(acc);
        this.setName(acc, user.username);
        this.emit("register", acc);
        return acc;
    }
    setName(acc, name)
    {
        name = this.fixName(name);
        if(acc == null)
        {
            return console.log("failed to set name for id " + acc.id + ", name " + name);
        }
        for(let i in this.accounts)
        {
            let checkAcc = this.accounts[i];
            if(checkAcc.name == name)
            {
                return this.setName(acc, name + "-");
            }
        }
        acc.name = name;
        return name;
    }
    fixName(username)
    {
        let newStr = "";
        for(let i in username)
        {
            let char = username[i];
            if("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.=_:;|/,[]{}<>?!@#$%^&*()-+`~'\"".indexOf(char) >= 0)
            {
                newStr += char;
            }
        }
        return newStr;
    }
    getAccountFromName(name)
    {
        for(var i = 0; i < this.accounts.length; i++)
        {
            var acc = this.accounts[i];
            if(acc.name == name)
            {
                return acc;
            }
        }
        return null;
    }
    getAccountFromId(id)
    {
        for(var i = 0; i < this.accounts.length; i++)
        {
            var acc = this.accounts[i];
            if(acc.clientid == id)
            {
                return acc;
            }
        }
        return null;
    }
    getAccount(identifier)
    {
        if(isClientId(identifier))
        {
            return this.getAccountFromId(identifier);
        }
        else
        {
            return this.getAccountFromName(identifier);
        }
    }
    transfer(from, to, amount)
    {
        var a = this.getAccount(from),
            b = this.getAccount(to);
        if(a == null)
        {
            return [null, 1];
        }
        else if(b == null)
        {
            return [null, 2];
        }
        var trans = new Transaction(a, b, amount);
        this.transactions.push(trans);
        this.emit("transaction", trans);
        return [trans, 0];
    }
    save()
    {
        return {
            transactions: this.transactions,
            accounts: this.accounts,
            admins: this.admins
        };
    }
    getClosestAccount(name)
    {
        var lowest, bestacc = null;
        for(var i = 0; i < this.accounts.length; i++)
        {
            var acc = this.accounts[i];
            var amt = distanceBetweenStrings(name, acc.name);
            if(typeof lowest == "undefined" || amt < lowest)
            {
                bestacc = acc;
                lowest = amt;
            }
        }
        return bestacc;
    }
    isAdmin(id)
    {
        for(let i in this.admins)
        {
            if(id == this.admins[i])
            {
                return true;
            }
        }
        return false;
    }
}

module.exports = {
    Transaction, Bank, accountToString, distanceBetweenStrings, getLastNumber, isClientId
};