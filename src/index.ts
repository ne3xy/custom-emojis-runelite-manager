import { Client, GatewayIntentBits } from "discord.js";
import { execute as add, autocomplete as addAutocomplete } from "./command/add"

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.on("interactionCreate", async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "add") {
                await add(interaction);
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
                ephemeral: true
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);