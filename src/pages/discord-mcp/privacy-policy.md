---
layout: "~/layouts/MarkdownLayout.astro"
title: "Privacy policy for Unique Divine PC & AI"
---

Effective date: July 1, 2026

Operator: Unique Divine, an individual operating from the United States of America.

Privacy and support contact: [realuniquedivine@gmail.com](mailto:realuniquedivine@gmail.com)

Application ID: `1041378802477051977`

## What the application does

Unique Divine PC & AI is a privately operated tool that lets Unique Divine
publish announcements, read messages and threads, and configure automation and
tooling in authorized Discord servers. It connects through a bot account and
exposes tools to the operator's assistant through Model Context Protocol, or
MCP. The operator uses it much like a command-line tool, requesting a specific
read or action instead of offering a public bot service.

Unique Divine is the sole operator. Membership in a server where the bot is
installed does not give members access to its MCP tools. This policy also
covers information about people whose messages the integration processes.

The operator uses the integration to read messages in public server channels.
The workflow does not intentionally collect user location data or save private
communications in notes. Public messages may still contain personal information,
such as usernames or details their authors include in the text.

## Guild scope and installation

The integration operates in these Discord guilds:

| Guild | Guild ID |
| --- | --- |
| Nibiru | `947911971515293759` |
| Sai \| Onchain Markets | `1288600349602484315` |

The bot is publicly installable in Discord servers. Installation does not grant
access to the local MCP connection, which Unique Divine operates personally.
The documented operational scope is Nibiru and Sai | Onchain Markets. Installation
in another server does not authorize its members to invoke the MCP tools or
establish an agreement to provide service there.

Within these guilds, the operator uses the tool for public-channel communication
and authorized administrative tasks. Discord channel permissions and the scope
of the operator's request determine the permitted access and actions. Extending
operator-directed workflows to another guild requires authorization for that
work and an update to the documented operational scope.

## Information processed

To perform a requested read, publication, or configuration action, the
application may process:

- Message text, message IDs, timestamps, and links to messages.
- Author IDs, usernames, display names, and other author information returned
  with a message.
- Server and channel IDs, names, and information needed to locate messages.
- Embeds, attachment metadata and URLs, and other returned message fields.
- Announcement text and destination information supplied by the operator.
- Thread, role, permission, and other configuration information needed for
  requested guild operations.
- Tool requests, results, and diagnostic information used to operate the service.

The operator supplies a bot credential to authenticate with Discord. The
application does not ask server members for their Discord passwords or account
tokens.

## Purposes and scope

The application uses information to fulfill the operator's requests to read
threads, search communications, prepare and publish announcements, and configure
guild automation and tooling. Nibiru validator upgrade coordination is one
example of this use.

Access is bounded by Discord's permissions and the operator's authorized task.
An automation may perform repeated actions within a scope the operator
explicitly configures. Reading or drafting alone does not authorize publication.
The bot does not maintain a dedicated database of users or an archive of their
messages.

## AI processing and other providers

Discord returns requested information to the local integration. Tool results
may then be sent to OpenAI through the operator's AI agent tools for analysis,
summarization, and drafting. This can include requested message text, author
information, and channel context returned by Discord. Local execution of the
MCP server does not mean all message data stays on the operator's device.

The integration uses OpenAI Codex, signed in through the operator's ChatGPT
account. OpenAI processes submitted information under its
[Privacy Policy](https://openai.com/policies/privacy-policy/) and the applicable
[Codex data controls](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).
Processing can occur in the United States and other countries where OpenAI and
its service providers operate.

The operator uses message content for analysis, summarization, and drafting.
OpenAI data sharing for model training is disabled for this workflow. The operator
does not use Discord message content to train or fine-tune models or submit it
through feedback or sharing options that permit model training.

Announcements the operator publishes are shared with the destination Discord
channel. The operator does not save private communications in notes.

## Storage and retention

The bot does not keep a dedicated user-data store or persist message histories
for later analysis. It handles Discord data to execute requested operations and
return results. Credentials and operational settings, such as channel IDs used
by an automation, are distinct from a user-data archive.

Message data can remain in process memory and Discord client caches while the
integration runs. Tool results may also remain in assistant conversation history
and provider records under the applicable product's retention rules. Published
announcements remain in Discord until changed or removed. Private communications
are not saved in notes.

Codex stores local conversation history, including tool requests and results,
and diagnostic logs. The integration writes connection and error diagnostics
to the host. Error details and tool records may contain Discord information.
These records remain until the operator deletes them; no automatic expiry is
claimed. Public announcement excerpts may also appear in operational notes.
The operator does not maintain a separate bulk message archive.

To fulfill a deletion request, the operator checks relevant conversation
history, diagnostics, and operational notes, deletes copies under the operator's
control, and uses OpenAI's available privacy and deletion procedures for
provider-held copies. OpenAI describes its retention and exceptions in
[section 4 of its Privacy Policy](https://openai.com/policies/privacy-policy/#4-retention).
This integration does not promise zero retention or a fixed provider deletion
period beyond the applicable provider policy.

The operator will promptly delete copies under the operator's control when they
are no longer needed, when the integration stops operating, when Discord requests
deletion, or upon a valid deletion request from the affected person, unless
applicable law requires retention. If the integration receives API data in error,
the operator will immediately notify Discord and delete that data. Provider-held copies are
subject to the provider's deletion procedures and any legal or security
retention exceptions.

## Access and security

Access is intended to be restricted to the operator and necessary processing
providers. Bot permissions limit which Discord channels the integration can
access.

The MCP connection runs locally through the operator's AI tools. The bot
credential is held in local configuration with access limited to the operator's
operating-system account. It is not included in these pages or public source
code. Discord permissions limit the bot's access, and the operator can revoke
or rotate its credential through Discord.

If the operator learns of unauthorized access, the operator will stop affected
access, revoke compromised credentials, investigate and address the incident,
and notify Discord and affected people as required by Discord's terms and
applicable law.

## Requests, questions, and complaints

Contact [realuniquedivine@gmail.com](mailto:realuniquedivine@gmail.com) to ask about information the integration
processes, request correction or deletion, or report a concern. Where possible,
include the relevant message link or message ID and server/channel context.
Do not send passwords, bot tokens, or other credentials.

The operator will verify requests without collecting unnecessary information
and handle them under applicable requirements. Although the bot has no
dedicated user-data archive to search or delete, the operator will assess any
relevant copies held in notes, logs, or processing services.

Deleting a local or provider-held copy does not delete the original message
from Discord. Discord manages its own copies under its
[Privacy Policy](https://discord.com/privacy).

## Changes

The operator will update this policy when data practices change, update its
effective date, and keep the public policy link accessible.

The published policy page carries the latest version. Questions about changes
can be sent to the contact address above.

[About the tool](https://uniquedivine.com/discord-mcp) · [Terms of service](https://uniquedivine.com/discord-mcp/terms)
