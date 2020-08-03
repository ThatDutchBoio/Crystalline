const discord = require('discord.js');
const config = require('./config.json')
const bot = new discord.Client()
const db = require('better-sqlite3')
const sql = new db('./data.sqlite');

const prefix = ';';
const fs = require('fs');
const {
    ifError
} = require('assert');
const {
    ALL
} = require('dns');
bot.on('ready', () => {
    console.log("Bot online");
    bot.user.setActivity("Currently moderating " + bot.guilds.cache.size + " servers.");
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
    if(!table['count(*)']){
        sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT,points INTEGER,level INTEGER,warns TEXT);").run();
        sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
        sql.pragma("synchronous = 1");
        sql.pragma("journal_mode = wal");

    }
    bot.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
    bot.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level, warns) VALUES (@id, @user, @guild, @points, @level, @warns);");
})

// const muteMsg = new discord.MessageEmbed()
//        .setTitle(":white_check_mark: Muting "+user.user.tag+" for "+length+" Seconds")
//       .setColor("GREEN")
//        .setAuthor(bot.user.tag,bot.user.avatarURL({dynamic: false, format: 'png', size: 512}))
// templat: member.guild.id+"_"+member.id
function getscore(userId,guildId){
    let score = bot.getScore.get(userId, guildId);
    if (!score) {
        let warnsString = JSON.stringify([]);
        score = {
            id: `${guildId}-${userId}`,
            user: userId,
            guild:guildId,
            points: 0,
            level: 1,
            warns: '[]'
        }
        bot.setScore.run(score);
    }
    return bot.getScore.get(userId,guildId);
}

bot.on('guildMemberAdd', member => {
    const welcome = new discord.MessageEmbed()
        .setTitle("Welcome to the server!")
        .setDescription("We hope you have a nice stay and hope to see ya chatting soon! \n if you need help with anything at all be sure to go to the request-support channel and type ;support! a staff members will be with you shortly")
        .setAuthor(bot.user.tag, bot.user.avatarURL({
            dynamic: false,
            format: 'png',
            size: 512
        }))
        .setColor("RED")

    member.createDM({
        embed: welcome
    })
    let role = member.guild.roles.cache.find(r => r.name === "Member");
    member.roles.add(role);
    fs.readFileSync('./data.json', function (err, data) {
        const jsonData = JSON.parse(data);
        let dataNav = member.guild.id + "_" + member.id;
        if (jsonData[member.guild.id][member.id] == undefined) {
            jsonData[member.guild.id][member.id] = {
                "warns": [],
                "username": member.displayName,
                "roles": member.guild.roles.cache
            }
            let dataWrite = JSON.stringify(jsonData);
            fs.writeFileSync('./data.json', dataWrite, function (err) {
                console.log(err)
            })
        }
    })

})

let oldRoles = new Map();
bot.on('message', msg => {
    if(msg.author.id != bot.user.id){
    let score = getscore(msg.author.id,msg.guild.id);
    if(!score){
        let warnsString = JSON.stringify([]);
        score = {
            id: `${msg.guild.id}-${msg.author.id}`,
            user: msg.author.id,
            guild: msg.guild.id,
            points: 0,
            level: 1,
            warns: "[]"
        }
        bot.setScore.run(score);
    }
    console.log(score)
    score.points = score.points + 1;


    const curLevel = Math.floor(0.5* Math.sqrt(score.points));
    if(score.level < curLevel){
        score.level++;
        msg.reply(`You've leveled up to level ${curLevel}!`)
    }
    bot.setScore.run(score);

}
    if (msg.content.startsWith(prefix) && msg.channel.type != "dm") {
        let args = msg.content.substring(prefix.length).split(' ');
        const logCmd = new discord.MessageEmbed()
            .setTitle(msg.author.tag + " Executed a command in " + msg.channel.name)
            .addField("Message:", msg.content, false)
            .setTimestamp()
            .setColor("RED")
            .setAuthor(bot.user.tag, bot.user.avatarURL({
                dynamic: false,
                format: 'png',
                size: 512
            }))
        let logchannel = msg.guild.channels.cache.find(c => c.name === "logs")
        logchannel.send({
            embed: logCmd
        })
        switch (args[0]) {
            //  commands    
            case 'ban':

                if (msg.member.hasPermission("BAN_MEMBERS") && msg.mentions.members.first() != undefined) {
                    msg.mentions.members.first().ban();
                    const bannedMember = new discord.MessageEmbed()
                        .setTitle(":white_check_mark: Banned " + msg.mentions.members.first().displayName)
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setTimestamp()
                        .setColor("GREEN")
                    msg.channel.send({
                        embed: bannedMember
                    })

                } else if (msg.mentions.members.first() === undefined) {
                    const specifyMember = new discord.MessageEmbed()
                        .setTitle(":x: Specify a user to ban!")
                        .setColor("RED")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: specifyMember
                    })
                }
                break;
            case 'kick':

                if (msg.member.hasPermission("KICK_MEMBERS") && msg.mentions.members.first() != undefined) {
                    msg.mentions.members.first().kick();
                    const bannedMember = new discord.MessageEmbed()
                        .setTitle(":white_check_mark: kicked " + msg.mentions.members.first().displayName)
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setTimestamp()
                        .setColor("GREEN")
                    msg.channel.send({
                        embed: bannedMember
                    })

                } else if (msg.mentions.members.first() === undefined) {
                    const specifyMember = new discord.MessageEmbed()
                        .setTitle(":x: Specify a user to kick!")
                        .setColor("RED")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: specifyMember
                    })
                }
                break;
            case 'warn':
               
                    //let towarn = msg.mentions.members.first()
                   // let towarnId = msg.mentions.members.first().id
                   if(!msg.mentions.members.first()){
                    const specuser = new discord.MessageEmbed()
                        .setTitle("Specify a user to warn!")
                        .setColor("RED")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                                    dynamic: false,
                                    format: 'png',
                                    size: 512
                                }))
                        .setTimestamp()
                        msg.channel.send({
                            embed: specuser
                        })
                   }else if(msg.mentions.members.first() != undefined && args[1] != undefined){
                    let warnmsg = msg.content.substring(args[1].length + 8, msg.content.length);
                    let score = getscore(msg.mentions.members.first().id,msg.guild.id);
                    let warns = JSON.parse(score.warns);
                    console.log("warns "+warns[0])
                    if(warnmsg == "" || warnmsg == undefined){
                        warnmsg = "undefined"
                    }
                    warns.push(warnmsg);
                    score.warns = JSON.stringify(warns)
                    bot.setScore.run(score);
                    const warnedUser = new discord.MessageEmbed()
                        .setTitle(`Warned ${msg.mentions.members.first().displayName} for ${warnmsg}`)
                        .setColor("GREEN")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setTimestamp()
                    msg.channel.send({
                        embed: warnedUser
                    })   
                   
                   // warns.push(warnmsg);
                  //  let warnsdata = JSON.stringify(warns)
                    
                  //  const warnembed = new discord.MessageEmbed()
                  //      .setTitle("Warned " + towarn.displayName + " for " + warnmsg)
                   //     .setColor("GREEN")
                   //     .setAuthor(bot.user.tag, bot.user.avatarURL({
                   //         dynamic: false,
                   //         format: 'png',
                   //         size: 512
                   //     }))
                   //     .setTimestamp()
                  //  msg.channel.send({
                   //     embed: warnembed
                   // })
                
                }
                break;
                case 'level':
                if(msg.mentions.members.first() != undefined){
                    let score = getscore(msg.mentions.members.first().id,msg.guild.id);
                    const levelEmb = new discord.MessageEmbed()
                        .setTitle(msg.mentions.members.first().displayName+" is level"+score.level)
                        .setColor("RED")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: levelEmb
                    })

                }else{
                    let score = getscore(msg.author.id,msg.guild.id);
                    const levelEmb = new discord.MessageEmbed()
                        .setTitle(`${msg.author.username} is level ${score.level}`)
                        .setColor("RED")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: levelEmb
                    })

                }
            break;
                case 'warns':
                if(!msg.mentions.members.first()){
                    let data = getscore(msg.author.id,msg.guild.id);
                    let warnsData = JSON.parse(data.warns);
                    console.log(warnsData)
                    if(warnsData[0] != undefined ){
                    let warnsEmb = new discord.MessageEmbed()
                        .setTitle(`${msg.author.username}'s Warns`)
                        .setColor("RED")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        for(i = 0; i < warnsData.length;i++){
                            warnsEmb.addField(`Warn ${i+1}`,warnsData[i]);
                        }
                        msg.channel.send({
                            embed: warnsEmb
                        })
                    }else{
                        let warnsEmb = new discord.MessageEmbed()
                        .setTitle(`${msg.author.username}'s Warns`)
                        .setColor("RED")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setDescription(":white_check_mark: This user has no warns!")
                        msg.channel.send({
                            embed: warnsEmb 
                    })
                }
                }else{
                    let data = getscore(msg.mentions.members.first().id,msg.guild.id);
                    let warnsData = JSON.parse(data.warns);
                    console.log(warnsData)
                    if(warnsData.length >= 1){
                    let warnsEmb = new discord.MessageEmbed()
                        .setTitle(`${msg.mentions.members.first().displayName}'s Warns`)
                        .setColor("RED")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        for(i = 0; i < warnsData.length;i++){
                            warnsEmb.addField(`Warn ${i+1}`,warnsData[i]);
                        }
                        msg.channel.send({
                            embed: warnsEmb
                        })
                    }else{
                        let warnsEmb = new discord.MessageEmbed()
                        .setTitle(`${msg.mentions.members.first().displayName}'s Warns`)
                        .setColor("RED")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setDescription(":white_check_mark:This user has no warns!")
                        msg.channel.send({
                            warnsEmb
                        })
                }
            }
            
            break;
            case 'clearwarns':
               if(!msg.mentions.members.first()){
                   let score = getscore(msg.author.id,msg.guild.id);
                   let scoreData = JSON.parse(score.warns);

                   scoreData = [];
                   score.warns = JSON.stringify(scoreData);
                   bot.setScore.run(score);
                   const embed = new discord.MessageEmbed()
                    .setTitle(":white_check_mark: Cleared warns for: "+msg.author.username)
                    .setColor("GREEN")
                    .setTimestamp()
                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                        dynamic: false,
                        format: 'png',
                        size: 512
                    }))
                msg.channel.send({
                    embed: embed
                })

               }else{
                let score = getscore(msg.mentions.members.first().id,msg.guild.id);
                let scoreData = JSON.parse(score.warns);

                scoreData = [];
                score.warns = JSON.stringify(scoreData);
                bot.setScore.run(score);
                const embed = new discord.MessageEmbed()
                 .setTitle(":white_check_mark: Cleared warns for: "+msg.mentions.members.first().displayName)
                 .setColor("GREEN")
                 .setTimestamp()
                 .setAuthor(bot.user.tag, bot.user.avatarURL({
                     dynamic: false,
                     format: 'png',
                     size: 512
                 }))
             msg.channel.send({
                 embed: embed
             })
               }
            break;
            case 'help':
                let commands = ["purge", "ban", "kick", "warn", "warns", "clearwarns", "help"]
                let descs = [
                    "Used by staff to delete messages in bulk",
                    "Used to ban members",
                    "Used to kick members",
                    "Used to warn members",
                    "Used to check someone's warns",
                    "Used to clear someone's warns",
                    "Lists all the commands"
                ]
                const helpEmb = new discord.MessageEmbed()
                    .setTitle("Commands:")
                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                        dynamic: false,
                        format: 'png',
                        size: 512
                    }))
                for (i = 0; i < commands.length; i++) {
                    helpEmb.addField(commands[i], descs[i], false)
                }
                helpEmb.setTimestamp()
                helpEmb.setColor("RED");
                msg.channel.send({
                    embed: helpEmb
                })

                break;
            case 'purge':
                if (msg.member.hasPermission("MANAGE_MESSAGES")) {

                    let msgCount = parseInt(args[1]);
                    const limit = 1000;
                    if (msgCount <= limit) {
                        msg.channel.bulkDelete(msgCount + 1);
                    }


                }
                break;
            case 'mute':
                if (msg.member.hasPermission("MUTE_MEMBERS")) {
                    if(msg.mentions.members.first() != undefined){
                    let toMute = msg.mentions.members.first();       
                        oldRoles.set(msg.guild.id + "_" + toMute.id, toMute.roles.cache);
                        console.log(oldRoles.get(msg.guild.id + "_" + toMute.id))
                        let rolescache = oldRoles.get(msg.guild.id + "_" + toMute.id)
                        let aooga = msg.content.substring(args[1].length + 7, msg.content.length);
                        let length = aooga.toLowerCase();
                        console.log(length)
                        let indentifier;
                        if (length.includes("h")) {
                            console.log('hours')
                            length.replace('h', '');
                            length = parseInt(length);
                            indentifier = length+" Hours";
                            length = length * 3600000;

                        } else if (length.includes("d")) {
                            console.log('days')
                            length.replace('d', '');
                            length = parseInt(length);
                            indentifier = length+" Days";
                            length = length * 86400000;
                            
                        } else if (length.includes("m")) {
                            console.log('minutes')
                            length.replace('m', '');
                            length = parseInt(length);
                            length = length * 60000
                            indentifier = length+" Minutes";
                        } else if (length.includes("s")) {
                            console.log('seconds')
                            length.replace('s', '');
                            length = parseInt(length);
                            indentifier = length+" Seconds";
                            length = length * 1000
                            
                        }
                        toMute.roles.set([])
                        let muterole = msg.guild.roles.create({
                            data: {
                                name: 'muted',
                                color: 'BLACK',
                                permissions: [],
                            }
                        }).then(function (role) {
                            const mutedEmb = new discord.MessageEmbed()
                                .setTitle(":white_check_mark: Muted " + toMute.displayName+" for "+indentifier)
                                .setAuthor(bot.user.tag, bot.user.avatarURL({
                                    dynamic: false,
                                    format: 'png',
                                    size: 512
                                }))
                                .setColor("GREEN")
                                .setTimestamp()
                                .setFooter("Muted by: "+ msg.author.tag)
                            toMute.roles.add(role);
                            msg.channel.send({
                                embed: mutedEmb
                            })
                            logchannel.send({
                                embed: mutedEmb
                            })
                            setTimeout(() => {
                                
                                const unmutedEmb = new discord.MessageEmbed()
                                .setTitle(":white_check_mark: Un-Muted " + toMute.displayName+" after "+indentifier)
                                .setAuthor(bot.user.tag, bot.user.avatarURL({
                                    dynamic: false,
                                    format: 'png',
                                    size: 512
                                }))
                                .setColor("GREEN")
                                .setTimestamp()
                                .setFooter("Muted by: "+ msg.author.tag)
                            toMute.roles.add(role);
                            msg.channel.send({
                                embed: unmutedEmb
                            })
                            logchannel.send({
                                embed: unmutedEmb
                            })
                                toMute.roles.set(rolescache);
                                role.delete();
                            }, length);
                        })
                }else{
                    const specUser = new discord.MessageEmbed()
                                .setTitle(":x: Specify someone to mute!")
                                .setAuthor(bot.user.tag, bot.user.avatarURL({
                                    dynamic: false,
                                    format: 'png',
                                    size: 512
                                }))
                                .setColor("RED")
                                .setTimestamp()
                    return msg.channel.send({
                        embed: specUser
                    })
                }
                }
                break;
        }


    }

})



bot.login(config.token);