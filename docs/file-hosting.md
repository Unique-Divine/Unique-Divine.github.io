# Website and public files

Project `exalted-justice-359714` uses account `realuniquedivine@gmail.com`.
Firebase site `uniquedivine-site` serves the Astro build and rewrites `/f/*`
to Cloud Run service `personal-files` in `us-central1`. The service reads
private bucket `uniquedivine-public-files-876932632137`. Public callers cannot
write objects or list the bucket. The runtime service account has object-reader
access to this bucket only. It uses managed credentials, not a downloaded key.

## Deployment

```bash
just files-setup   # bucket, service identities, APIs
just hosting-setup # add Firebase and create the Hosting site
just deploy-files # build/deploy only the file server
just deploy       # build/deploy only the Astro site
just hosting-domains # prepare verification/certificates, without DNS changes
just hosting-dns # configure Firebase routing; refuses conflicting website records
just hosting-dns-verify # refresh TXT records while retaining GitHub Pages routing
just hosting-cutover # switch website records after ownership and TLS checks
just files-smoke https://uniquedivine.com /path/to/screenshot.png
```

The Firebase CLI must be signed in with the personal account. The scripts
explicitly select that account and project; they do not change the global
active account. Firebase account terms require one-time acceptance in the
[Firebase console](https://console.firebase.google.com). API/CLI setup cannot
accept terms on behalf of the user.

The Hosting preview is `https://uniquedivine-site.web.app`. The production
origin is `https://uniquedivine.com`. Website deployment does not copy, delete, or sync
the file bucket. Uploading a file does not change the Hosting release.

## Publishing

Install the command from the Boku dotfiles checkout:

```bash
just fs-install
just fs-test
```

Publish with a required slug:

```bash
ud fs publish ~/.local/pbpaste-img/26-10/20261012-104530.png trade-modal
ud fs publish ./report.pdf migration-notes --date 2026-10-12
ud fs publish ./capture before-after.png --md
ud fs publish ./report.pdf migration-notes --dry-run
```

The object path becomes `YY/YYMMDD-slug.ext`, such as
`26/261012-trade-modal.png`. Semantic directories are relative to the year:
`ui/trade-modal.png` becomes `26/ui/261012-trade-modal.png`. The command inserts
the date prefix only on the final filename.
Screenshot dates are parsed from
`pbpaste-img` filenames. Other files use the Bangkok publication date.
An explicit `--date YYYY-MM-DD` takes precedence. Slugs contain lowercase
letters, digits, and single hyphens, with at most 80 characters before the
optional extension. An extension in the slug overrides the source extension;
otherwise the command copies the source filename's extension. It does not
inspect or convert file contents. Compound extensions such as `.tar.gz` are
accepted. MIME headers and output format follow the destination extension;
image alt text and file-link labels omit directories and the extension. Files may
be at most 256 MiB, or 268,435,456 bytes. Existing object names are refused
atomically; use a different slug for another version.

The command verifies public HTTP status and size before printing success.
It sends cloud progress to stderr, reserving stdout for the shareable output.
Without `--md`, output is the bare URL. With `--md`, supported raster images use an HTML
`<img src="URL" alt="descriptive slug" />` tag; other files, including SVG, use a Markdown link.
By default it also copies successful output with `clip.exe` or `pbcopy` when
available. Option `--no-clipboard` disables that step. A clipboard failure
does not turn a successful upload into a failure.

To select the preview origin explicitly:

```bash
UD_FS_BASE_URL=https://uniquedivine-site.web.app ud fs publish ./screenshot.png preview-test
```

Persistent settings use `~/.config/ud/fs/config.json`, or the corresponding
directory under `XDG_CONFIG_HOME`:

```json
{ "base_url": "https://uniquedivine.com" }
```

Environment variables `UD_FS_BASE_URL` and `UD_FS_BUCKET` override settings.
The previous `pub/config.json` supplies missing settings, and `PUB_BASE_URL`
and `PUB_BUCKET` remain fallbacks when the corresponding `UD_FS_*` variable
is absent. Environment settings take precedence over files. Configuration
contains no credentials.

The executable plugin is installed in the XDG user plugin directory. Command
`ud --help` lists it; `ud fs --help` describes its arguments. Recipe
`just ud-install`, also used by `just sync`, installs it with the Rust router.
The installer removes only the old managed `pub` symlink.

The installed local configuration uses `https://uniquedivine.com`.
Production cutover succeeded on October 12. Existing preview object keys also
work through the production `/f/` route.

The dated-path iteration deployed Cloud Run revision `personal-files-00003-h9c`.
A real `ud fs` image upload with an explicit extension returned
[this public screenshot](https://uniquedivine.com/f/26/10-12-github-activity-dated.png).
Its checksum, MIME, basename download header, ranges, and ETag validation passed;
duplicate CLI uploads were refused, and an existing flat URL remained readable.
Nine CLI tests and seven HTTP tests passed. A complete PDF with an explicit
extension also passed live verification; its temporary test object was removed.

## Listing

```bash
ud fs ls
ud fs ls --all
ud fs ls --time 26-09
ud fs ls 26/ui/
ud fs ls 26 --json
ud fs ls 26/ui --urls | fzf
ud fs ls --paths | rg twitter
```

Bare `ud fs ls` selects the current Bangkok calendar month and reports that
implicit scope on stderr. Flag `--all` selects the entire collection. A positional
directory selects all files recursively beneath it across dates; trailing
slashes are optional. An explicit `--time` narrows either selection. The command
uses the existing Google login to obtain an access token in memory and read
GCS object metadata. Each invocation fetches fresh data and follows every page
before emitting output, sorted by key. It does not download file contents.
Folder markers and names unsupported by the public server are skipped with a
stderr notice. Progress and errors stay on stderr; a failed page produces no
successful listing on stdout.

Default output is TOON with three columns. JSON uses the same fields; keys
remain available through `--paths`. For the live validation screenshot:

```toon
files[1]{url,size,contentType}:
  "https://uniquedivine.com/f/26/ui/261013-fs-interface-validation.png",54823,image/png
```

Mutually exclusive flags `--json`, `--urls`, and `--paths` provide
`{"files":[...]}` or one URL/key per line. Empty TOON is `files: []`; empty JSON
contains an empty `files` array; raw modes emit nothing. Local caching,
completion, and a private storage-adapter API remain future work.

On October 13, the updated plugin passed 14 local tests and live GCS pagination
checks. A real upload using a semantic directory and explicit extension returned
[this screenshot](https://uniquedivine.com/f/26/ui/261013-fs-interface-validation.png).
Exact bytes, ranges, ETag validation, duplicate refusal, and both legacy URL
layouts passed. TOON, JSON, URL, and path listings agreed. An SVG fixture retained
attachment handling and a Markdown link; it was removed after verification.
The existing server revision `personal-files-00003-h9c` already handles these
paths, so this CLI release requires no server deployment or IAM changes.

Time selectors accept `26` for 2026, `2609` or `26-09` for September,
and `261014` or `26-10-14` for October 14. Two-digit years mean 2000–2099.
Flag `--time` cannot be combined with `--all`. Filters use filename publication
dates, including older flat and `YY/MM-DD-*` layouts, rather than modification
times. Undated files appear only in unfiltered directory or `--all` listings.
The filter changes output size; listing still fetches all metadata under the
selected directory or root. Publishing name validation is unchanged.

## Read behavior and limits

PNG, JPEG, GIF, WebP, AVIF, and PDF files render inline. Other extensions
download as attachments, with `nosniff` and a sandbox policy. Full responses
stream instead of buffering the object. Requests support `HEAD`, ETag/date
validation, and single byte ranges, including suffix and open-ended ranges.
Invalid ranges return `416`; nonexistent files return `404`; HTTP writes
return `405`. ASCII path components support dated directories and existing
flat keys. The server rejects traversal, empty components, backslashes, and
encoded separators; download headers use the final filename only. Existing
flat URLs keep working without a storage migration.

Successful responses use five-minute browser/CDN caching. Errors use
`no-store` so missing-file requests do not become a long-lived negative cache.
Deleted content can remain in caches for up to five minutes. Other people's
downloaded copies and third-party image proxies have their own retention.
Live testing found that Firebase truncates dynamic responses at 32 MiB.
Bodies larger than 24 MiB redirect to the direct Cloud Run endpoint with
`?direct=1`, bypassing this proxy limit. The shared `/f/` link stays stable;
the browser may show the Cloud Run hostname after following the redirect.
`HEAD`, conditional responses, and ranges up to 24 MiB remain on Firebase.
Firebase has a 60-second request timeout; direct Cloud Run downloads have
a 300-second timeout. Range requests can resume slow downloads.

## List, download, delete, and recover

Run these commands with the personal account:

```bash
gcloud storage ls gs://uniquedivine-public-files-876932632137/ \
  --account=realuniquedivine@gmail.com
gcloud storage cp gs://uniquedivine-public-files-876932632137/KEY ./ \
  --account=realuniquedivine@gmail.com
gcloud storage rm gs://uniquedivine-public-files-876932632137/KEY \
  --account=realuniquedivine@gmail.com
gcloud storage ls gs://uniquedivine-public-files-876932632137/ --soft-deleted \
  --account=realuniquedivine@gmail.com
gcloud storage restore 'gs://uniquedivine-public-files-876932632137/KEY#GENERATION' \
  --account=realuniquedivine@gmail.com
```

Replace `KEY` with the object path, such as `26/10-12-trade-modal.png`, and
`GENERATION` with the listed
soft-deleted generation. Seven-day soft-delete retention protects accidental
deletion; it is not an independent backup. Restoration is possible only while
the deleted generation is retained.

Firebase custom domains for the apex and the `www` redirect are registered.
The requested ownership, certificate, and serving records are saved in
[domain-dns.json](./domain-dns.json). Refresh them with `just hosting-domains`
before applying changes because certificate challenges can change. Add the
ownership and certificate TXT records first, preserve existing TXT values,
and wait for validation before replacing the web A/CNAME records.

Runtime failures appear in Cloud Logging under service `personal-files`.
The service has zero minimum instances and a maximum of three instances.
Storage, network, builds, container images, DNS, and Hosting are billable
according to usage. This instance limit is not a spending cap.

## DNS cutover and rollback

Squarespace is the domain registrar; Cloud DNS now manages authoritative DNS.
On October 12 the user supplied the
complete DNS settings screenshot and untruncated Google verification string.
[The original records and delegation](./dns-before-migration.json) are saved
for rollback. No email or other subdomain records appeared in that supplied list.

The replacement Cloud DNS zone `uniquedivine-com` initially imported the four
GitHub Pages apex A values, the `www` GitHub CNAME, the Google verification TXT
value, and Squarespace's `_domainconnect` CNAME. Website
records use a 300-second TTL. Firebase ownership and certificate TXT records
are also present. All records were checked against each of the four assigned
nameservers. No registry DS record was returned by the public resolver.

The user changed Squarespace delegation on October 12. Google and Cloudflare
public resolvers now return `ns-cloud-a1` through `a4.googledomains.com`, and
both resolve the Firebase ownership and certificate TXT records. The original
`b` delegation is saved for rollback. At 09:41 UTC on October 12, both Firebase
domains reported `OWNERSHIP_ACTIVE` and `CERT_ACTIVE`; the guarded cutover
succeeded. The apex now uses A `199.36.158.100`, and `www` uses CNAME
`uniquedivine-site.web.app.`. All four authoritative nameservers and both public
resolvers returned these records. Trusted HTTPS serves the homepage, blog,
existing Go article, and public files; `www` redirects to the apex.
The local publisher now uses the production origin. A real image upload using
`--md` returned an HTML image tag and passed a 54,823-byte checksum, range,
conditional-read, and missing-file check. During staging, `www` temporarily used
GitHub A records plus ownership TXT; the cutover removed both staging records.

Ownership TXT, certificate TXT, and website routing records use a 300-second
TTL. Existing cached answers retain their previous TTL, and Firebase's own
verification schedule is separate. Routine file publication and site deployment
do not change DNS.

After delegation propagates, verify Firebase ownership and certificate
validation. Refresh challenges with `just hosting-dns-verify` if needed;
this recipe preserves current website routing. Once Firebase certificates are
ready, run `just hosting-cutover`. It requires active ownership and certificates
for both domains and verifies actual TLS against Firebase before changing DNS.
It atomically changes only the expected GitHub apex A and `www` CNAME records
to Firebase, retaining a 300-second TTL. Pending verification exits with code
3 and leaves website records intact.
`just hosting-dns` refuses conflicting A/CNAME records to prevent an accidental
traffic switch while certificates are pending.

Verify trusted HTTPS, existing pages, and `/f/` URLs after the traffic switch.
Then set the local publisher base URL to `https://uniquedivine.com`.
Keep GitHub Pages deployed and its custom-domain setting during propagation.
For rollback, restore the saved GitHub A/CNAME records in Cloud DNS or restore
the old Squarespace `b` nameserver delegation. DNS caches can delay either
change. Firebase Hosting releases can be rolled back separately; bucket files
remain independent.

## Deferred project-ID migration

Project display name `Unique Divine` is editable; project ID
`exalted-justice-359714` is permanent. A better ID requires another project
and a separate migration of existing live resources. Preserve this
[Google support reference](https://support.google.com/googleapi/answer/7014113?hl=en).
