# MSA Link Sharer

Chrome extension for Microsoft Student Ambassadors (*Community Influencer* path).
It automatically adds your **Contributor ID** to eligible Microsoft links and keeps a
history of the resources you have learned from / shared.

## What it does

1. Gets the URL of the active tab.
2. Removes the language-locale segment if present (`en-us/`, `fr-fr/`, etc.).
3. Appends your Contributor ID at the end:
   - `?wt.mc_id=studentamb_######` if the URL has no query parameters yet,
   - `&wt.mc_id=studentamb_######` if the URL already contains a `?` (e.g. another `mc_id`).
4. Lets you copy the link, save it to a list, or share it
   directly on X / LinkedIn.
5. Keeps a local history (exportable as CSV) of all saved resources.

## Installation (developer mode)

1. Unzip the `ms-student-amb-extension` folder.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the `ms-student-amb-extension` folder.
6. Pin the extension in the toolbar (puzzle icon 🧩 → pin).

## Setup

1. Click the extension icon.
2. Enter your **Contributor ID** (format `studentamb_######`, available on your Ambassador dashboard).
   It is saved automatically and synced across your signed-in Chrome devices.

## Usage

1. Go to a Microsoft Learn / Docs / TechCommunity / DevBlogs page you want to share.
2. Click the extension icon.
3. The link with your Contributor ID is generated automatically.
4. Copy it, save it to your list, or share it directly on X/LinkedIn.

## Note

The extension warns (⚠️) if the URL does not appear to come from a known Microsoft domain,
but still lets you generate and copy the link — always verify content eligibility
against the program rules.
