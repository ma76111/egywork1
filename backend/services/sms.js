const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY || '',
  apiSecret: process.env.VONAGE_API_SECRET || '',
});

async function sendVerificationSMS(phone, code) {
  // تحويل رقم مصري لصيغة دولية
  let intlPhone = phone.replace(/^0/, '20'); // 01xxxxxxxx -> 201xxxxxxxx
  if (!intlPhone.startsWith('20')) intlPhone = '20' + intlPhone;

  return new Promise((resolve, reject) => {
    vonage.sms.send({
      to: intlPhone,
      from: 'EgyWork',
      text: `كود تأكيد إيجي وورك: ${code}\nصالح 10 دقائق فقط`,
    }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

module.exports = { sendVerificationSMS };
