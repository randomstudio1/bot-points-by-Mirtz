const sqlite3 = require('sqlite3').verbose();
const Discord = require('discord.js');

module.exports = {
  name: 'points',
  description: 'عرض مجموع النقاط وقائمة الأعضاء',
  execute(message, args) {
    // إنشاء قاعدة بيانات لكل خادم
    const db = new sqlite3.Database(`databases/pointsdb/points_${message.guild.id}.db`);

    // الحصول على جميع النقاط للأعضاء
    db.all('SELECT user_id, points FROM points', function(err, rows) {
      if (err) {
        console.error(err);
        return message.channel.send('حدث خطأ أثناء تنفيذ الأمر.');
      }

      rows.sort((a, b) => b.points - a.points); // رتب الأعضاء بناءً على عدد النقاط

      // إنشاء رسالة Embed لعرض عدد النقاط للأعضاء
      const embed = new Discord.MessageEmbed()
        .setColor('BLUE')
        .setTitle('DashBoard')
        .setDescription(`Total Of Point: ${rows.reduce((total, row) => total + row.points, 0)}`);

      // إضافة قائمة الأعضاء
      rows.forEach((row, index) => {
        const member = message.guild.members.cache.get(row.user_id);
        embed.addField(`Member Number ${index + 1}`, `${member} - ${row.points} Point`);
      });

      message.channel.send(embed);
    });
  },
};
