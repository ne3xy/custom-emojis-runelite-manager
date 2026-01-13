import 'dotenv/config'
import { Client, GatewayIntentBits, MessageFlags, REST, Routes } from "discord.js";
import { command as addCommand, execute as add, autocomplete as addAutocomplete } from "./command/add.ts"

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const rest = new REST().setToken(process.env.DISCORD_TOKEN!!);

client.once("clientReady", async () => {
    console.log(`Logged in as ${client.user?.tag}`);
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!!), { body: [ addCommand ] });
    console.log("Registered slash commands.");
});

client.on("interactionCreate", async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "add") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                await add(interaction).catch(err => {
                    console.error(err);
                    interaction.followUp({
                        content: `❌ ${typeof err === "string" ? err : "Failed to add emoji."}`,
                        flags: MessageFlags.Ephemeral 
                    });
                });
            }
        }
        
        else if (interaction.isAutocomplete()) {
            if (interaction.commandName === "add") {
                await addAutocomplete(interaction);
            }
        }
    } catch (err) {
        console.error(err);
        
        if (interaction.isRepliable()) {
            await interaction.reply({
                content: "Something went wrong.",
                flags: MessageFlags.Ephemeral 
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);