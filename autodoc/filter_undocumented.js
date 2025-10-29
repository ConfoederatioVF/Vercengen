/**
 * Removes inferred members (getters/setters/fields) that have no explicit docs.
 */
exports.handlers = {
	processingComplete(e) {
		e.doclets = e.doclets.filter((d) => {
			// Keep if it's your top class or explicitly documented
			if (d.kind === "class") return true;
			if (typeof d.comment === "string" && d.comment.trim().length > 4) {
				return true;
			}
			return false;
		});
	}
};