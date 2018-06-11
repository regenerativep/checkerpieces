"use strict";

const EventEmitter = require("events");

function accountToString(acc)
{
    return acc.owner + " (" + acc.value + "cP)";
}
function createAccount(owner)
{
    return {
        owner: owner,
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
        parent.getAccount("void").value = 0;
        parent.emit("save");
    }
    load(obj)
    {
        this.accounts = obj.accounts;
        this.transactions = obj.transactions;
    }
    register(name)
    {
        //make sure we don't already have an account for this person
        for(var i = 0; i < this.accounts.length; i++)
        {
            if(this.accounts[i].owner === name)
            {
                return null; //there is already an account for this person
            }
        }
        var acc = createAccount(name);
        //console.log(acc);
        this.accounts.push(acc);
        this.emit("register", acc);
        return acc;
    }
    getAccount(name)
    {
        for(var i = 0; i < this.accounts.length; i++)
        {
            var acc = this.accounts[i];
            if(acc.owner === name)
            {
                return acc;
            }
        }
        return null;
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
            accounts: this.accounts
        };
    }
    getClosestAccount(name)
    {
        var lowest, lname = "";
        for(var i = 0; i < this.accounts.length; i++)
        {
            var acc = this.accounts[i];
            if(acc.owner == "void")
                continue;
            var amt = distanceBetweenStrings(name, acc.owner);
            if(typeof lowest == "undefined" || amt < lowest)
            {
                lname = acc.owner;
                lowest = amt;
            }
        }
        return { name: lname, value: lowest };
    }
    
}

module.exports = {
    Transaction, Bank
};