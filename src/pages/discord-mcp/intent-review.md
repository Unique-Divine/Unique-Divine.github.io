---
layout: "~/layouts/MarkdownLayout.astro"
title: "Discord MCP: privileged-intent review"
---

This page describes the Message Content use case for **Unique Divine PC & AI**,
application `1041378802477051977`. It provides review text, a bounded workflow
example, and a diagnostic result checked on October 10, 2026.

## Application purpose and users

I operate this integration personally to coordinate announcements and maintain
Discord tooling for Nibiru and Sai. It runs locally through a bot account and
exposes operations to my AI agent tools through Model Context Protocol, or MCP.
I am its sole operator. Public Bot is disabled, so installation is owner-only.
Server membership does not grant access to the MCP connection.

The installed guilds are **Nibiru**, `947911971515293759`, and
**Sai | Onchain Markets**, `1288600349602484315`. The integration is used for
requested public-channel reads and authorized posting and administrative actions
within these guilds. It does not offer public installation or a public AI chatbot.

## Why Message Content is needed

I use the integration to retrieve existing announcements and surrounding replies
from authorized channels, identify the relevant release and operational
instructions, and prepare the next announcement using that context.

For example, before a Nibiru chain upgrade, I ask it to review earlier validator
communications. The integration needs the message text to distinguish a release
announcement from its follow-up instructions and identify proposal links, upgrade
heights, timing estimates, and container references. Author IDs and timestamps
alone cannot supply that information.

The requested access supports historical communication review. Posting a new
announcement by itself does not require Message Content.

## Alternatives considered

Slash commands can initiate a request, but do not provide the text of unrelated
historical messages. A message context command can supply the selected message;
it does not supply unselected surrounding messages or an entire historical
thread. Messages mentioning the bot also do not cover earlier announcements
that did not mention it.

I could manually copy individual messages into the assistant. That changes the
workflow into manual message selection and omits the bounded retrieval of
surrounding context. The MCP integration instead retrieves the requested context
through Discord's API with an explicit channel and message limit. It is not used
to crawl all guild history or build a searchable archive of members' messages.

These alternatives follow Discord's
[privileged-intent guidance](https://docs.discord.com/developers/gateway/you-might-not-need-a-privileged-intent).

## Bounded workflow example

1. I ask the assistant to review previous upgrade announcements in Nibiru's
   `mainnet-validators` channel and explain the established announcement format.
2. The assistant requests a small set of messages around a known announcement
   through the MCP tool `discord_read_messages`.
3. Once content access is available, the tool returns the requested message
   text and context for analysis and drafting. I check the resulting draft.
4. Publishing requires a separate instruction from me, or an automation I have
   explicitly configured. A read request does not authorize publication.

Example MCP arguments for the documented historical announcement:

```json
{
  "channelId": "1171230865800568852",
  "around": "1546553703299948544",
  "limit": 5
}
```

These are example arguments supported by the installed tool, not a captured
successful MCP call. The
[prior v2.19.0 announcement](https://discord.com/channels/947911971515293759/1171230865800568852/1546553703299948544)
and its
[follow-up reply](https://discord.com/channels/947911971515293759/1171230865800568852/1546553817577951242)
are recorded operational precedent. Discord visibility depends on the viewer's
access to that channel.

## Observed read diagnostic

A read-only REST check using the configured bot credential fetched one message
from `mainnet-validators` on October 10, 2026. Discord returned HTTP 200 and one
message object, but its content field was empty. The same credential confirmed
that Public Bot is disabled.

```json
{
  "endpoint": "GET /channels/1171230865800568852/messages?limit=1",
  "http_status": 200,
  "messages_returned": 1,
  "content_length": 0,
  "public_bot": false
}
```

[Download the sanitized diagnostic summary](/discord-mcp/read-check.json) or
[view its screenshot](/discord-mcp/read-check.png). The screenshot shows the
rendered diagnostic summary, not a successful live MCP workflow.
The summary contains no credentials or message text. An empty content field is
consistent with unavailable Message Content access; this diagnostic alone does
not prove the original message contained text or establish the complete cause.
It is a REST diagnostic, not proof that the MCP client has reconnected or that
an end-to-end historical read succeeds.

## Requested intents and implementation status

The historical read example justifies requesting **Message Content**.
It has no Guild Presences dependency and does not require a full member list.
The installed client requests Guild Members as well as Message Content; that
additional dependency still needs to be removed or separately justified before
submitting a minimum-intent request. This page supplies no Guild Members or
Guild Presences justification.

A successful live read demonstration remains to be captured after access and
client login are restored. Encryption at rest for local retained records and
backups also remains unverified. This page does not attest that all review or
security checks are complete, or that Discord has approved the application.

## Data handling and deletion

Requested message text, author metadata, and channel context pass to OpenAI
Codex for analysis and drafting. OpenAI data sharing for training is disabled
for this workflow. The bot does not keep a dedicated user database or bulk
message archive. Local assistant histories, diagnostics, provider records, and
selected public operational notes can retain copies, as described in the
[privacy policy](https://uniquedivine.com/discord-mcp/privacy-policy).

Privacy and deletion requests go to
[realuniquedivine@gmail.com](mailto:realuniquedivine@gmail.com). I check relevant
copies under my control and use available provider deletion procedures.
The [terms of service](https://uniquedivine.com/discord-mcp/terms) describe
permitted access, operator instructions, and support.

Discord asks applicants to explain the concrete feature, why alternatives do
not supply its required data, and how the data is handled. See its
[intent-review guide](https://docs.discord.com/developers/gateway/getting-started-with-privileged-intent-review)
and [Developer Terms, section 5](https://support-dev.discord.com/hc/en-us/articles/8562894815383-Discord-Developer-Terms-of-Service).

[About the tool](https://uniquedivine.com/discord-mcp)
