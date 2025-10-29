// This plugin waits a tick until after Minami finishes writing,
// then injects CSS/JS into the generated HTML files.
const fs = require("fs");
const path = require("path");

exports.handlers = {
	processingComplete(e) {
		const opts = e.opts || {};
		const docsDir = path.resolve(opts.destination || "./docs");
		
		// Use a short timeout to run AFTER the template finishes writing files
		setTimeout(() => {
			function walk(dir) {
				for (const entry of fs.readdirSync(dir)) {
					const full = path.join(dir, entry);
					const stat = fs.statSync(full);
					if (stat.isDirectory()) walk(full);
					else if (full.endsWith(".html")) inject(full);
				}
			}
			
			function inject(filePath) {
				let html = fs.readFileSync(filePath, "utf8");
				// avoid injecting twice
				if (html.includes("autodoc/css/information_layout.css")) return;
				
				html = html.replace(
					/<\/head>/i,
					`
						<link rel="stylesheet" href="../autodoc/css/global.css">
						<link rel="stylesheet" href="./autodoc/css/global.css">
					</head>`
				);
				html = html.replace(
					/<\/body>/i,
					'<script src="autodoc/js/custom.js"></script>\n</body>'
				);
				fs.writeFileSync(filePath, html, "utf8");
			}
			
			walk(docsDir);
			console.log("✅ Injected custom CSS/JS into docs output");
		}, 500);
	}
};