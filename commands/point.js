const sqlite3 = require('sqlite3').verbose();
const Discord = require('discord.js');
const fs = require('fs');

module.exports = {
  name: 'point',
  description: 'to give points',
  execute(message, args) {
    // التحقق من أن العضو لديه صلاحية المشرف أو الأدمنستريتور
    if(!message.member.hasPermission('ADMINISTRATOR')) {
      return message.channel.send('You do not have permission to use this command');
    }

    // التحقق من وجود عضو مذكور
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) {
      return message.channel.send('Please mention a valid member of this server');
    }

    // التحقق من وجود عدد النقاط المحدد
    const points = parseInt(args[1]);
    if (isNaN(points)) {
      return message.channel.send('Please provide a valid number of points');
    }

    // إنشاء مجلد لقاعدة البيانات إذا لم يكن موجودًا
    const folderPath = 'databases/pointsdb/';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // إنشاء قاعدة بيانات لكل خادم
    const db = new sqlite3.Database(`${folderPath}points_${message.guild.id}.db`);

    // إنشاء جدول النقاط إذا لم يكن موجودًا
    db.run('CREATE TABLE IF NOT EXISTS points (user_id TEXT, points INTEGER)');

    // الحصول على عدد النقاط الحالي للعضو
    db.get('SELECT points FROM points WHERE user_id = ?', [member.id], function(err, row) {
      if (err) {
        console.error(err);
        return message.channel.send('There was an error retrieving the points for this member');
      }

      let currentPoints = 0;
      if (row) {
        currentPoints = row.points;
      }

      // إضافة النقاط المحددة للعضو
      const totalPoints = currentPoints + points;

      // التحقق من وجود سجل للعضو في قاعدة البيانات
      if (row) {
        db.run('UPDATE points SET points = ? WHERE user_id = ?', [totalPoints, member.id], function(err) {
          if (err) {
            console.error(err);
            return message.channel.send('There was an error retrieving the points for this member');
          }
        });
      } else {
        db.run('INSERT INTO points (user_id, points) VALUES (?, ?)', [member.id, totalPoints], function(err) {
          if (err) {
            console.error(err);
            return message.channel.send('There was an error retrieving the points for this member');
          }
        });
      }

      // إنشاء رسالة Embed لعرض عدد النقاط للأعضاء
      const embed = new Discord.MessageEmbed()
        .setColor('BLUE')
        .setTitle('TotalPoints')
        .setDescription(`All Your Points ${totalPoints}`);

      // الحصول على جميع النقاط للأعضاء
      db.all('SELECT user_id, points FROM points', function(err, rows) {
        if (err) {
          console.error(err);
          return message.channel.send('There was an error retrieving the points for this member');
        }

        rows.sort((a, b) => b.points - a.points); // رتب الأعضاء بناءً على عدد النقاط

        rows.forEach((row, index) => {
          const member = message.guild.members.cache.get(row.user_id);
          embed.addField(`member ${index + 1}`, `${member} - ${row.points} points`);
        });

        message.channel.send(embed);
      });
    });

    db.close();
  },
};