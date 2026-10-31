/**
 * Site content: the ONE file to edit when you want to change what the site says.
 *
 * Everything a visitor reads (names, paragraphs, project cards, links) lives
 * here as plain data. The page components in `src/pages/` just display it.
 *
 * Search this file for "TODO" to find placeholder text that still needs your
 * own words, links and details.
 */

/** Text for the welcome screen, the browser chrome and the taskbar. */
export const SITE = {
	/** Text shown on the very first browser tab (and the page's `<title>`). */
	welcomeTabTitle: "Welcome to Veronica's website!",
	/**
	 * The big clickable text on the welcome screen. Each entry is one line, and
	 * each line gets its own underline (like the reference artwork).
	 */
	welcomeTitleLines: ["Welcome to", "Veronica's website!"],
	/** Small blinking hint under the title before the visitor clicks. */
	enterHint: "- click the text to enter -",
	/** Hint shown after the visitor has clicked and the tabs have appeared. */
	exploreHint: "- pick a tab up top to explore -",
	/** Fake web address shown in the address bar; the tab's `path` is added to the end. */
	addressPrefix: "www.veronicas-website.web/",
	/** Label for the browser's button on the taskbar and its desktop icon. */
	browserName: "Veronica Explorer",
} as const;

/** "About" tab. TODO: write your own intro. */
export const ABOUT = {
	heading: "About me",
	/** One string per paragraph. */
	paragraphs: [
		"hi, I'm Veronica! Welcome to my personal website :)!",
		"I love crafting and staying active, and this website will serve as a little personal snapshot into projects I thought up or crafted in real life!",
	],
	/** Quick facts shown as a little list. Add, remove or rename freely. */
	facts: [
		{ label: "Based in", value: "Boston" },
		{ label: "Currently", value: "Healthcare consultant at SK" },
		{
			label: "Fun fact",
			value: "I like to go bouldering, knit, paint, read, and run",
		},
	],
};

/** One card on the "Projects" tab. */
export interface Project {
	/** Name of the project. */
	name: string;
	/** One or two sentences about it. */
	description: string;
	/** Small labels such as the tools you used. */
	tags: string[];
	/** Optional link; when set, a "view project" button appears on the card. */
	url?: string;
}

/** "Projects" tab. TODO: replace these three placeholder cards with your own. */
export const PROJECTS: Project[] = [
	{
		name: "Project One",
		description: "TODO: describe what this project is and why you made it.",
		tags: ["TypeScript", "React"],
		url: "https://github.com/",
	},
	{
		name: "Project Two",
		description: "TODO: describe what this project is and why you made it.",
		tags: ["Python"],
	},
	{
		name: "Project Three",
		description: "TODO: describe what this project is and why you made it.",
		tags: ["Design", "Pixel art"],
	},
];

/** A single "find me elsewhere" link on the Contact tab. */
export interface ContactLink {
	label: string;
	url: string;
}

/** "Contact" tab. TODO: use your real email and links. */
export const CONTACT = {
	heading: "Contact",
	intro: "feel free to reach out!",
	/** Shown as a `mailto:` link. */
	email: "veronicasong1@gmail.com",
	/** Extra links, shown as buttons. */
	links: [
		{ label: "GitHub", url: "https://github.com/VeroS-pdf" },
	] as ContactLink[],
};

/** "LinkedIn" tab. TODO: paste your own profile URL. */
export const LINKEDIN = {
	heading: "LinkedIn",
	blurb:
		"Not as much of a LinkedIn warrior as I used to be but feel free to connect!",
	/** Your LinkedIn profile address. */
	url: "https://www.linkedin.com/in/veronica-song",
	buttonLabel: "linkedin",
};
