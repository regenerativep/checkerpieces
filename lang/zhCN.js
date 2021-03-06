const fs = require("fs");
module.exports = {
    language: {
        name: "zh-CN",
        help: fs.readFileSync("./help_zh-CN.txt", "utf8"),
        noargs: "命令\"...name...\"不接受任何参数",
        alreadyregistered: "你已经注册了",
        justregistered: "你刚刚注册了",
        transferargs: "命令\"...name...\"接受 [数量:float] [收方:string]",
        badamount: "不好的数量",
        failedtofindyouraccount: "未能找到你的账户与你的名字",
        transactionuserfailed: "你的交易失败了或什么的，对弗雷斯特喊",
        transactionsuccess: "成功转移到...recipient...",
        transactionfailed: "未能转移",
        addedvalue: "添加...amount...账户...account...",
        addadmin: "命令\"...name...\"接受[受访:string]",
        alreadyadmin: "...name...已经是管理员",
        addadminsuccess: "添加...name...到管理列表",
        notadmin: "...name...不是管理员",
        removeadminfail: "未能从管理列表删除...name...",
        removeadminsuccess: "从管理列表删除...name...",
        valuehave: "你有...value...",
        exactvaluehave: "你有...value...棋子",
        languageCurrency: "棋子",
        parseerror: "我们不能用你的号",
        notathing: "不是一个东西",
        userargs: "命令\"...name...\"接受[页码:int(>0)]",
        valuewillbedeleted: "如果你把值放在这里那值会删除了",
        showingusers: "显示从...from...到...to...之间的账户",
        namechange: "改变了你的账户名字从...from...到...to...",
        changenameargs: "命令\"...name...\"接受[新名字:string]",
        insufficientpermissions: "你没有足够的权限",
        permissionsentencegod: "什么？？",
        permissionsentenceadmin: "你是管理员",
        permissionsentencemember: "你是会员",
        permissionsentenceunregistered: "你未注册的"
    },
    commands: {
        help: ["帮助"],
        register: ["注册"],
        transfer: ["转移"],
        addvalue: ["添加值"],
        addadmin: ["添加管理"],
        removeadmin: ["删除管理"],
        getvalue: ["找值"],
        getactualvalue: ["找实际值"],
        users: ["账户"],
        changename: ["改变名字"]
    }
};