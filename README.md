# Lingoda Review Extension

A simple Chrome extension that allows users to rate Lingoda classes and teachers. You can leave a review with a rating (out of 5 stars) and a note, then view your reviews while booking future classes.

## Features

- **Class Details Page**: Leave a review (rating and note) for a class and teacher directly on the class details page.
- **Booking Page**: View your saved reviews for teachers while booking classes. The review includes a rating out of 5 and a button to view the note you left.

## Screenshots

_TODO: Add screenshots of the extension in action (e.g., on the class details and booking pages)._

## Installation

1. Clone or download this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the folder containing this extension's files.
5. The extension will now be loaded into your browser!

## Usage

### Class Details Page
1. Go to any Lingoda class details page (e.g., `https://learn.lingoda.com/en/account/class/details/...`).
2. Scroll down to the class section.
3. Fill in the **Rating** (out of 5) and **Note** fields for the class.
4. Click the **Submit Review** button to save your review. Your rating and note will be stored locally and will appear next time you visit the same teacher’s class.

### Booking Page
1. Go to the Lingoda booking page (e.g., `https://learn.lingoda.com/en/account/booking`).
2. Scroll through the list of available classes.
3. If you've already reviewed a teacher, your review will appear next to their name (showing the rating and a "View Note" button).
4. Click **View Note** to see the note you left.

## Development

### How It Works
- The extension uses `chrome.storage.local` to store reviews locally on your browser.
- The extension observes when elements load on the Lingoda pages and dynamically injects review forms and displays where appropriate.

