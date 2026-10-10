---
layout: "~/layouts/MarkdownLayout.astro"
title: "Discord MCP: Unique Divine PC & AI"
---

Unique Divine PC & AI is my privately operated Discord tool. I use it to publish
announcements, read messages and threads in public server channels, and configure
scoped automation and tooling in servers where I have permission to do so.

The tool connects through a Discord bot account and makes operations available
to my AI agent tools through Model Context Protocol, or MCP. I use it much like
a command-line tool. One example is coordinating Nibiru validator upgrades by
reviewing prior announcements and preparing release communications.

## Access and operation

I am the sole operator of the MCP connection. Being a member of a server where
the bot is installed does not grant access to its tools. Posting and
administrative actions require my instruction or an automation I configure
with a defined scope. The bot's Discord permissions limit its access.

The integration sends requested message content and context to OpenAI Codex for
analysis and drafting. The bot does not maintain a dedicated user database or
message archive. Conversation history and diagnostics can still retain tool
results, as described in the privacy policy.

## Guild scope and installation

The integration operates in these Discord guilds:

| Guild | Guild ID |
| --- | --- |
| Nibiru | `947911971515293759` |
| Sai \| Onchain Markets | `1288600349602484315` |

Discord's Public Bot setting is disabled. Installation is restricted to the
application owner, Unique Divine; the application does not offer public
installation. Unique Divine is also the sole authorized operator of the local
MCP connection. Server membership does not grant access to that connection.

Within these guilds, the operator uses the tool for public-channel communication
and authorized administrative tasks. Discord channel permissions and the scope
of the operator's request determine the permitted access and actions. Extending
operation to another guild requires an installation by the owner and an update
to the documented guild scope.

## Public policies

- [Privacy policy](https://uniquedivine.com/discord-mcp/privacy-policy)
- [Terms of service](https://uniquedivine.com/discord-mcp/terms)

Both policies have an effective date of July 1, 2026.

## Privileged-intent review

The [review page](https://uniquedivine.com/discord-mcp/intent-review) explains the
historical-message use case, alternatives considered, a bounded read example,
and the observed access diagnostic.

## Contact

I operate the tool personally as Unique Divine from the United States of America.
For support, privacy questions, deletion requests, or reports of misuse, email
[realuniquedivine@gmail.com](mailto:realuniquedivine@gmail.com).

Server administrators can request that I stop accessing their server and can
also remove the bot or revoke its channel permissions through Discord.

Application ID: `1041378802477051977`.

This is an independently operated integration. It is not a Discord product or
endorsement.
