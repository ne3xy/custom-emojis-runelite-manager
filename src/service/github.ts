import { Octokit } from "octokit";
import type { AddedEmoji } from "../command/add.ts";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

export async function pushToGitHub(emoji: AddedEmoji) {
    const filePath = `${emoji.name}.${emoji.ext}`;
    const sha = await octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: filePath,
        branch: process.env.GITHUB_BRANCH!,
    }).catch(() => null).then(content => (content?.data as any)?.sha);
    
    await octokit.rest.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_OWNER!!,
        repo: process.env.GITHUB_REPO!!,
        path: filePath,
        message: `Add emoji: ${emoji.name}`,
        content: emoji.imageData.toString("base64"),
        sha: sha,
        branch: process.env.GITHUB_BRANCH!!
    });
}