/**
 * Site content: the ONE file to edit when you want to change what the site says.
 *
 * Everything a visitor reads (names, paragraphs, project cards, links) lives
 * here as plain data. The page components in `src/pages/` just display it.
 *
 * Search this file for "TODO" to find placeholder text that still needs your
 * own words, links and details.
 */

/** Text for the lock screen and the browser's address bar. */
export const SITE = {
	/**
	 * The big greeting on the lock screen. Each entry is one line, and each line
	 * gets its own underline.
	 */
	welcomeTitleLines: ["Welcome to", "Veronica's website!"],
	/** Small blinking hint on the lock screen. */
	unlockHint: "- click anywhere to unlock -",
	/** Fake web address shown in the address bar; the page's `path` is added to the end. */
	addressPrefix: "www.veronicas-website.web/",
} as const;

/** "Bio" tab: the page the Explorer app opens. */
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

/** "LinkedIn" app. The browser window shows this card plus a button to your real profile. */
export const LINKEDIN = {
	heading: "LinkedIn",
	/** Name and headline shown on the profile card. */
	name: "Veronica Song",
	headline: "Healthcare consultant at SK",
	location: "Boston",
	blurb:
		"Not as much of a LinkedIn warrior as I used to be but feel free to connect!",
	/** Your LinkedIn profile address. */
	url: "https://www.linkedin.com/in/veronica-song",
	buttonLabel: "linkedin",
};

/** One featured repository on the GitHub page. */
export interface Repo {
	name: string;
	description: string;
	url: string;
}

/** "GitHub" app. The browser window shows this card plus a button to your real profile. */
export const GITHUB = {
	heading: "GitHub",
	name: "Veronica Song",
	username: "VeroS-pdf",
	// TODO: tweak this blurb so it sounds like you.
	blurb: "Peek at the code behind this website, and whatever else I'm tinkering with.",
	/** Your GitHub profile address. */
	url: "https://github.com/VeroS-pdf",
	buttonLabel: "github",
	/** Repositories to highlight. Add, remove or reword freely. */
	repos: [
		{
			name: "Veronica_Intro",
			description:
				"This very website: a tiny pixel-art computer built with React and TypeScript.",
			url: "https://github.com/VeroS-pdf/Veronica_Intro",
		},
	] as Repo[],
};
