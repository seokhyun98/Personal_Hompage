// Add your javascript here

window.darkMode = false;

const stickyClasses = ["fixed", "h-14"];
const unstickyClasses = ["absolute", "h-20"];
const stickyClassesContainer = [
	"border-neutral-300/50",
	"bg-white/80",
	"dark:border-neutral-600/40",
	"dark:bg-neutral-900/60",
	"backdrop-blur-2xl",
];
const unstickyClassesContainer = ["border-transparent"];
let headerElement = null;

document.addEventListener("DOMContentLoaded", () => {
	headerElement = document.getElementById("header");

	if (
		localStorage.getItem("dark_mode") &&
		localStorage.getItem("dark_mode") === "true"
	) {
		window.darkMode = true;
		showNight();
	} else {
		showDay();
	}
	stickyHeaderFuncionality();
	applyMenuItemClasses();
	window.addEventListener("hashchange", handleHistoryNavigation);
	window.addEventListener("popstate", handleHistoryNavigation);
	window.addEventListener("scroll", updateMenuOnScroll, { passive: true });
	evaluateHeaderPosition();
	mobileMenuFunctionality();
	smoothScrollMenuLinks();
});

function prefersReducedMotion() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getLocalTarget(href) {
	if (href !== "/" && !href.startsWith("/#")) return null;
	const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "#home";
	const id = hash === "#home" ? "home" : hash.slice(1);
	const target = document.getElementById(id);
	return target ? { hash, id, target } : null;
}

function scrollToTarget(target, { focus = false } = {}) {
	target.scrollIntoView({
		behavior: prefersReducedMotion() ? "auto" : "smooth",
		block: "start",
	});
	if (focus) {
		target.setAttribute("tabindex", "-1");
		target.focus({ preventScroll: true });
		target.addEventListener("blur", () => target.removeAttribute("tabindex"), {
			once: true,
		});
	}
}

function smoothScrollMenuLinks() {
	for (const link of document.querySelectorAll("#menu a")) {
		link.addEventListener("click", (e) => {
			const href = link.getAttribute("href") || "";
			const destination = getLocalTarget(href);
			if (!destination) return;

			e.preventDefault();
			const nextUrl =
				destination.id === "home"
					? "/"
					: `${window.location.pathname}${destination.hash}`;
			const currentUrl = `${window.location.pathname}${window.location.hash}`;
			if (currentUrl !== nextUrl) history.pushState({}, "", nextUrl);
			applyMenuItemClasses(destination.hash);
			closeMobileMenu({ returnFocus: false });
			scrollToTarget(destination.target, { focus: e.detail === 0 });
		});
	}
}

function handleHistoryNavigation() {
	applyMenuItemClasses();
	if (window.location.pathname !== "/") return;
	const id = window.location.hash ? window.location.hash.slice(1) : "home";
	if (id.startsWith("pub-")) return;
	const target = document.getElementById(id);
	if (target) requestAnimationFrame(() => scrollToTarget(target));
}

// window.toggleDarkMode = function(){
//     document.documentElement.classList.toggle('dark');
//     if(document.documentElement.classList.contains('dark')){
//         localStorage.setItem('dark_mode', true);
//         window.darkMode = true;
//     } else {
//         window.darkMode = false;
//         localStorage.setItem('dark_mode', false);
//     }
// }

window.stickyHeaderFuncionality = () => {
	window.addEventListener("scroll", () => {
		evaluateHeaderPosition();
	});
};

window.evaluateHeaderPosition = () => {
	if (window.scrollY > 16) {
		headerElement.firstElementChild.classList.add(...stickyClassesContainer);
		headerElement.firstElementChild.classList.remove(
			...unstickyClassesContainer,
		);
		headerElement.classList.add(...stickyClasses);
		headerElement.classList.remove(...unstickyClasses);
		document.getElementById("menu").classList.add("top-[56px]");
		document.getElementById("menu").classList.remove("top-[75px]");
	} else {
		headerElement.firstElementChild.classList.remove(...stickyClassesContainer);
		headerElement.firstElementChild.classList.add(...unstickyClassesContainer);
		headerElement.classList.add(...unstickyClasses);
		headerElement.classList.remove(...stickyClasses);
		document.getElementById("menu").classList.remove("top-[56px]");
		document.getElementById("menu").classList.add("top-[75px]");
	}
};

document.getElementById("darkToggle").addEventListener("click", () => {
	document.documentElement.classList.add("duration-300");

	if (document.documentElement.classList.contains("dark")) {
		localStorage.removeItem("dark_mode");
		showDay(true);
	} else {
		localStorage.setItem("dark_mode", true);
		showNight(true);
	}
});

function showDay(animate) {
	const shouldChangeTheme = Boolean(animate);
	const shouldAnimate = shouldChangeTheme && !prefersReducedMotion();
	document.getElementById("sun").classList.remove("setting");
	document.getElementById("moon").classList.remove("rising");

	let timeout = 0;

	if (shouldAnimate) {
		timeout = 500;

		document.getElementById("moon").classList.add("setting");
	}

	setTimeout(() => {
		window.darkMode = false;
		document.getElementById("dayText").classList.remove("hidden");
		document.getElementById("nightText").classList.add("hidden");
		document.getElementById("darkToggle").setAttribute("aria-pressed", "false");
		document
			.getElementById("darkToggle")
			.setAttribute("aria-label", "Switch to dark mode");

		document.getElementById("moon").classList.add("hidden");
		document.getElementById("sun").classList.remove("hidden");

		if (shouldChangeTheme) {
			document.documentElement.classList.remove("dark");
			if (shouldAnimate) document.getElementById("sun").classList.add("rising");
		}
	}, timeout);
}

function showNight(animate) {
	const shouldChangeTheme = Boolean(animate);
	const shouldAnimate = shouldChangeTheme && !prefersReducedMotion();
	document.getElementById("moon").classList.remove("setting");
	document.getElementById("sun").classList.remove("rising");

	let timeout = 0;

	if (shouldAnimate) {
		timeout = 500;

		document.getElementById("sun").classList.add("setting");
	}

	setTimeout(() => {
		window.darkMode = true;
		document.getElementById("nightText").classList.remove("hidden");
		document.getElementById("dayText").classList.add("hidden");
		document.getElementById("darkToggle").setAttribute("aria-pressed", "true");
		document
			.getElementById("darkToggle")
			.setAttribute("aria-label", "Switch to light mode");

		document.getElementById("sun").classList.add("hidden");
		document.getElementById("moon").classList.remove("hidden");

		if (shouldChangeTheme) {
			document.documentElement.classList.add("dark");
			if (shouldAnimate)
				document.getElementById("moon").classList.add("rising");
		}
	}, timeout);
}

function getCurrentSectionFromScroll() {
	const sectionIds = [
		"home",
		"research-goals",
		"publications",
		"about",
		"extras",
	];
	const threshold = 120; // px from top (below header)
	let currentId = "home";
	for (const id of sectionIds) {
		const el = document.getElementById(id);
		if (!el) continue;
		const rect = el.getBoundingClientRect();
		if (rect.top <= threshold) currentId = id;
	}
	return currentId;
}

let scrollTimeout = null;
function updateMenuOnScroll() {
	if (scrollTimeout) return;
	scrollTimeout = requestAnimationFrame(() => {
		const sectionId = getCurrentSectionFromScroll();
		const hash = sectionId === "home" ? "" : `#${sectionId}`;
		applyMenuItemClasses(hash);
		scrollTimeout = null;
	});
}

window.applyMenuItemClasses = (forceHash) => {
	const menuItems = document.querySelectorAll("#menu a");
	let currentHash =
		forceHash !== undefined
			? forceHash || "#home"
			: window.location.hash || "#home";
	if (currentHash.startsWith("#pub-")) currentHash = "#publications";
	const isHomePage = window.location.pathname === "/";
	for (let i = 0; i < menuItems.length; i++) {
		const href = menuItems[i].getAttribute("href") || "";
		const anchorHash = href.includes("#")
			? href.substring(href.indexOf("#"))
			: "";
		const isCurrent =
			isHomePage &&
			((anchorHash && anchorHash === currentHash) ||
				(href === "/" && currentHash === "#home"));
		if (isCurrent) {
			menuItems[i].classList.add("text-neutral-900", "dark:text-white");
			menuItems[i].setAttribute("aria-current", "location");
		} else {
			menuItems[i].classList.remove("text-neutral-900", "dark:text-white");
			menuItems[i].removeAttribute("aria-current");
		}
	}
};

function mobileMenuFunctionality() {
	document.getElementById("openMenu").addEventListener("click", openMobileMenu);
	document.getElementById("closeMenu").addEventListener("click", () => {
		closeMobileMenu({ returnFocus: true });
	});
	document
		.getElementById("mobileMenuBackground")
		.addEventListener("click", () => {
			closeMobileMenu({ returnFocus: true });
		});
	document.addEventListener("keydown", handleMobileMenuKeydown);
	window.addEventListener("resize", () => {
		if (window.innerWidth >= 768) closeMobileMenu({ returnFocus: false });
	});
}

window.openMobileMenu = () => {
	if (window.innerWidth >= 768) return;
	const openButton = document.getElementById("openMenu");
	const closeButton = document.getElementById("closeMenu");
	const menu = document.getElementById("menu");
	const background = document.getElementById("mobileMenuBackground");

	openButton.hidden = true;
	openButton.setAttribute("aria-expanded", "true");
	closeButton.hidden = false;
	menu.classList.remove("hidden");
	background.classList.add("opacity-0");
	background.classList.remove("hidden");
	document.documentElement.classList.add("mobile-menu-open");
	setPageInert(true);

	setTimeout(() => {
		background.classList.remove("opacity-0");
		menu.querySelector("a")?.focus();
	}, 1);
};

window.closeMobileMenu = ({ returnFocus = false } = {}) => {
	const openButton = document.getElementById("openMenu");
	const closeButton = document.getElementById("closeMenu");
	const menu = document.getElementById("menu");
	const background = document.getElementById("mobileMenuBackground");
	const wasOpen = openButton.getAttribute("aria-expanded") === "true";

	closeButton.hidden = true;
	openButton.hidden = false;
	openButton.setAttribute("aria-expanded", "false");
	menu.classList.add("hidden");
	background.classList.add("hidden");
	background.classList.remove("opacity-0");
	document.documentElement.classList.remove("mobile-menu-open");
	setPageInert(false);
	if (wasOpen && returnFocus) openButton.focus();
};

function setPageInert(isInert) {
	for (const element of document.querySelectorAll(
		"#main-content, body > footer",
	)) {
		if (isInert) element.setAttribute("inert", "");
		else element.removeAttribute("inert");
	}
}

function getMobileMenuFocusables() {
	return [
		document.getElementById("closeMenu"),
		...document.querySelectorAll("#menu a"),
		document.getElementById("darkToggle"),
	].filter((element) => element && !element.hidden);
}

function handleMobileMenuKeydown(event) {
	const isOpen =
		document.getElementById("openMenu").getAttribute("aria-expanded") ===
		"true";
	if (!isOpen) return;
	if (event.key === "Escape") {
		event.preventDefault();
		closeMobileMenu({ returnFocus: true });
		return;
	}
	if (event.key !== "Tab") return;

	const focusables = getMobileMenuFocusables();
	const first = focusables[0];
	const last = focusables[focusables.length - 1];
	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
}
