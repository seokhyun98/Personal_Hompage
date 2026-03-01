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
	window.addEventListener("hashchange", applyMenuItemClasses);
	window.addEventListener("scroll", updateMenuOnScroll, { passive: true });
	evaluateHeaderPosition();
	mobileMenuFunctionality();
	smoothScrollMenuLinks();
});

function smoothScrollMenuLinks() {
	document.querySelectorAll("#menu a").forEach((link) => {
		link.addEventListener("click", (e) => {
			const href = link.getAttribute("href") || "";
			if (href === "/" || href.startsWith("/#")) {
				e.preventDefault();
				const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "#home";
				const id = hash === "#home" ? "home" : hash.slice(1);
				const target = document.getElementById(id);
				if (target) {
					target.scrollIntoView({ behavior: "smooth", block: "start" });
					applyMenuItemClasses(hash);
				}
				if (typeof closeMobileMenu === "function") closeMobileMenu();
			}
		});
	});
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
	document.getElementById("sun").classList.remove("setting");
	document.getElementById("moon").classList.remove("rising");

	let timeout = 0;

	if (animate) {
		timeout = 500;

		document.getElementById("moon").classList.add("setting");
	}

	setTimeout(() => {
		document.getElementById("dayText").classList.remove("hidden");
		document.getElementById("nightText").classList.add("hidden");

		document.getElementById("moon").classList.add("hidden");
		document.getElementById("sun").classList.remove("hidden");

		if (animate) {
			document.documentElement.classList.remove("dark");
			document.getElementById("sun").classList.add("rising");
		}
	}, timeout);
}

function showNight(animate) {
	document.getElementById("moon").classList.remove("setting");
	document.getElementById("sun").classList.remove("rising");

	let timeout = 0;

	if (animate) {
		timeout = 500;

		document.getElementById("sun").classList.add("setting");
	}

	setTimeout(() => {
		document.getElementById("nightText").classList.remove("hidden");
		document.getElementById("dayText").classList.add("hidden");

		document.getElementById("sun").classList.add("hidden");
		document.getElementById("moon").classList.remove("hidden");

		if (animate) {
			document.documentElement.classList.add("dark");
			document.getElementById("moon").classList.add("rising");
		}
	}, timeout);
}

function getCurrentSectionFromScroll() {
	const sectionIds = ["home", "publications", "about", "extras"];
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
		const hash = sectionId === "home" ? "" : "#" + sectionId;
		applyMenuItemClasses(hash);
		scrollTimeout = null;
	});
}

window.applyMenuItemClasses = (forceHash) => {
	const menuItems = document.querySelectorAll("#menu a");
	const currentHash =
		forceHash !== undefined
			? (forceHash || "#home")
			: window.location.hash || "#home";
	for (let i = 0; i < menuItems.length; i++) {
		const href = menuItems[i].getAttribute("href") || "";
		const anchorHash = href.includes("#") ? href.substring(href.indexOf("#")) : "";
		if (
			(anchorHash && anchorHash === currentHash) ||
			(href === "/" && currentHash === "#home")
		) {
			menuItems[i].classList.add("text-neutral-900", "dark:text-white");
		} else {
			menuItems[i].classList.remove("text-neutral-900", "dark:text-white");
		}
	}
};

function mobileMenuFunctionality() {
	document.getElementById("openMenu").addEventListener("click", () => {
		openMobileMenu();
	});

	document.getElementById("closeMenu").addEventListener("click", () => {
		closeMobileMenu();
	});
}

window.openMobileMenu = () => {
	document.getElementById("openMenu").classList.add("hidden");
	document.getElementById("closeMenu").classList.remove("hidden");
	document.getElementById("menu").classList.remove("hidden");
	document.getElementById("mobileMenuBackground").classList.add("opacity-0");
	document.getElementById("mobileMenuBackground").classList.remove("hidden");

	setTimeout(() => {
		document
			.getElementById("mobileMenuBackground")
			.classList.remove("opacity-0");
	}, 1);
};

window.closeMobileMenu = () => {
	document.getElementById("closeMenu").classList.add("hidden");
	document.getElementById("openMenu").classList.remove("hidden");
	document.getElementById("menu").classList.add("hidden");
	document.getElementById("mobileMenuBackground").classList.add("hidden");
};
