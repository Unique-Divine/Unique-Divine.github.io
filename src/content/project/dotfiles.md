---
title: "Dotfiles: How I Work"
summary: "My development environment connects Neovim, coding agents, a Rust clipboard bridge, and persistent terminal sessions across my laptop, phone, and remote machines. I maintain the setup in code so I can inspect it, repair it, and carry it to another machine."
role: "Design, Development, and Daily Maintenance"
icon: computer
group: current
featured: true
order: 3
links:
  - label: Source Code
    href: https://github.com/Unique-Divine/dotfiles
---

I spend a lot of time in a terminal. Writing code, reviewing changes, working
with agents, connecting to another machine. The environment around that work
has become a project of its own.

My dotfiles cover Neovim, shell setup, terminal sessions, agent configuration,
and tools I've built to connect them. Much of the setup runs on Ubuntu and
Windows Subsystem for Linux, or WSL, where a Linux development environment runs
alongside Windows. It also includes tooling for working across remote machines.

The interesting work tends to happen at the boundaries. Copying something out
of an editor should reach the right clipboard. Connecting from my phone should
let me find the terminal session I left running. Moving to another computer
shouldn't mean reconstructing my setup from memory.

Here's what goes into that environment:

- [An Environment I Can Carry Between Machines](#an-environment-i-can-carry-between-machines)
- [An Editor for Reading, Changing, and Reviewing Code](#an-editor-for-reading-changing-and-reviewing-code)
- [Shared Instructions and Portable Agent Configuration](#shared-instructions-and-portable-agent-configuration)
- [Making the Clipboard Work Across Boundaries](#making-the-clipboard-work-across-boundaries)
- [Picking Up Work From Another Device](#picking-up-work-from-another-device)
- [Maintaining My Own Herdr Fork](#maintaining-my-own-herdr-fork)
- [Personal Commands and Public File Links](#personal-commands-and-public-file-links)
- [Screenshots and Audio Capture](#screenshots-and-audio-capture)
- [Measuring Everyday Friction](#measuring-everyday-friction)

## An Environment I Can Carry Between Machines

Configuration gets hard to maintain when the version in Git and the version an
application actually reads are different files. I use managed symbolic links
to connect the two. Editing the checked-in configuration changes the file the
application uses, and Git gives me a record of what changed.

A manifest records the managed links. Setup recipes handle installation, while
health checks report whether the machine matches the intended configuration.
Two commands capture the distinction:

```bash
just sync
just health
```

The first applies the managed setup. The second checks it without changing
anything. It can report missing tools, broken links, or configuration that has
drifted. System packages and Homebrew formulas have documented installation
paths, so the setup includes the tools behind the shell configuration too.

Neovim plugins have a lockfile, and Mason, the editor's external-tool manager,
has a separate record of package versions. Restoring those tools is an explicit
step. A missing language server shouldn't quietly turn into a different setup
on each computer.

There are still prerequisites and machine-specific choices. What I get from
keeping this in code is a process I can inspect and repeat, with checks that
help identify which part needs attention.

## An Editor for Reading, Changing, and Reviewing Code

Neovim is where I read and edit code. Telescope handles fuzzy file searches,
open buffers, and searching repository contents. Harpoon keeps frequently used
files close. Language servers provide diagnostics and navigation, Tree-sitter
handles syntax-aware highlighting, and the debugger setup includes Go support.

Git integration matters just as much. Gitsigns exposes changed hunks and blame
information in the editor, while Fugitive provides Git operations without
leaving it. I want to understand a change where I'm reading the code, including
when an agent wrote the first version.

Agents work in terminal sessions alongside the editor. I can ask for a change,
inspect the diff, follow a symbol, and edit the result myself. Search and
navigation make that review practical when the change spans several files.

The configuration also covers smaller interactions: snippets, formatting,
light and dark themes, and clipboard integration. These details affect the
same editing loop I repeat throughout the day. The configuration and its
[Neovim documentation](https://github.com/Unique-Divine/dotfiles/tree/main/nvim)
keep those choices together.

## Shared Instructions and Portable Agent Configuration

Using several coding tools raises a maintenance problem. Instructions and
preferences can become slightly different copies, with no clear answer about
which one should be updated.

I keep agent skills in canonical locations and synchronize the runtime links
that expose them to the tools. A skill is a set of instructions for a recurring
task. Public skills can be shared, while private skills stay in the private
workspace. The synchronizer checks for duplicate names and unexpected link
targets. It can also export selected private skills into a team repository
when explicitly configured to do so.

Codex and Cursor preferences have their own managed configuration. Those tools
also keep authentication, history, onboarding state, and other local data in
their runtime directories. My scripts merge the settings I own while preserving
tool-managed state. Linking an entire runtime file into Git would be the wrong
choice for a file that can contain authentication information.

The configuration tooling supports previews and drift checks. That gives me a
way to see what would change before applying it, and to check whether another
machine has the same intended defaults.

## Making the Clipboard Work Across Boundaries

The clipboard is a small feature until it interrupts everything you're doing.
With WSL, the editor and shell run on Linux while the desktop clipboard belongs
to Windows. Text needs to cross that boundary correctly.

I maintain a [Rust clipboard bridge](https://github.com/Unique-Divine/dotfiles/tree/main/clipboard)
that keeps a PowerShell clipboard process warm. Commands such as `pbcopy` and
`pbpaste` dispatch through the installed bridge binary, and Neovim uses the
same integration. Repeated clipboard requests don't each need to start a new
PowerShell process.

Text arrives as UTF-8 on the Linux side and uses UTF-16 in the Windows clipboard.
The bridge handles that conversion, including emoji and characters outside the
basic Unicode range. A fast copy command is only useful if the pasted text is
still correct.

SSH adds another wrinkle. A process launched through SSH doesn't necessarily
have access to the logged-in Windows desktop's clipboard. The bridge has health
checks and an explicit Windows logon-task setup for that case. A running daemon
alone doesn't prove that it can reach the desktop clipboard.

Images have a separate path. Command `pbpaste-img` saves the Windows clipboard
image into WSL and copies the resulting file path. That makes a screenshot
available to terminal tools as an actual file.

## Picking Up Work From Another Device

Sometimes I want to check on work from my phone. Sometimes the work belongs on
a separate machine that can keep running after I disconnect.

I use Moshi with Tailscale and SSH for phone access. The host integration helps
me discover workspaces and jump to terminal sessions. Having terminal access is
one part of that experience; finding the session I meant to return to is another.

On a remote workstation, Herdr keeps the shells and processes running there.
I can attach with a local client, keeping the interface on my current machine
while the work executes remotely. Direct SSH attachment provides another route,
including from a phone. Detaching leaves the remote session running.

This depends on the host being available and the relevant services running.
The setup documents how to distinguish network reachability, SSH access, and
session discovery when something fails. They're separate layers, and fixing
the wrong one can waste a lot of time.

Moshi, Tailscale, SSH, and Herdr are existing tools I've connected into my
workflow. My work is in the configuration and integrations that make switching
between them practical.

## Maintaining My Own Herdr Fork

Herdr is a terminal multiplexer I use for agent work. My configuration enables
saved pane history and conversation restoration, and the repository contains a
maintained fork alongside its configuration.

Maintaining that fork includes distribution. The release tooling builds
platform-specific binaries and records checksums, versions, and source
metadata. Installation checks the downloaded binary and replaces the installed
one atomically. A failed check leaves the previous binary in place. Running
sessions keep their loaded executable rather than being restarted by an update.

I've also been developing `herdr-tmux`, an early personal tool for tmux-style
pane layouts and numbered pane and agent pickers. Its layout commands rearrange
existing panes while keeping their processes and scrollback alive. The CLI is
still evolving; the release instructions distinguish local development from
installation paths that depend on publication.

This is where a configuration repository starts carrying more maintenance
responsibility. Changes to the terminal need installation and verification
paths too, especially when I depend on it to keep other work running.

## Personal Commands and Public File Links

The repository contains [`ud`](https://github.com/Unique-Divine/dotfiles/tree/main/ud),
my command router for workstation and development tasks. Its Rust command tree
provides argument parsing, help, and generated shell completion. Shell helpers
retain operations that need the personal environment, while executable plugins
extend the command tree.

One plugin, `ud fs`, publishes assets to my own website. A screenshot or PDF can
be useful evidence for a pull request, but an agent needs a public URL to put
it in the description. This gives that workflow a command-line interface:

```bash
ud fs publish ./screenshot.png ui/trade-modal --md
ud fs ls --time 26-10 --urls
```

Publishing adds a year directory and date-prefixed filename, with optional
semantic directories such as `ui`. It verifies the public response and can
return an HTML image tag for a supported image. Names aren't silently
overwritten, so a later upload doesn't replace evidence in an existing review.

Listing can return structured metadata, bare URLs, or stored paths. Those
outputs work with shell filters and selectors. Local listing caching is still
separate follow-up work; the implemented command fetches remote metadata.

## Screenshots and Audio Capture

Windows capture tools are part of this environment too. The `sharex` helper
opens the month's ShareX screenshot directory in Neovim or File Explorer. It
resolves the configured Windows Documents folder instead of assuming a fixed
location.

The repository also has ShareX audio-capture scripts for recording system
playback and microphone input together. They discover the default recording
device, match it to the available capture inputs, and generate FFmpeg arguments
for ShareX. The microphone's device name can differ between machines, so it
belongs in discovery rather than a copied command string.

The scripts expose their selected devices and generated arguments as structured
output. Applying a hotkey change requires an explicit target and supports a dry
run. That makes it possible to inspect the recording setup before changing it.

## Measuring Everyday Friction

Shell startup, editor loading, and clipboard behavior are things I can measure
and check after making a change. The repository keeps benchmark methods beside
results so I can tell what a number actually describes.

For example, an August 24, 2026 WSL benchmark moved full Goenv initialization
off the initial shell path, while keeping its executable and shim paths
available. With 20 measured runs and five warmups, the recorded results were:

| Measurement | Before | After |
| --- | ---: | ---: |
| Synchronous Shell Startup | 2,178.50 ms | 481.34 ms |
| Prompt Ready for Input | 2,696.66 ms | 1,012.85 ms |

Those are local measurements. Prompt readiness means the shell can accept
input; it doesn't mean every deferred plugin has finished loading. The
[benchmark log](https://github.com/Unique-Divine/dotfiles/blob/main/benchmarks.md)
records that distinction and later checkpoints.

Clipboard measurements exposed a similar issue: starting PowerShell dominated
paste latency. That helped motivate keeping the process alive between requests.
Tests check behavior, while benchmarks help identify where the time goes.

I use this environment to maintain other software, and using it keeps exposing
things worth fixing. Those fixes go back into the repository so the next
session, or the next machine, can benefit from them.
