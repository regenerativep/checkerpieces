"use strict";
/*class Account
{
    constuctor(owner)
    {
        this.owner = owner;
        this.value = 0;
    }
}*/
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
        return "Transaction:\n   from: " + this.sender + "\n   to: " + this.sendee + "\n   amount: " + this.amount;
    }
}
class Bank
{
    constructor()
    {
        this.accounts = [];
        this.transactions = [];
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
        return trans;
    }
}

module.exports = {
    Transaction, Bank
};