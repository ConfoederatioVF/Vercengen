//Requires puppeteer, puppeteer-extra-plugin-stealth
{
	if (!global.CURL)
		/**
		 * The namespace for all CURL/Puppeteer utility functions.
		 *
		 * @namespace CURL
		 */
		global.CURL = {};
	
	/**
	 * Adds margins to a screenshot using an HTML5 canvas.
	 * @alias CURL.addMarginsToScreenshot
	 *
	 * @param {Object} arg0_screenshot_buffer - The current screenshot buffer.
	 * @param {Object} arg1_options
	 *  @param {number} arg1_options.height
	 *  @param {number} arg1_options.width
	 *  @param {number} [arg1_options.margin_bottom=0]
	 *  @param {number} [arg1_options.margin_left=0]
	 *  @param {number} [arg1_options.margin_right=0]
	 *  @param {number} [arg1_options.margin_top=0]
	 *
	 * @returns {Buffer}
	 */
	CURL.addMarginsToScreenshot = async function (arg0_screenshot_buffer, arg1_options) {
		//Convert from parameters
		let screenshot_buffer = arg0_screenshot_buffer;
		let options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		let { createCanvas, loadImage } = require("canvas");
		
		//Create a canvas with specified dimensions
		let canvas = createCanvas(options.width, options.height);
		let ctx = canvas.getContext("2d");
		
		//Fill the canvas with a white background
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, options.width, options.height);
		
		//Load the screenshot image
		let img = await loadImage(screenshot_buffer);
		
		//Draw the screenshot on the canvas with margins
		ctx.drawImage(img,
			options.margin_left,
			options.margin_top,
			options.width - options.margin_left - options.margin_right,
			options.height - options.margin_top - options.margin_bottom
		);
		
		//Return statement
		return canvas.toBuffer();
	};
	
	/**
	 * Moves a slider element to its minimum value.
	 * @alias CURL.adjustSliderToMin
	 *
	 * @param {Object} arg0_el - The Puppeteer element handle.
	 */
	CURL.adjustSliderToMin = async function (arg0_el) {
		//Convert from parameters
		let slider_el = arg0_el;
		
		//Get the size of the slider, calculate offset to move slider to minimum value
		let slider_size = await slider_el.getRect();
		let x_offset = -slider_size.width / 2;
		
		//Create an actions object; move slider to the minimum value
		let actions = browser_instance.actions({ bridge: true });
		await actions.dragAndDrop(slider_el, { x: x_offset, y: 0 }).perform();
	};
	
	/**
	 * Clicks a given element handle.
	 * @alias CURL.clickElement
	 *
	 * @param {Object} arg0_el - The Puppeteer element handle.
	 */
	CURL.clickElement = async function (arg0_el) {
		//Convert from parameters
		let local_el = arg0_el;
		
		//Click element
		try { await local_el.click(); } catch (e) {}
	};
	
	/**
	 * Fetches or initialises a browser instance.
	 * @alias CURL.getBrowserInstance
	 *
	 * @param {Object} [arg0_options]
	 *  @param {string} [arg0_options.initialise_gpt] - Either 'chat_gpt'/'gemini'/'gemini_flash'.
	 *
	 * @returns {Object}
	 */
	CURL.getBrowserInstance = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Guard clause if already connected
		if (global.browser_instance)
			if (await CURL.isPageConnected(global.browser_instance)) {
				return global.browser_instance;
			} else {
				console.log(`Page isn't connected. Restarting browser instance.`);
				delete global.browser_instance;
			}
		
		//Declare local instance variables
		global.browser_instance = await CURL.initialiseChrome();
		await CURL.sleep(Math.randomNumber(1500, 2000));
		
		//Options handler
		if (options.initialise_gpt)
			return await initialiseBrowserGPT(options.initialise_gpt);
		
		//Return statement
		return global.browser_instance;
	};
	
	/**
	 * Fetches plaintext from specific CSS selectors on a URL.
	 * @alias CURL.getPlaintextFromSelectors
	 *
	 * @param {string} arg0_url
	 * @param {string|string[]} arg1_selectors
	 *
	 * @returns {string}
	 */
	CURL.getPlaintextFromSelectors = async function (arg0_url, arg1_selectors) {
		//Convert from parameters
		let url = arg0_url;
		let selectors = Array.toArray(arg1_selectors);
		
		//Declare local instance variables
		let html = await CURL.getWebsiteHTML(url);
		
		if (html) {
			let dom = new JSDOM.JSDOM(html);
			let plaintext = ``;
			let website_body = dom.window.document.body;
			
			for (let i = 0; i < selectors.length; i++) {
				let local_elements = website_body.querySelectorAll(selectors[i]);
				let local_string = ``;
				
				for (let x = 0; x < local_elements.length; x++)
					local_string += local_elements[x].textContent;
				
				//Append to plaintext
				plaintext += local_string;
			}
			
			//Return statement
			return plaintext;
		} else {
			return "";
		}
	};
	
	/**
	 * Fetches the HTML content of a website, falling back to Puppeteer if needed.
	 * @alias CURL.getWebsiteHTML
	 *
	 * @param {string} arg0_url
	 *
	 * @returns {string}
	 */
	CURL.getWebsiteHTML = async function (arg0_url) {
		//Convert from parameters
		let url = arg0_url;
		
		//Declare local instance variables
		let fetch_html;
		let fetch_website;
		
		//Function body
		try {
			fetch_website = sync_request("GET", url);
			fetch_html = fetch_website.getBody("utf8");
		} catch (e) {
			fetch_html = "";
		}
		
		//Use Chrome profile instead if website HTML could not be fetched normally
		if (!fetch_html) {
			let chrome_instance = await puppeteer.launch();
			let page = await chrome_instance.newPage();
			
			await page.goto(url, { waitUntil: "networkidle2" });
			fetch_html = await page.content();
			await chrome_instance.close();
		}
		
		//Return statement
		return fetch_html;
	};
	
	/**
	 * Fetches all anchor links from a URL with filtering options.
	 * @alias CURL.getWebsiteLinks
	 *
	 * @param {string} arg0_url
	 * @param {Object} [arg1_options]
	 *  @param {string[]} [arg1_options.allowed_domains]
	 *  @param {string[]} [arg1_options.exclude_domains]
	 *  @param {number} [arg1_options.attempts=1]
	 *  @param {number} [arg1_options.max_attempts=15]
	 *
	 * @returns {string[]}
	 */
	CURL.getWebsiteLinks = async function (arg0_url, arg1_options) {
		//Convert from parameters
		let url = arg0_url;
		let options = (arg1_options) ? arg1_options : {};
		
		//Initialise options
		if (options.attempts === undefined) options.attempts = 1;
		if (options.max_attempts === undefined) options.max_attempts = 15;
		
		//Declare local instance variables
		let attempt_to_reconnect = false;
		let html = await CURL.getWebsiteHTML(url);
		let links = [];
		
		if (html) {
			let dom = new JSDOM.JSDOM(html);
			let website_body = dom.window.document.body;
			let all_link_els = website_body.querySelectorAll(`a`);
			
			for (let i = 0; i < all_link_els.length; i++) {
				try {
					let local_href = new URL(all_link_els[i].getAttribute("href"), url).href;
					if (local_href) links.push(local_href);
				} catch (e) {}
			}
			
			//If there's no all_link_els, try again
			if (links.length === 0) attempt_to_reconnect = true;
			
			//Filter links if options.allowed_domains is defined
			if (options.allowed_domains) {
				let processed_links = [];
				
				for (let i = 0; i < links.length; i++)
					for (let x = 0; x < options.allowed_domains.length; x++)
						if (links[i].includes(options.allowed_domains[x])) {
							let link_allowed = true;
							
							if (options.exclude_domains)
								for (let y = 0; y < options.exclude_domains.length; y++)
									if (links[i].includes(options.exclude_domains[y]))
										link_allowed = false;
							
							if (link_allowed) processed_links.push(links[i]);
							break;
						}
				
				links = processed_links;
			}
		} else {
			attempt_to_reconnect = true;
		}
		
		if (attempt_to_reconnect && options.attempts < options.max_attempts) {
			let random_delay = Math.randomNumber(500, 10000);
			
			console.log(`Attempt ${options.attempts} failed to fetch links. Retrying after ${random_delay}ms ..`);
			options.attempts++;
			
			await CURL.sleep(random_delay);
			return await CURL.getWebsiteLinks(url, options);
		}
		
		//Return statement
		return Array.unique(links);
	};
	
	/**
	 * Fetches and returns a stripped plaintext version of a website.
	 * @alias CURL.getWebsitePlaintext
	 *
	 * @param {string} arg0_url
	 *
	 * @returns {string}
	 */
	CURL.getWebsitePlaintext = async function (arg0_url) {
		//Convert from parameters
		let url = arg0_url;
		
		//Declare local instance variables
		let fetch_html = await CURL.getWebsiteHTML(url);
		
		//Return statement
		if (fetch_html)
			return CURL.stripHTML(fetch_html);
	};
	
	/**
	 * Generates a plaintext string dump from specific scraping rules.
	 * @alias CURL.generatePlaintext
	 *
	 * @param {Object} arg0_options
	 *  @param {boolean} [arg0_options.cache=false] - Whether to cache the current dump.
	 *  @param {string} [arg0_options.cache_folder='./cache/']
	 *  @param {string} [arg0_options.cache_prefix='']
	 *  @param {Object[]} arg0_options.scrape_urls
	 *
	 * @returns {string}
	 */
	CURL.generatePlaintext = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		if (!options.cache_folder) options.cache_folder = `./cache/`;
		if (!options.cache_prefix) options.cache_prefix = "";
		
		//Declare local instance variables
		let scrape_urls = (options.scrape_urls) ? Array.toArray(options.scrape_urls) : [];
		let string = ``;
		
		//Iterate over scrape_urls and parse websites
		for (let i = 0; i < scrape_urls.length; i++)
			string += await CURL.generatePlaintextRecursively(JSON.parse(JSON.stringify(scrape_urls[i])));
		
		//Cache to /cache if options.cache is true
		if (options.cache) {
			let cache_file_name = `${options.cache_folder}${options.cache_prefix}${ABRS.returnDateString()}.txt`;
			CURL.writeTextFile(cache_file_name, string);
		}
		
		//Return statement
		return string;
	};
	
	/**
	 * Helper function for generatePlaintext() to handle recursion and DOM traversal.
	 * @alias CURL.generatePlaintextRecursively
	 *
	 * @param {Object} arg0_options
	 *
	 * @returns {string}
	 */
	CURL.generatePlaintextRecursively = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		if (options.depth === undefined) options.depth = 0;
		if (options.crawled_pages === undefined) options.crawled_pages = [];
		
		if (options.selectors[options.depth] === undefined) options.selectors[options.depth] = {};
		
		//Declare local instance variables
		let selectors = options.selectors[options.depth];
		let string = ``;
		let website_html = await CURL.getWebsiteHTML(options.url);
		
		let dom = new JSDOM.JSDOM(website_html);
		let website_body = dom.window.document.body;
		
		console.log(`Scraping`, options.url);
		
		//1. Scrape iframes handler (replace HTML)
		if (selectors.scrape_iframes) {
			let all_iframe_els = website_body.querySelectorAll(`iframe`);
			
			for (let i = 0; i < all_iframe_els.length; i++)
				try {
					let local_href = new URL(all_iframe_els[i].getAttribute("href"), options.url).href;
					
					if (local_href)
						all_iframe_els[i].outerHTML = await CURL.getWebsiteHTML(local_href);
				} catch (e) {}
		}
		
		//2. Exclude elements from website DOM first
		if (selectors.exclude)
			for (let i = 0; i < selectors.exclude.length; i++) {
				let local_els = website_body.querySelectorAll(selectors.exclude[i]);
				for (let x = 0; x < local_els.length; x++)
					local_els[x].remove();
			}
		
		//3. Fetch include_els for later processing
		let include_els_html = [];
		
		if (selectors.include) {
			for (let i = 0; i < selectors.include.length; i++) {
				let local_els = website_body.querySelectorAll(selectors.include[i]);
				
				for (let x = 0; x < local_els.length; x++)
					if (!include_els_html.includes(local_els[x].outerHTML)) {
						include_els_html.push(local_els[x].outerHTML);
					}
			}
		} else {
			include_els_html.push(website_body.outerHTML);
		}
		
		//4. Strip HTML
		for (let i = 0; i < include_els_html.length; i++)
			string += CURL.stripHTML(include_els_html[i]) + "\n";
		
		//5. Recursive depth handler
		if (options.depth < options.recursive_depth) {
			let current_website_links = await CURL.getWebsiteLinks(options.url, {
				allowed_domains: options.recursive_links,
				exclude_domains: options.recursive_exclude_links
			});
			
			for (let i = 0; i < current_website_links.length; i++)
				if (!options.crawled_pages.includes(current_website_links[i])) {
					let new_options = JSON.parse(JSON.stringify(options));
					new_options.crawled_pages.push(options.url);
					new_options.url = current_website_links[i];
					new_options.depth++;
					
					let local_page_plaintext = await CURL.generatePlaintextRecursively(new_options);
					if (local_page_plaintext) string += local_page_plaintext;
				}
		}
		
		//Return statement
		return string;
	};
	
	/**
	 * Fetches a specific element handle using CSS selectors.
	 * @alias CURL.getElement
	 *
	 * @param {Object} arg0_browser_instance
	 * @param {string} arg1_query_selector
	 *
	 * @returns {Object}
	 */
	CURL.getElement = async function (arg0_browser_instance, arg1_query_selector) {
		//Convert from parameters
		let browser_instance = arg0_browser_instance;
		let query_selector = arg1_query_selector;
		
		//Wait for the element to be located and visible
		let element = await browser_instance.wait(until.elementLocated(By.css(query_selector)), 10000);
		await browser_instance.wait(until.elementIsVisible(element), 10000);
		await browser_instance.wait(until.elementIsEnabled(element), 10000);
		
		//Return statement
		return element;
	};
	
	/**
	 * Initialises a Chrome instance and connects Puppeteer.
	 * @alias CURL.initialiseChrome
	 *
	 * @returns {Object}
	 */
	CURL.initialiseChrome = async function () {
		//Open chrome browser first
		exec(settings.chrome_launch_cmd);
		await CURL.sleep(1500);
		
		//Connect to chrome browser afterwards
		let chrome_browser = await puppeteer.connect({
			browserURL: "http://localhost:9222",
			defaultViewport: null
		});
		let pages = await chrome_browser.pages();
		
		//Set initial viewport
		await pages[0].setViewport({ width: 1080, height: 1080 });
		global.browser_instance = pages[0];
		
		//Return statement
		return pages[0];
	};
	
	/**
	 * Checks if a browser instance page is still connected.
	 * @alias CURL.isPageConnected
	 *
	 * @param {Object} arg0_browser_instance
	 *
	 * @returns {boolean}
	 */
	CURL.isPageConnected = async function (arg0_browser_instance) {
		//Convert from parameters
		let chrome_instance = arg0_browser_instance;
		
		//Try/catch return block
		try {
			await chrome_instance.title();
			return true;
		} catch (e) {
			return false;
		}
	};
	
	/**
	 * Takes multi-page or full-page screenshots from a Puppeteer instance.
	 * @alias CURL.screenshotHTML
	 *
	 * @param {Object} arg0_browser_instance
	 * @param {string} arg1_path
	 * @param {Object} [arg2_options]
	 *  @param {boolean} [arg2_options.full_page=false]
	 *  @param {number} [arg2_options.height=794]
	 *  @param {number} [arg2_options.width=1531]
	 *  @param {number} [arg2_options.margin_bottom=20]
	 */
	CURL.screenshotHTML = async function (arg0_browser_instance, arg1_path, arg2_options) {
		//Convert from parameters
		let browser_instance = arg0_browser_instance;
		let path = arg1_path;
		let options = (arg2_options) ? arg2_options : {};
		
		//Initialise options
		if (options.height === undefined) options.height = 794;
		if (options.width === undefined) options.width = 1531;
		
		if (options.margin_bottom === undefined) options.margin_bottom = 20;
		if (options.margin_left === undefined) options.margin_left = 20;
		if (options.margin_top === undefined) options.margin_top = 20;
		if (options.margin_right === undefined) options.margin_right = 20;
		
		//Function body
		try {
			await browser_instance.setViewport({ width: options.width, height: options.height });
			
			if (!options.full_page) {
				let body_handle = await browser_instance.$("body");
				let { height } = await body_handle.boundingBox();
				await body_handle.dispose();
				
				let line_positions = await browser_instance.evaluate(() => {
					let lines = [];
					let node;
					let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
					
					while (node = walker.nextNode()) {
						let range = document.createRange();
						range.selectNodeContents(node);
						let rects = range.getClientRects();
						for (let rect of rects) lines.push(rect.top);
					}
					return lines;
				});
				
				let split_points = [0];
				for (let i = 1; i < line_positions.length; i++)
					if (line_positions[i] - split_points[split_points.length - 1] > options.height)
						split_points.push(line_positions[i - 1]);
				split_points.push(height);
				
				for (let i = 0; i < split_points.length - 1; i++) {
					let clip_height = split_points[i + 1] - split_points[i];
					let screenshot_buffer = await browser_instance.screenshot({
						clip: {
							x: 0,
							y: split_points[i],
							width: await (browser_instance.evaluate(() => document.body.clientWidth)),
							height: clip_height
						}
					});
					
					let padded_screenshot_buffer = await CURL.addMarginsToScreenshot(screenshot_buffer, {
						height: clip_height + options.margin_top + options.margin_bottom,
						width: options.width,
						margin_bottom: options.margin_bottom,
						margin_left: options.margin_left,
						margin_right: options.margin_right,
						margin_top: options.margin_top
					});
					
					fs.writeFileSync(`${path}_${i + 1}.png`, padded_screenshot_buffer);
				}
			} else {
				let height = await browser_instance.evaluate(() => document.documentElement.scrollHeight);
				await browser_instance.setViewport({ width: options.width, height: Math.ceil(height) + 48 });
				await browser_instance.screenshot({ path: `${path}_full.png` });
			}
		} catch (e) {
			console.error(`Error taking A4 screenshots: ${e}`);
		}
	};
	
	/**
	 * Pauses execution for a specified duration.
	 * @alias CURL.sleep
	 *
	 * @param {number} arg0_ms
	 *
	 * @returns {Promise}
	 */
	CURL.sleep = function (arg0_ms) {
		//Convert from parameters
		let ms = arg0_ms;
		
		//Return statement
		return new Promise(resolve => setTimeout(resolve, ms));
	};
	
	/**
	 * Strips HTML tags and excessive whitespace from a string.
	 * @alias CURL.stripHTML
	 *
	 * @param {string} arg0_html
	 *
	 * @returns {string}
	 */
	CURL.stripHTML = function (arg0_html) {
		//Convert from parameters
		let html = arg0_html;
		
		//Declare local instance variables
		let dom = new JSDOM.JSDOM(html);
		
		if (dom) {
			let website_body = dom.window.document.body;
			let remove_elements = website_body.querySelectorAll(`script, style`);
			
			for (let i = 0; i < remove_elements.length; i++)
				remove_elements[i].remove();
			
			let plaintext = website_body.textContent || "";
			let pt_lines = plaintext.split("\n");
			let pt_formatted = pt_lines.map((line) => line.trim())
			.filter((line) => line.length > 0).join("\n");
			
			//Return statement
			return pt_formatted.trim();
		}
	};
	
	/**
	 * Waits for content to stop changing within a selector.
	 * @alias CURL.waitForStableContent
	 *
	 * @param {Object} arg0_browser_instance
	 * @param {string} arg1_selector
	 * @param {number} [arg2_interval=3000]
	 */
	CURL.waitForStableContent = async function (arg0_browser_instance, arg1_selector, arg2_interval) {
		//Convert from parameters
		let chrome_instance = arg0_browser_instance;
		let selector = arg1_selector;
		let interval = (arg2_interval) ? arg2_interval : 3000;
		
		//Wait for function inside of page
		await chrome_instance.waitForFunction(
			(selector) => {
				let local_elements = document.querySelectorAll(selector);
				if (local_elements.length === 0) return false;
				
				let last_element = local_elements[local_elements.length - 1];
				
				if (!window.previous_html) {
					window.previous_html = last_element.innerHTML;
					return false;
				}
				
				let current_html = last_element.innerHTML;
				
				if (current_html === window.previous_html) {
					return true;
				} else {
					window.previous_html = current_html;
					return false;
				}
			},
			{ polling: interval, timeout: 0 },
			selector
		);
	};
	
	/**
	 * Writes a text file to a specified path.
	 * @alias CURL.writeTextFile
	 *
	 * @param {string} arg0_filepath
	 * @param {string} arg1_text
	 */
	CURL.writeTextFile = function (arg0_filepath, arg1_text) {
		//Convert from parameters
		let file_path = arg0_filepath;
		let text = arg1_text;
		
		//Write to file
		try {
			fs.writeFileSync(file_path, text);
		} catch (e) {
			console.error(e);
		}
	};
}