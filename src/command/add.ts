import {
    SlashCommandBuilder,
    AutocompleteInteraction,
    ChatInputCommandInteraction
} from "discord.js";
import {
    pushToGitHub
} from "../service/github.ts"
import {
    postProcessGif
} from "../service/gifProcessing.ts";

export const data = new SlashCommandBuilder()
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
    id: string;
    animated: boolean;
    url: string;
    imageData: Buffer;
}

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        return interaction.reply({ content: "Guild only.", ephemeral: true });
    }
    
    const input = interaction.options.getString("emojis", true);
    
    const names = [...input.matchAll(/:([\w-]+):/g)].map(m => m[1]);
    
    if (!names.length) {
        return interaction.reply({
            content: "No emoji names found.",
            ephemeral: true
        });
    }
    
    const emojis = await interaction.guild.emojis.fetch();

    const added: AddedEmoji[] = [];
    const missing: string[] = [];
    
    for (const name of names) {
        const emoji = interaction.guild.emojis.cache.find(e => e.name === name);
        
        if (!emoji) {
            missing.push(name);
            continue;
        }

        const imageUrl = emoji.imageURL({extension: emoji.animated ? "gif" : "png"})!;
        const rawImageData = await fetch(imageUrl).then(response => response.arrayBuffer());
        const imageData = emoji.animated ? postProcessGif(Buffer.from(rawImageData)) : Buffer.from(rawImageData);

        added.push({
            name: emoji.name!,
            id: emoji.id,
            animated: emoji.animated,
            url: imageUrl,
            imageData: imageData
        });
    }
    
    if (!added.length) {
        return interaction.reply({
            content: "None of the provided emojis exist in this server.",
            ephemeral: true
        });
    }
    
    await pushToGitHub(added);
    
    await interaction.reply({
        content:
        `✅ Added ${added.length} emojis:\n` +
        added.map(renderEmoji).join(" ")
        + (missing.length ? 
            `\n\n⚠️ Missing:\n${missing.map(n => `:${n}:`).join(" ")}`
            : "")
        });
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
        
        // Split on spaces, autocomplete only the last token
        const parts = focused.split(/\s+/);
        const current = parts[parts.length - 1];
        
        if (!current.startsWith(":")) {
            return interaction.respond([]);
        }
        
        const query = current.slice(1).toLowerCase(); // strip leading :
        
        const emojis = await interaction.guild.emojis.fetch();
        
        const suggestions = emojis
        .filter(e => e.name?.toLowerCase().startsWith(query))
        .first(25) // Discord hard limit
        .map(e => ({
            name: `:${e.name}:`,
            value: replaceLastToken(parts, `:${e.name}:`)
        }));
        
        await interaction.respond(suggestions);
    }
    
    function replaceLastToken(parts: string[], replacement: string): string {
        return [...parts.slice(0, -1), replacement].join(" ");
    }
    