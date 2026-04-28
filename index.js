require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sha256: luaSha256 } = require('./lua_sha256.js');
const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType,
    PermissionsBitField,
    InteractionType,
    EmbedBuilder,
    AttachmentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ] 
});

const AEGIS_GOLD = 0xFFC000;
const AEGIS_NAVY = 0x002D62;
const MASTER_SECRET = process.env.AEGIS_SECRET_KEY || "CHANGE_THIS_TO_YOUR_MASTER_SECRET_KEY_999";

// --- KEY GENERATION LOGIC ---
function generateAegisKey(targetIP, days) {
    const randomId = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000) + "" + Math.floor(Date.now() / 1000);
    let expiry = Math.floor(Date.now() / 1000) + (days >= 9999 ? 36500 * 86400 : days * 86400);
    const payload = randomId + targetIP + expiry.toString();
    const signature = luaSha256(MASTER_SECRET + payload);
    const shortSig = signature.substring(0, 16);
    return `AEGIS-${randomId}-${expiry}-${shortSig}`;
}

async function deliverAnticheat(discordUser, planName, targetIP) {
    const days = (planName.toLowerCase() === 'mensal') ? 30 : 9999;
    const key = generateAegisKey(targetIP, days);

    const embed = new EmbedBuilder()
        .setTitle('🛡️ AEGIS ANTICHEAT - ENTREGA')
        .setDescription(`**Acesso Liberado!**\n\nSeu pagamento foi confirmado pelo sistema. Uma chave de criptografia de alto nível foi gerada **exclusivamente e de forma permanente** para a rede da sua máquina (IP: \`${targetIP}\`).\n\n🔑 **Sua Licença IP-Locked:**\n\`${key}\`\n\n📦 **Arquivos do Anticheat (Download Oficial):**\nBaixe a versão Cliente atualizada através do link seguro no Google Drive:\n👉 **[Baixar AEGIS AntiCheat (Google Drive)](https://drive.google.com/file/d/1lU0tvTHIwtufIJe9ZrSCETkN-2GOk2Sb/view?usp=sharing)**`)
        .setColor(AEGIS_GOLD)
        .setTimestamp();

    await discordUser.send({ embeds: [embed] }).catch(() => {});
}

client.once('ready', () => {
    console.log(`✅ AEGIS BOT ONLINE - Comandos !, Botões e Modais Ativos.`);
});

// --- PREFIX COMMANDS HANDLING ---
client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;

    // Command: !booster
    if (message.content === '!booster') {
        const embed = new EmbedBuilder()
            .setColor('#0f172a') 
            .setTitle('🚀 Booster Aegis')
            .setDescription(`
🎉 **Seja Booster do Aegis** 🎉

💎 Benefícios exclusivos:

• 🏷️ Tag personalizada  
• 🔓 Acesso a todos os mods  
• 🌆 Bases de cidades blur  
• 🎧 Spotify VIP sem anúncios  
• 🚀 E muito mais...

👉 Torne-se booster agora!
            `)
            .setImage('[img]https://i.imgur.com/8JC17bc.jpeg[/img]') // <--- Add it here
            .setFooter({ text: 'Aegis Anticheat' }); // <--- Semicolon ONLY at the end

        await message.channel.send({ embeds: [embed] });
        return;
    }

    // Admin-only commands below
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    if (message.content === '!buy_panel') {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ AEGIS ANTICHEAT - LOJA OFICIAL')
            .setDescription('**O Anticheat mais seguro e inviolável do mercado.**\n\nProteja sua base do FiveM contra injetores lua, executors e cheaters profissionais. Nossa versão possui proteção vitalícia ligada ao IP da sua VPS.\n\nClique no botão abaixo para abrir seu carrinho de compras em uma sala privada e blindada.')
            .setColor(AEGIS_GOLD);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_buy').setLabel('Comprar Licença').setEmoji('🛒').setStyle(ButtonStyle.Success)
        );

        const logoFile = new AttachmentBuilder(path.join(__dirname, 'aegis_logo.jpg'));
        embed.setThumbnail('attachment://aegis_logo.jpg');

        await message.channel.send({ embeds: [embed], components: [row], files: [logoFile] });
        await message.delete().catch(() => {});
    }

    if (message.content === '!ticket') {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ CENTRAL DE ATENDIMENTO AEGIS')
            .setDescription('Selecione abaixo a opção desejada para abrir um chamado privado.')
            .setColor(AEGIS_NAVY);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_support').setLabel('Suporte Técnico').setEmoji('🛠️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_partner').setLabel('Parceria Comercial').setEmoji('🤝').setStyle(ButtonStyle.Secondary)
        );

        const logoFile = new AttachmentBuilder(path.join(__dirname, 'aegis_logo.jpg'));
        embed.setThumbnail('attachment://aegis_logo.jpg');

        await message.channel.send({ embeds: [embed], components: [row], files: [logoFile] });
        await message.delete().catch(() => {});
    }
});

// --- INTERACTIONS HANDLING (Buttons & Modals) ---
client.on('interactionCreate', async interaction => {
    
    // Handle Modals
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'modal_add_member') {
            const targetId = interaction.fields.getTextInputValue('user_id_input').trim();
            const member = await interaction.guild.members.fetch(targetId).catch(() => null);
            if (!member) return interaction.reply({ content: `❌ ID inválido.`, ephemeral: true });

            await interaction.channel.permissionOverwrites.edit(member.id, {
                ViewChannel: true, SendMessages: true, ReadMessageHistory: true
            });
            return interaction.reply({ content: `✅ <@${member.id}> adicionado!` });
        }

        if (interaction.customId === 'modal_approve_payment') {
            await interaction.deferReply();
            const rawPlan = interaction.fields.getTextInputValue('approve_plan').trim().toLowerCase();
            const targetIP = interaction.fields.getTextInputValue('approve_ip').trim();
            const creatorId = interaction.channel.topic;

            const targetUser = await client.users.fetch(creatorId).catch(() => null);
            if (!targetUser) return interaction.editReply('❌ Erro ao encontrar comprador.');

            try {
                await deliverAnticheat(targetUser, rawPlan, targetIP);
                const roleId = process.env.CUSTOMER_ROLE_ID;
                if (roleId) {
                    const m = await interaction.guild.members.fetch(creatorId).catch(() => null);
                    if (m) m.roles.add(roleId).catch(() => {});
                }
                await interaction.editReply(`✅ **Venda Aprovada!** Licença enviada.`);
            } catch (e) {
                await interaction.editReply(`❌ Erro DM: ${e.message}`);
            }
        }
        return;
    }

    // Handle Buttons
    if (!interaction.isButton()) return;

    if (interaction.customId === 'ticket_add_member') {
        const modal = new ModalBuilder().setCustomId('modal_add_member').setTitle('Adicionar Membro');
        const input = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('user_id_input').setLabel('ID do Usuário').setStyle(TextInputStyle.Short).setRequired(true));
        modal.addComponents(input);
        return interaction.showModal(modal);
    }

    if (interaction.customId === 'ticket_approve_payment') {
        const modal = new ModalBuilder().setCustomId('modal_approve_payment').setTitle('Aprovação AEGIS');
        const iPlan = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('approve_plan').setLabel('Plano (mensal/lifetime)').setStyle(TextInputStyle.Short).setRequired(true));
        const iIP = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('approve_ip').setLabel('IP da VPS').setStyle(TextInputStyle.Short).setRequired(true));
        modal.addComponents(iPlan, iIP);
        return interaction.showModal(modal);
    }

    if (interaction.customId === 'ticket_close') {
        await interaction.reply({ content: `⏳ Fechando...` });
        let messages = await interaction.channel.messages.fetch({ limit: 100 });
        let log = messages.map(m => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`).reverse().join('\n');
        const attachment = new AttachmentBuilder(Buffer.from(log, 'utf-8'), { name: `transcript.txt` });

        const creatorId = interaction.channel.topic;
        if (creatorId) {
            const creator = await client.users.fetch(creatorId).catch(() => null);
            if (creator) await creator.send({ content: `Ticket encerrado. Histórico:`, files: [attachment] }).catch(() => {});
        }
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        return;
    }

    // Create Ticket
    if (interaction.customId.startsWith('ticket_')) {
        await interaction.deferReply({ ephemeral: true });
        const type = interaction.customId.split('_')[1];
        
        const existing = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id);
        if (existing) return interaction.editReply(`❌ Você já tem um ticket: <#${existing.id}>`);

        const ticketChannel = await interaction.guild.channels.create({
            name: `${type}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            topic: interaction.user.id,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });

        const logoFile = new AttachmentBuilder(path.join(__dirname, 'aegis_logo.jpg'));
        const adminRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_add_member').setLabel('Adicionar Player').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger)
        );

        if (type === 'buy') {
            adminRow.addComponents(new ButtonBuilder().setCustomId('ticket_approve_payment').setLabel('Aprovar Pagamento').setStyle(ButtonStyle.Success));
            const embed = new EmbedBuilder()
                .setTitle('🛒 CAIXA - AEGIS ANTICHEAT')
                .setDescription(`Olá <@${interaction.user.id}>! Excelente escolha no **AEGIS Anticheat**.\n\nPara prosseguir, envie o pagamento via PIX:\n\n🔑 **Chave PIX:** \`07782788676\`\n\nEnvie o comprovante e o IP da VPS aqui.`)
                .setColor(AEGIS_GOLD).setThumbnail('attachment://aegis_logo.jpg');
            await ticketChannel.send({ embeds: [embed], components: [adminRow], files: [logoFile] });
        } else {
            await ticketChannel.send({ content: `<@${interaction.user.id}> Olá! Em que podemos ajudar?`, components: [adminRow] });
        }
        await interaction.editReply(`✅ Ticket aberto: <#${ticketChannel.id}>`);
    }
});

client.login(process.env.DISCORD_TOKEN);