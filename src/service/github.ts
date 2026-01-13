import { Octokit } from "octokit";
import { AddedEmoji } from "../command/add.js";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

export async function pushToGitHub(newEmojis: AddedEmoji[]) {
    for (const emoji of newEmojis) {
        const ext = emoji.animated ? "gif" : "png";
        const filePath = `${process.env.GITHUB_PATH}/${emoji.name}.${ext}`;
        
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER!!,
            repo: process.env.GITHUB_REPO!!,
            path: filePath,
            message: `Add emoji: ${emoji.name}`,
            content: emoji.imageData.toString("base64"),
            branch: process.env.GITHUB_BRANCH!!
        });
    }
}