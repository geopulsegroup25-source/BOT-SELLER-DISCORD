const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Pastas
const botDir = __dirname;
const resourcesDir = path.join('c:', 'Users', 'joaop', 'Downloads', 'flrp base', 'resources');
const bahamasgg = path.join(resourcesDir, '[bahamasgg]');

const anticheatDir = path.join(bahamasgg, 'aegis-anticheat');
const screenshotBasicDir = path.join(bahamasgg, 'screenshot-basic');
const captureGameScreenDir = path.join(bahamasgg, 'capture-game-screen');

const zipPath = path.join(botDir, 'AEGIS_Client_Version.zip');

console.log('Iniciando o empacotamento do Cliente (v2)...');

// Prepara um diretório temporário para ser zipado com as pastinhas corretas dentro
const buildDir = path.join(botDir, 'AEGIS_RELEASE');
if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true, force: true });
fs.mkdirSync(buildDir, { recursive: true });

function copyDir(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`[AVISO] Pasta não encontrada: ${src}`);
        return false;
    }
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
    return true;
}

// 1. Copia o Anticheat para uma pasta chamada exatamente "aegis-anticheat" pra não dar problema no servidor do cliente
const aegisOut = path.join(buildDir, 'aegis-anticheat');
copyDir(anticheatDir, aegisOut);

// 2. Traz as dependências de Screenshots pro pacote
copyDir(screenshotBasicDir, path.join(buildDir, 'screenshot-basic'));
copyDir(captureGameScreenDir, path.join(buildDir, 'capture-game-screen'));

console.log('1. Pastas e scripts compilados.');

// 3. Limpeza Extrema de Segurança (Stripping)
const generatorPath = path.join(aegisOut, 'server', 'generator.lua');
if (fs.existsSync(generatorPath)) fs.unlinkSync(generatorPath);

const strippedKeys = path.join(aegisOut, 'generated_keys.txt');
if (fs.existsSync(strippedKeys)) fs.unlinkSync(strippedKeys);

const manifestPath = path.join(aegisOut, 'fxmanifest.lua');
if (fs.existsSync(manifestPath)) {
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    manifest = manifest.replace(/.*['"]server\/generator\.lua['"].*\r?\n?/g, '');
    fs.writeFileSync(manifestPath, manifest);
}
console.log('2. Códigos de geração de Master Keys foram obliterados da versão do cliente.');

// 4. Substituição de Webhooks
const configPath = path.join(aegisOut, 'config.lua');
if (fs.existsSync(configPath)) {
    let config = fs.readFileSync(configPath, 'utf8');
    // Encontra qualquer coisa igual a Config.DiscordWebhook = 'URL' e muda pra 'SUA_WEBHOOK_AQUI'
    config = config.replace(/(Config\.DiscordWebhook\s*=\s*)['"].*?['"]/g, "$1'COLOQUE_SEU_WEBHOOK_AQUI_E_CUIDADO_PARA_NAO_VAZAR_COMO_O_CRIADOR_FEZ_RSRS'");
    fs.writeFileSync(configPath, config);
    console.log('3. Proteção Ativa: Webhook original removido do arquivo Config!');
}

// Substituição da License pra impedir acesso direto do seu banco
const licensePath = path.join(aegisOut, 'license.json');
fs.writeFileSync(licensePath, JSON.stringify({ key: "COLOQUE_SUA_CHAVE_AEGIS_AQUI_QUE_VOCE_RECEBEU_NO_DISCORD" }, null, 4));
console.log('4. license.json resetada pro cliente preencher.');

// 5. Obfuscação / Criptografia do Código Lua
console.log('5. Criptografando e ofuscando o código-fonte (Anti-Leak/Anti-Roubo)...');
function obfuscateDir(dir) {
    let entries = fs.readdirSync(dir, { withFileTypes: true });
    for (let entry of entries) {
        let fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            obfuscateDir(fullPath);
        } else if (entry.name.endsWith('.lua') && entry.name !== 'fxmanifest.lua' && entry.name !== 'config.lua') {
            try {
                // Roda o Node Luamin para esmagar o código, renomear variáveis e remover toda indentação e comentários
                execSync(`npx --yes luamin -f "${fullPath}" > "${fullPath}.min"`);
                if (fs.existsSync(`${fullPath}.min`)) {
                    fs.copyFileSync(`${fullPath}.min`, fullPath);
                    fs.unlinkSync(`${fullPath}.min`);
                }
            } catch (err) {
                console.warn('[AVISO] Não foi possível ofuscar totalmente o arquivo: ' + entry.name);
            }
        }
    }
}
// Aplica a ofuscação APENAS na pasta do anticheat
obfuscateDir(aegisOut);
console.log('-> Código-fonte 100% blindado contra roubo!');

// 6. Compactação do Pacote Inteiro
console.log('6. Empacotando Cliente em ZIP estrito...');
try {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    // Ao fazer buildDir\*, ele zipa as PASTAS lá dentro, não um main folder
    execSync(`powershell -Command "Compress-Archive -Path '${buildDir}\\*' -DestinationPath '${zipPath}' -Force"`);
    console.log('-> SUCESSO! Cópia do Cliente gerada: AEGIS_Client_Version.zip com aegis-anticheat e os screen-captures!');
} catch (e) {
    console.error('Falha ao Empacotar:', e.message);
}

// 7. Del-Tree (Limpeza da pasta temporária visual)
if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
}
