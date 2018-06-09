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
            parent.addToAllAccounts(0.0003, parent);
        }, 1000);
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
        if(a == null || b == null)
        {
            return null;
        }
        var trans = new Transaction(a, b, amount);
        this.transactions.push(trans);
        this.emit("transaction", trans);
        return trans;
    }
    save()
    {
        return {
            transactions: this.transactions,
            accounts: this.accounts
        };
    }
}

module.exports = {
    Transaction, Bank
};