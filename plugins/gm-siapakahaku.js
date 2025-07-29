const fetch = require('node-fetch')

let timeout = 120000
let poin = 4999
let limit = 1

let handler = async (m, { conn, Func }) => {
    conn.siapakahaku = conn.siapakahaku ? conn.siapakahaku : {}
    let id = m.chat
    if (id in conn.siapakahaku) return conn.reply(m.chat, 'Masih ada soal belum terjawab di chat ini', { message_id: conn.siapakahaku[id][0]?.message_id })
    let soal = await (await fetch('https://raw.githubusercontent.com/BochilTeam/database/master/games/siapakahaku.json')).json()
    let json = Func.pickRandom(soal)
    let caption = `[SIAPAKAHAKU]\n\n${json.soal}\nTimeout *${(timeout / 1000).toFixed(2)} detik*\nBonus: ${poin} XP Dan ${limit} Limit\nReply pesan ini dengan jawabanmu!`.trim()
    conn.siapakahaku[id] = [
        await conn.sendButt(m.chat, caption, [[{text: 'Bantuan', callback_data: 'bantuan_siapakahaku'}]], { message_id: m.id }),
        json, poin, limit,
        setTimeout(async () => {
            if (conn.siapakahaku[id]) await conn.reply(m.chat, `Waktu habis!\nJawabannya adalah *${json.jawaban}*`, { message_id: conn.siapakahaku[id][0]?.message_id })
            delete conn.siapakahaku[id]
        }, timeout)
    ]
}

const similarity = require('similarity')
const threshold = 0.72

handler.before = async function(m, {conn}) {
    conn.siapakahaku = conn.siapakahaku ? conn.siapakahaku : {}
    let id = m.chat

    // Cek quoted dan basic validasi
    if (!m.quoted || !m.quoted.fromMe || !m.quoted.isBot || !m.text || !/SIAPAKAHAKU/i.test(m.quoted.text))
        return !0

    // Cek apakah id ada di siapakahaku
    if (!(id in conn.siapakahaku))
        return m.reply('Soal itu telah berakhir')

    // Cek apakah message id quoted sama dengan yang aktif
    if (m.quoted.id !== conn.siapakahaku[id][0]?.message_id)
        return !0

    let json = JSON.parse(JSON.stringify(conn.siapakahaku[id][1]))
    if (m.text.toLowerCase() == json.jawaban.toLowerCase().trim()) {
        global.db.data.users[m.sender].exp += conn.siapakahaku[id][2]
        global.db.data.users[m.sender].limit += conn.siapakahaku[id][3]
        await conn.reply(m.chat, `*Benar!* +${conn.siapakahaku[id][2]} XP Dan +${conn.siapakahaku[id][3]} Limit\n${json.jawaban}`, { message_id : m.id })
        clearTimeout(conn.siapakahaku[id][3])
        delete conn.siapakahaku[id]
    } else if (similarity(m.text.toLowerCase(), json.jawaban.toLowerCase().trim()) >= threshold)
        m.reply(`*Dikit Lagi!*`)
    else
        m.reply(`*Salah!*`)
    return !0
}

handler.callback = async function(m, { conn, ctx, chat, from, command }) {
    conn.siapakahaku = conn.siapakahaku ? conn.siapakahaku : {}
    let id = chat
    if(command === 'bantuan_siapakahaku') {
        if (!(id in conn.siapakahaku)) throw false
        let json = conn.siapakahaku[id][1]
        let ans = json.jawaban
        let clue = ans.replace(/[AIUEO]/gi, '_')
        return conn.reply(id, `Petunjuk: \`\`\`${clue}\`\`\`\nReply jawabanmu di pesan pertanyaannya`, { message_id: m.id })
    }
}


handler.help = ['siapakahaku']
handler.tags = ['game']
handler.command = /^siapakahaku/i
handler.callback_data = [
    'bantuan_siapakahaku'
]

module.exports = handler
