import {
    SlashCommandBuilder,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    MessageFlags,
    Guild
} from "discord.js";
import {
    pushToGitHub
} from "../service/github.ts"
import {
    postProcessGif
} from "../service/gifProcessing.ts";

export const command = new SlashCommandBuilder()
.setName("add")
.setDescription("Add emojis to GitHub")
.addStringOption(option => option
    .setName("emojis")
    .setDescription("Space-separated list of emojis")
    .setRequired(true)
    .setAutocomplete(true)
);
    
export interface AddedEmoji {
    name: string;
    ext: string;
    id: string;
    animated: boolean;
    url: string;
    imageData: Buffer;
}

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        return interaction.followUp({ content: "Guild only.", flags: MessageFlags.Ephemeral  });
    }
    
    const name = interaction.options.getString("emojis", true);
    const emojis = await interaction.guild.emojis.fetch();
    const emoji = interaction.guild.emojis.cache.find(e => e.name === name);

    if (!emoji) {
        throw `${name} isn't an emoji in this server.`
    }
    
    const imageUrl = emoji.imageURL(emoji.animated ? { animated: true } : { extension: "png" })!;
    const rawImageData = await fetch(imageUrl).then(response => response.arrayBuffer());
    const imageData = emoji.animated ? await postProcessGif(Buffer.from(rawImageData)) : Buffer.from(rawImageData);

    await pushToGitHub({
        name: emoji.name!,
        id: emoji.id,
        animated: emoji.animated,
        ext: emoji.animated ? "gif" : "png",
        url: imageUrl,
        imageData: imageData
    }).catch(err => {
        console.error(`Failed to push emoji ${emoji.name} to GitHub:`, err);
        throw err
    });
    
    console.log(`Added emoji ${emoji.name} to GitHub.`);
    await interaction.followUp({
        content:`✅ Added ${renderEmoji(emoji)} to GitHub.`
    }).catch((err) => {
        console.error(`Failed to send reply for emoji ${emoji.name}.`)
        throw err;
    });
    try {
        await (interaction.channel as any).send({
            content: `✅ Added ${renderEmoji(emoji)} to GitHub for custom-emojis plugin.`
        });
    } catch (err) {
        console.error(`Failed to send message in channel ${interaction.channel} for emoji ${emoji.name}.`, err);
    }
}
    
function renderEmoji(emoji: {
    name: string;
    id: string;
    animated: boolean;
}) {
    return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guild) return;
    
    const focused = interaction.options.getFocused();
    
    const suggestions = getSuggestions(interaction.guild, focused);

    if (suggestions.length === 0) {
        await interaction.guild.emojis.fetch()
        await interaction.respond(getSuggestions(interaction.guild, focused));
    } else {
        await interaction.respond(suggestions);
    }
}    

function getSuggestions(guild: Guild, input: string) {
    return guild.emojis.cache
    .filter(e => e.name?.toLowerCase().startsWith(input.toLowerCase()))
    .first(25) // Discord hard limit
    .map(e => ({
        name: e.name,
        value: e.name
    }));
}
