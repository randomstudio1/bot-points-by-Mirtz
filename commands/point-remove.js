const sqlite3 = require('sqlite3').verbose();
const Discord = require('discord.js');
const fs = require('fs');

module.exports = {
  name: 're-point',
  description: 'إزالة عدد محدد من النقاط لعضو معين',
  execute(message, args) {
    // التحقق من أن العضو لديه صلاحية المشرف أو الأدمنستريتور
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      return message.channel.send('ليس لديك الصلاحية لاستخدام هذا الأمر.');
    }

    // التحقق من وجود عضو مذكور
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) {
      return message.channel.send('يرجى ذكر عضو صحيح لإزالة نقاطه.');
    }

    // التحقق من وجود عدد النقاط المحدد
    const pointsToRemove = parseInt(args[1]);
    if (isNaN(pointsToRemove)) {
      return message.channel.send('يرجى تحديد عدد نقاط صحيح لإزالتها من العضو.');
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
        return message.channel.send('حدث خطأ أثناء تنفيذ الأمر.');
      }

      if (!row) {
        return message.channel.send('العضو ليس لديه أي نقاط لإزالتها.');
      }

      let currentPoints = row.points;

      // التحقق من أن عدد النقاط المحدد لا يتجاوز عدد النقاط الحالي
      if (pointsToRemove > currentPoints) {
        return message.channel.send('لا يمكن إزالة عدد النقاط المحدد من العضو لأنه يتجاوز عدد نقاطه الحالي.');
      }

      // إزالة عدد النقاط المحدد من العضو
      const updatedPoints = currentPoints - pointsToRemove;

      if (updatedPoints > 0) {
        db.run('UPDATE points SET points = ? WHERE user_id = ?', [updatedPoints, member.id], function(err) {
          if (err) {
            console.error(err);
            return message.channel.send('حدث خطأ أثناء تنفيذ الأمر.');
          }

          message.channel.send(`تم إزالة ${pointsToRemove} نقطة من العضو ${member}.`);
        });
      } else {
        db.run('DELETE FROM points WHERE user_id = ?', [member.id], function(err) {
          if (err) {
            console.error(err);
            return message.channel.send('حدث خطأ أثناء تنفيذ الأمر.');
          }

          message.channel.send(`تمت إزالة جميع نقاط العضو ${member} وتمت إزالته من قاعدة البيانات.`);
        });
      }
    });
  },
};